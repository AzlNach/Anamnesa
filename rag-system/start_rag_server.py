#!/usr/bin/env python3
"""
Start RAG Server Script
Script untuk memulai persistent RAG server daemon
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_server_health(port=8001, max_attempts=30):
    """Check if RAG server is running and healthy"""
    url = f"http://localhost:{port}/health"
    
    for attempt in range(max_attempts):
        try:
            response = requests.get(url, timeout=2)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ RAG Server is healthy!")
                print(f"   Status: {data.get('status')}")
                print(f"   Documents: {data.get('total_documents')}")
                print(f"   Initialization time: {data.get('initialization_time')}s")
                return True
        except requests.RequestException:
            pass
        
        print(f"⏳ Waiting for server... ({attempt + 1}/{max_attempts})")
        time.sleep(1)
    
    return False

def start_server(port=8001):
    """Start RAG server daemon"""
    current_dir = Path(__file__).parent
    server_script = current_dir / 'rag_server_daemon.py'
    
    if not server_script.exists():
        print(f"❌ Server script not found: {server_script}")
        return False
    
    print(f"🚀 Starting RAG Server on port {port}...")
    print(f"📂 Working directory: {current_dir}")
    
    # Set environment variable for port
    env = os.environ.copy()
    env['RAG_SERVER_PORT'] = str(port)
    
    try:
        # Start server process
        process = subprocess.Popen(
            [sys.executable, str(server_script)],
            cwd=str(current_dir),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        print(f"🔧 Server process started (PID: {process.pid})")
        
        # Monitor server startup
        startup_timeout = 60  # 60 seconds for initialization
        start_time = time.time()
        
        while process.poll() is None:  # Process still running
            if time.time() - start_time > startup_timeout:
                print("⏰ Server startup timeout")
                process.terminate()
                return False
                
            # Check if server is responding
            if check_server_health(port, max_attempts=1):
                print(f"🎉 RAG Server successfully started!")
                print(f"🌐 Server URL: http://localhost:{port}")
                print(f"📍 Health check: http://localhost:{port}/health")
                print(f"🔍 Query endpoint: http://localhost:{port}/query")
                print("\nServer is running. Press Ctrl+C to stop.")
                
                try:
                    # Keep monitoring
                    while process.poll() is None:
                        output = process.stdout.readline()
                        if output:
                            print(output.strip())
                        time.sleep(0.1)
                except KeyboardInterrupt:
                    print("\n🛑 Stopping server...")
                    process.terminate()
                    process.wait(timeout=10)
                    print("✅ Server stopped.")
                
                return True
            
            time.sleep(1)
        
        # Process terminated
        return_code = process.poll()
        print(f"❌ Server process terminated with code {return_code}")
        return False
        
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return False

def test_server(port=8001):
    """Test server with sample query"""
    url = f"http://localhost:{port}/query"
    test_query = "Apa itu demam?"
    
    print(f"🧪 Testing server with query: '{test_query}'")
    
    try:
        response = requests.post(url, json={
            'query': test_query,
            'max_docs': 3,
            'context': 'general'
        }, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            query_time = result.get('metadata', {}).get('query_time', 0)
            print(f"✅ Test successful! Response time: {query_time}s")
            print(f"📝 Response: {result.get('response', '')[:100]}...")
            return True
        else:
            print(f"❌ Test failed: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='RAG Server Management')
    parser.add_argument('--port', type=int, default=8001, help='Server port (default: 8001)')
    parser.add_argument('--test', action='store_true', help='Test existing server')
    parser.add_argument('--health', action='store_true', help='Check server health')
    
    args = parser.parse_args()
    
    if args.health:
        if check_server_health(args.port, max_attempts=3):
            print("✅ Server is healthy")
            sys.exit(0)
        else:
            print("❌ Server is not responding")
            sys.exit(1)
    
    elif args.test:
        if test_server(args.port):
            print("✅ Server test passed")
            sys.exit(0)
        else:
            print("❌ Server test failed")
            sys.exit(1)
    
    else:
        # Start server
        if start_server(args.port):
            sys.exit(0)
        else:
            sys.exit(1)

if __name__ == "__main__":
    main()