#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RAG Server Daemon - HTTP server yang berjalan persistent
Menghindari cold start setiap API call
"""

import json
import sys
import os
import time
import threading
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import io

# Set UTF-8 encoding
if sys.platform.startswith('win'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

sys.path.append(str(Path(__file__).parent))
from retriever import RAGRetriever

class RAGHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler untuk RAG queries"""
    
    # Class-level retriever instance (shared across all requests)
    _retriever = None
    _initialization_time = 0
    _query_count = 0
    _lock = threading.Lock()
    
    @classmethod
    def initialize_retriever(cls, gemini_api_key: str, data_folder_path: str):
        """Initialize RAG retriever once at server startup"""
        if cls._retriever is None:
            print("🚀 Initializing RAG Retriever...")
            start_time = time.time()
            
            try:
                cls._retriever = RAGRetriever(gemini_api_key, data_folder_path=data_folder_path)
                cls._initialization_time = time.time() - start_time
                print(f"✅ RAG Retriever ready in {cls._initialization_time:.4f}s")
                print(f"📊 Loaded {len(cls._retriever.documents)} documents")
                return True
            except Exception as e:
                print(f"❌ Failed to initialize: {e}")
                return False
        return True
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            if self.path == '/query':
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                query = data.get('query', '')
                max_docs = data.get('max_docs', 5)
                context = data.get('context', 'general')
                
                if not query:
                    self._send_error(400, "Query parameter is required")
                    return
                
                # Perform query
                result = self._perform_query(query, max_docs, context)
                self._send_json_response(result)
                
            else:
                self._send_error(404, "Not Found")
                
        except Exception as e:
            self._send_error(500, str(e))
    
    def do_GET(self):
        """Handle GET requests"""
        try:
            parsed_url = urlparse(self.path)
            
            if parsed_url.path == '/health':
                # Health check endpoint
                status = {
                    "status": "ready" if self._retriever else "not_ready",
                    "initialization_time": self._initialization_time,
                    "total_queries": self._query_count,
                    "total_documents": len(self._retriever.documents) if self._retriever else 0
                }
                self._send_json_response(status)
                
            elif parsed_url.path == '/query':
                # GET query support
                params = parse_qs(parsed_url.query)
                query = params.get('q', [''])[0]
                max_docs = int(params.get('max_docs', [5])[0])
                context = params.get('context', ['general'])[0]
                
                if not query:
                    self._send_error(400, "Query parameter 'q' is required")
                    return
                
                result = self._perform_query(query, max_docs, context)
                self._send_json_response(result)
                
            else:
                self._send_error(404, "Not Found")
                
        except Exception as e:
            self._send_error(500, str(e))
    
    def _perform_query(self, query: str, max_docs: int, context: str) -> dict:
        """Perform RAG query with thread safety"""
        if not self._retriever:
            raise RuntimeError("RAG Retriever not initialized")
        
        with self._lock:
            self.__class__._query_count += 1
            query_num = self._query_count
        
        print(f"🔍 Query #{query_num}: '{query[:50]}...'")
        start_time = time.time()
        
        # System prompts
        system_prompts = {
            'anamnesis': """Anda adalah asisten medis AI untuk anamnesis. Berikan informasi yang akurat dan mudah dipahami berdasarkan konteks medis yang tersedia.""",
            'diagnosis': """Anda adalah asisten medis AI untuk diagnosis. Berikan analisis berdasarkan informasi medis yang tersedia.""",
            'general': """Anda adalah asisten medis AI. Berikan informasi medis yang akurat berdasarkan konteks yang disediakan."""
        }
        
        system_prompt = system_prompts.get(context, system_prompts['general'])
        
        # Perform RAG query
        result = self._retriever.rag_query(query, max_docs, system_prompt)
        
        query_time = time.time() - start_time
        
        # Add performance metadata
        result['metadata'].update({
            'query_time': round(query_time, 4),
            'initialization_time': round(self._initialization_time, 4),
            'query_number': query_num,
            'server_mode': 'persistent_daemon'
        })
        
        print(f"⚡ Completed in {query_time:.4f}s")
        return result
    
    def _send_json_response(self, data: dict):
        """Send JSON response"""
        response_data = json.dumps(data, ensure_ascii=False, indent=2)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(response_data.encode('utf-8'))))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        self.wfile.write(response_data.encode('utf-8'))
    
    def _send_error(self, code: int, message: str):
        """Send error response"""
        error_data = {
            'error': message,
            'code': code,
            'timestamp': time.time()
        }
        
        response_data = json.dumps(error_data, ensure_ascii=False, indent=2)
        
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        self.wfile.write(response_data.encode('utf-8'))
    
    def log_message(self, format, *args):
        """Custom log format"""
        print(f"{self.address_string()} - {format % args}")

def main():
    """Main function to start RAG server daemon"""
    # Setup paths
    current_dir = Path(__file__).parent
    env_file = current_dir.parent / '.env.local'
    data_folder_path = current_dir / 'data'
    
    # Load environment variables
    gemini_api_key = None
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                if line.startswith('GOOGLE_API_KEY='):
                    gemini_api_key = line.split('=', 1)[1].strip()
                    break
    
    if not gemini_api_key:
        print("❌ Error: GOOGLE_API_KEY not found in .env.local")
        sys.exit(1)
    
    if not data_folder_path.exists():
        print(f"❌ Error: Data folder not found at {data_folder_path}")
        sys.exit(1)
    
    # Initialize RAG retriever
    if not RAGHandler.initialize_retriever(gemini_api_key, str(data_folder_path)):
        print("❌ Failed to initialize RAG retriever")
        sys.exit(1)
    
    # Start HTTP server
    port = int(os.getenv('RAG_SERVER_PORT', 8001))
    server = HTTPServer(('localhost', port), RAGHandler)
    
    print(f"🚀 RAG Server daemon started on http://localhost:{port}")
    print("📍 Available endpoints:")
    print(f"   GET  http://localhost:{port}/health")
    print(f"   GET  http://localhost:{port}/query?q=your_query")
    print(f"   POST http://localhost:{port}/query")
    print("\nPress Ctrl+C to stop")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down RAG server...")
        server.shutdown()

if __name__ == "__main__":
    main()