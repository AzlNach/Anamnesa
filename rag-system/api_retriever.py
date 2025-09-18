#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enhanced API Retriever for RAG System with Hybrid Search
Script yang dipanggil dari Next.js API route untuk melakukan hybrid RAG query
"""

import json
import sys
import os
import io
import time
import signal
from pathlib import Path
from typing import Dict, Any

# Set UTF-8 encoding for stdout
if sys.platform.startswith('win'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add the parent directory to Python path to import our modules
sys.path.append(str(Path(__file__).parent))

# Import our modules
try:
    from hybrid_search_engine import HybridSearchEngine
    from retriever import RAGRetriever  # Fallback to original retriever
    HYBRID_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Hybrid search not available: {e}", file=sys.stderr)
    from retriever import RAGRetriever
    HYBRID_AVAILABLE = False

import google.generativeai as genai

class TimeoutException(Exception):
    """Custom exception for timeout handling"""
    pass

def timeout_handler(signum, frame):
    """Signal handler for timeout"""
    raise TimeoutException("Operation timed out")

class EnhancedRAGRetriever:
    """Enhanced RAG Retriever with hybrid search capabilities"""
    
    def __init__(self, gemini_api_key: str, data_folder_path: str, 
                 use_hybrid: bool = True, timeout_seconds: int = 30):
        """
        Initialize Enhanced RAG Retriever
        
        Args:
            gemini_api_key: API key for Gemini
            data_folder_path: Path to data folder
            use_hybrid: Whether to use hybrid search (fallback to original if unavailable)
            timeout_seconds: Timeout for operations
        """
        self.gemini_api_key = gemini_api_key
        self.data_folder_path = data_folder_path
        self.use_hybrid = use_hybrid and HYBRID_AVAILABLE
        self.timeout_seconds = timeout_seconds
        
        # Setup Gemini API
        genai.configure(api_key=gemini_api_key)
        self.generation_model = "gemini-1.5-flash"
        
        # Initialize search engines
        if self.use_hybrid:
            self._init_hybrid_search()
        else:
            self._init_original_search()
    
    def _init_hybrid_search(self):
        """Initialize hybrid search engine with robust caching"""
        try:
            # Setup index paths
            index_dir = Path(self.data_folder_path) / 'indexes'
            vector_index_path = index_dir / 'faiss_index.bin'
            vector_metadata_path = index_dir / 'faiss_metadata.pkl'
            bm25_index_path = index_dir / 'bm25_index.pkl'
            cache_info_path = index_dir / 'cache_info.json'
            
            self.hybrid_engine = HybridSearchEngine(
                vector_weight=0.6,
                keyword_weight=0.4,
                use_parallel_search=True,
                rerank_method="adaptive",
                embedding_model="sentence-transformers",  # Faster than Gemini
                gemini_api_key=self.gemini_api_key
            )
            
            # Check if we can use cached indexes
            if self._is_cache_valid(cache_info_path, vector_index_path, vector_metadata_path, bm25_index_path):
                try:
                    print("Loading cached search indexes...", file=sys.stderr)
                    self.hybrid_engine.load_indexes(
                        str(vector_index_path),
                        str(vector_metadata_path), 
                        str(bm25_index_path)
                    )
                    print("Successfully loaded cached search indexes", file=sys.stderr)
                    return
                except Exception as e:
                    print(f"Failed to load cached indexes: {e}", file=sys.stderr)
            
            # Build new indexes from data
            print("Cache invalid or missing, building new indexes...", file=sys.stderr)
            self._build_hybrid_indexes()
            
        except Exception as e:
            print(f"Error initializing hybrid search: {e}", file=sys.stderr)
            self.use_hybrid = False
            self._init_original_search()

    def _is_cache_valid(self, cache_info_path, vector_index_path, vector_metadata_path, bm25_index_path):
        """Check if cached indexes are valid and up to date"""
        try:
            # Check if all index files exist
            if not all(p.exists() for p in [vector_index_path, vector_metadata_path, bm25_index_path]):
                return False
            
            # Check cache info
            if not cache_info_path.exists():
                return False
            
            with open(cache_info_path, 'r') as f:
                cache_info = json.load(f)
            
            # Check if data files have been modified since cache was created
            data_folder = Path(self.data_folder_path)
            cache_timestamp = cache_info.get('timestamp', 0)
            
            for json_file in data_folder.glob('*.json'):
                if json_file.name.startswith('.'):
                    continue
                if json_file.stat().st_mtime > cache_timestamp:
                    print(f"Data file {json_file.name} modified since cache creation", file=sys.stderr)
                    return False
            
            # Additional validation: check document count
            expected_doc_count = cache_info.get('document_count', 0)
            current_doc_count = len(self._count_documents_quickly())
            
            if abs(current_doc_count - expected_doc_count) > 100:  # Allow some tolerance
                print(f"Document count changed significantly: {expected_doc_count} -> {current_doc_count}", file=sys.stderr)
                return False
            
            print(f"Cache validation passed: {expected_doc_count} documents, cache age: {time.time() - cache_timestamp:.1f}s", file=sys.stderr)
            return True
            
        except Exception as e:
            print(f"Cache validation error: {e}", file=sys.stderr)
            return False

    def _count_documents_quickly(self):
        """Quickly count documents without loading content"""
        doc_count = 0
        data_folder = Path(self.data_folder_path)
        
        for json_file in data_folder.glob('*.json'):
            if json_file.name.startswith('.'):
                continue
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    file_data = json.load(f)
                
                if isinstance(file_data, list):
                    doc_count += len([item for item in file_data if 'content' in item or 'title' in item])
                elif isinstance(file_data, dict):
                    if 'papers' in file_data:
                        doc_count += len([p for p in file_data['papers'] if 'content' in p or 'title' in p])
                    elif 'documents' in file_data:
                        doc_count += len([d for d in file_data['documents'] if 'content' in d or 'title' in d])
                    elif 'content' in file_data:
                        doc_count += 1
            except:
                continue
                
        return doc_count
    
    def _build_hybrid_indexes(self):
        """Build hybrid search indexes from data files with progress monitoring"""
        print("Building hybrid search indexes...", file=sys.stderr)
        
        # Load documents with progress
        start_time = time.time()
        documents = self._load_all_documents()
        load_time = time.time() - start_time
        print(f"Document loading completed in {load_time:.2f}s", file=sys.stderr)
        
        if documents:
            # Add documents to hybrid engine with smaller batches for better progress
            print(f"Indexing {len(documents)} documents...", file=sys.stderr)
            index_start = time.time()
            
            self.hybrid_engine.add_documents(documents, batch_size=8)  # Smaller batch size
            
            index_time = time.time() - index_start
            print(f"Indexing completed in {index_time:.2f}s", file=sys.stderr)
            
            # Save indexes for future use
            index_dir = Path(self.data_folder_path) / 'indexes'
            index_dir.mkdir(exist_ok=True)
            
            try:
                save_start = time.time()
                self.hybrid_engine.save_indexes(
                    str(index_dir / 'faiss_index.bin'),
                    str(index_dir / 'faiss_metadata.pkl'),
                    str(index_dir / 'bm25_index.pkl')
                )
                
                # Save cache info
                cache_info = {
                    'timestamp': time.time(),
                    'document_count': len(documents),
                    'build_time': index_time,
                    'load_time': load_time
                }
                
                with open(index_dir / 'cache_info.json', 'w') as f:
                    json.dump(cache_info, f, indent=2)
                
                save_time = time.time() - save_start
                print(f"Indexes saved in {save_time:.2f}s", file=sys.stderr)
                
            except Exception as e:
                print(f"Warning: Could not save indexes: {e}", file=sys.stderr)
        else:
            print("No documents found for indexing", file=sys.stderr)
    
    def _load_all_documents(self) -> list:
        """Load all documents from data folder with progress monitoring"""
        documents = []
        data_folder = Path(self.data_folder_path)
        
        # Get list of JSON files first
        json_files = [f for f in data_folder.glob('*.json') if not f.name.startswith('.')]
        print(f"Found {len(json_files)} JSON files to process", file=sys.stderr)
        
        # Load from JSON files with progress
        for i, json_file in enumerate(json_files, 1):
            try:
                file_start = time.time()
                
                with open(json_file, 'r', encoding='utf-8') as f:
                    file_data = json.load(f)
                
                file_docs = []
                
                # Handle different JSON structures
                if isinstance(file_data, list):
                    for item in file_data:
                        if self._is_valid_document(item):
                            item['data_source'] = json_file.stem
                            file_docs.append(item)
                elif isinstance(file_data, dict):
                    if 'papers' in file_data:
                        for paper in file_data['papers']:
                            if self._is_valid_document(paper):
                                paper['data_source'] = json_file.stem
                                file_docs.append(paper)
                    elif 'documents' in file_data:
                        for doc in file_data['documents']:
                            if self._is_valid_document(doc):
                                doc['data_source'] = json_file.stem
                                file_docs.append(doc)
                    elif self._is_valid_document(file_data):  # Single document
                        file_data['data_source'] = json_file.stem
                        file_docs.append(file_data)
                
                documents.extend(file_docs)
                
                load_time = time.time() - file_start
                print(f"Progress: {i}/{len(json_files)} - {json_file.name}: {len(file_docs)} docs in {load_time:.2f}s", file=sys.stderr)
                        
            except Exception as e:
                print(f"Error loading {json_file.name}: {e}", file=sys.stderr)
        
        print(f"Loaded {len(documents)} total documents from data folder", file=sys.stderr)
        return documents

    def _is_valid_document(self, doc: dict) -> bool:
        """Check if a document has required content"""
        if not isinstance(doc, dict):
            return False
        
        # Must have either content or title
        has_content = bool(doc.get('content', '').strip())
        has_title = bool(doc.get('title', '').strip())
        
        return has_content or has_title
    
    def _init_original_search(self):
        """Initialize original RAG retriever as fallback"""
        self.original_retriever = RAGRetriever(
            self.gemini_api_key,
            data_folder_path=self.data_folder_path
        )
    
    def search_documents(self, query: str, top_k: int = 5) -> list:
        """Search for relevant documents"""
        if self.use_hybrid:
            return self.hybrid_engine.search(query, top_k)
        else:
            return self.original_retriever.search_similar_documents(query, top_k)
    
    def generate_response(self, query: str, context_docs: list, 
                         system_prompt: str = None) -> str:
        """Generate response using Gemini with retrieved context"""
        
        # Default system prompt for medical assistant
        if system_prompt is None:
            system_prompt = """Anda adalah asisten medis AI yang berpengetahuan luas dan berpengalaman dalam diagnosis dan anamnesis. 
Tugas Anda adalah membantu dalam proses anamnesis dan memberikan rekomendasi diagnosis berdasarkan informasi yang tersedia.

INSTRUKSI PENTING:
1. Gunakan HANYA informasi dari konteks yang disediakan di bawah ini
2. Jika informasi tidak cukup atau tidak relevan, nyatakan dengan jelas
3. JANGAN mengarang atau membuat informasi medis
4. Berikan penjelasan yang mudah dipahami namun tetap akurat
5. Sertakan referensi ke sumber informasi jika memungkinkan
6. Jika diperlukan pemeriksaan lebih lanjut, sebutkan dengan jelas"""
        
        # Format context from retrieved documents
        context_text = ""
        references = []
        
        for i, doc in enumerate(context_docs, 1):
            source_info = doc.get('data_source', 'unknown')
            title = doc.get('title', doc.get('file_name', 'Untitled'))
            reference = f"[{source_info}] {title}"
            references.append(reference)
            
            content = doc.get('content', '')
            context_text += f"\n--- Referensi {i}: {reference} ---\n"
            context_text += f"{content}\n"
        
        # Create complete prompt
        full_prompt = f"""{system_prompt}

KONTEKS DARI SUMBER DATA:
{context_text}

REFERENSI YANG DIGUNAKAN:
{'; '.join(references)}

PERTANYAAN: {query}

Berikan jawaban yang akurat berdasarkan konteks di atas. Pastikan untuk menyebutkan referensi yang relevan dalam jawaban Anda.
"""
        
        try:
            model = genai.GenerativeModel(self.generation_model)
            response = model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            print(f"Error generating response: {e}", file=sys.stderr)
            return "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi."
    
    def rag_query(self, query: str, top_k: int = 5, 
                  system_prompt: str = None) -> Dict[str, Any]:
        """Complete RAG pipeline with timeout handling"""
        
        # Check if we can use hybrid search or need fallback
        if not self.use_hybrid and hasattr(self, 'original_retriever'):
            # Use original retriever as fallback
            return self._rag_query_fallback(query, top_k, system_prompt)
        
        # Set up timeout for hybrid search
        if hasattr(signal, 'SIGALRM'):  # Unix systems
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(self.timeout_seconds)
        
        try:
            start_time = time.time()
            
            # Retrieve similar documents
            retrieved_docs = self.search_documents(query, top_k)
            search_time = time.time() - start_time
            
            # Generate response
            response_start = time.time()
            response = self.generate_response(query, retrieved_docs, system_prompt)
            generation_time = time.time() - response_start
            
            total_time = time.time() - start_time
            
            # Prepare result with enhanced metadata
            result = {
                'query': query,
                'response': response,
                'retrieved_documents': [
                    {
                        'title': doc.get('title', doc.get('file_name', 'Untitled')),
                        'source': doc.get('data_source', 'unknown'),
                        'content_preview': doc.get('content', '')[:200] + "..." if len(doc.get('content', '')) > 200 else doc.get('content', ''),
                        'similarity_score': doc.get('similarity_score', doc.get('combined_score', 0.0)),
                        'search_method': doc.get('search_method', 'unknown'),
                        'reference': doc.get('reference', f"{doc.get('data_source', 'unknown')}:{doc.get('title', 'untitled')}")
                    }
                    for doc in retrieved_docs
                ],
                'metadata': {
                    'num_retrieved_docs': len(retrieved_docs),
                    'data_sources': list(set([doc.get('data_source', 'unknown') for doc in retrieved_docs])),
                    'total_documents_available': getattr(self.hybrid_engine, 'vector_db', {}).get('total_documents', 0) if self.use_hybrid else len(getattr(self.original_retriever, 'documents', [])),
                    'top_similarity_score': retrieved_docs[0].get('similarity_score', retrieved_docs[0].get('combined_score', 0.0)) if retrieved_docs else 0.0,
                    'search_engine': 'hybrid' if self.use_hybrid else 'original',
                    'performance': {
                        'search_time_seconds': search_time,
                        'generation_time_seconds': generation_time,
                        'total_time_seconds': total_time
                    }
                }
            }
            
            return result
            
        except TimeoutException:
            # Fallback to original retriever on timeout
            print("Hybrid search timed out, falling back to original retriever", file=sys.stderr)
            self.use_hybrid = False
            self._init_original_search()
            return self._rag_query_fallback(query, top_k, system_prompt)
            
        except Exception as e:
            print(f"Error in hybrid search: {e}, falling back to original retriever", file=sys.stderr)
            # Try fallback
            try:
                self.use_hybrid = False
                self._init_original_search()
                return self._rag_query_fallback(query, top_k, system_prompt)
            except Exception as fallback_error:
                return {
                    'error': f"Both hybrid and fallback failed: {str(e)}, {str(fallback_error)}",
                    'query': query,
                    'response': 'Maaf, terjadi kesalahan saat memproses permintaan Anda.',
                    'retrieved_documents': [],
                    'metadata': {'error': True, 'hybrid_failed': True, 'fallback_failed': True}
                }
        finally:
            # Cancel timeout
            if hasattr(signal, 'SIGALRM'):
                signal.alarm(0)

    def _rag_query_fallback(self, query: str, top_k: int = 5, 
                           system_prompt: str = None) -> Dict[str, Any]:
        """Fallback RAG query using original retriever"""
        try:
            start_time = time.time()
            
            # Use original retriever
            retrieved_docs = self.original_retriever.search_similar_documents(query, top_k)
            search_time = time.time() - start_time
            
            # Generate response
            response_start = time.time()
            response = self.generate_response(query, retrieved_docs, system_prompt)
            generation_time = time.time() - response_start
            
            total_time = time.time() - start_time
            
            return {
                'query': query,
                'response': response,
                'retrieved_documents': [
                    {
                        'title': doc.get('title', doc.get('file_name', 'Untitled')),
                        'source': doc.get('data_source', 'unknown'),
                        'content_preview': doc.get('content', '')[:200] + "..." if len(doc.get('content', '')) > 200 else doc.get('content', ''),
                        'similarity_score': doc.get('similarity_score', 0.0),
                        'search_method': 'original_fallback',
                        'reference': f"{doc.get('data_source', 'unknown')}:{doc.get('title', 'untitled')}"
                    }
                    for doc in retrieved_docs
                ],
                'metadata': {
                    'num_retrieved_docs': len(retrieved_docs),
                    'data_sources': list(set([doc.get('data_source', 'unknown') for doc in retrieved_docs])),
                    'search_engine': 'original_fallback',
                    'performance': {
                        'search_time_seconds': search_time,
                        'generation_time_seconds': generation_time,
                        'total_time_seconds': total_time
                    }
                }
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'query': query,
                'response': 'Maaf, terjadi kesalahan saat memproses permintaan Anda.',
                'retrieved_documents': [],
                'metadata': {'error': True, 'fallback_used': True}
            }


def main():
    """Main function untuk API call"""
    try:
        # Get command line arguments
        if len(sys.argv) < 2:
            raise ValueError("Query parameter is required")
        
        query = sys.argv[1]
        max_docs = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        context = sys.argv[3] if len(sys.argv) > 3 else 'anamnesis'
        use_hybrid = sys.argv[4].lower() == 'true' if len(sys.argv) > 4 else True
        
        # Setup paths
        current_dir = Path(__file__).parent
        env_file = current_dir.parent / '.env.local'
        data_folder_path = current_dir / 'data'
        
        # Load environment variables manually
        gemini_api_key = None
        if env_file.exists():
            with open(env_file, 'r') as f:
                for line in f:
                    if line.startswith('GOOGLE_API_KEY='):
                        gemini_api_key = line.split('=', 1)[1].strip()
                        break
        
        if not gemini_api_key:
            raise ValueError("GOOGLE_API_KEY not found in .env.local")
        
        # Check if data folder exists
        if not data_folder_path.exists():
            raise FileNotFoundError(f"Data folder not found at {data_folder_path}")
        
        # Initialize enhanced RAG retriever with disabled hybrid search for now
        retriever = EnhancedRAGRetriever(
            gemini_api_key=gemini_api_key,
            data_folder_path=str(data_folder_path),
            use_hybrid=False,  
            timeout_seconds=60  
        )
        
        # Customize system prompt based on context
        system_prompts = {
            'anamnesis': """Anda adalah asisten medis AI yang membantu dalam proses anamnesis (wawancara medis). 
Tugas Anda adalah membantu dokter dan pasien dalam mengumpulkan informasi medis yang relevan.

INSTRUKSI:
1. Gunakan informasi dari konteks medis yang disediakan
2. Ajukan pertanyaan follow-up yang relevan untuk anamnesis
3. Berikan penjelasan yang mudah dipahami pasien
4. Fokus pada gejala, riwayat medis, dan faktor risiko
5. Jika informasi tidak cukup, minta klarifikasi""",
            
            'diagnosis': """Anda adalah asisten medis AI yang membantu dalam proses diagnosis. 
Tugas Anda adalah memberikan rekomendasi diagnosis berdasarkan informasi yang tersedia.

INSTRUKSI:
1. Gunakan HANYA informasi dari konteks medis yang disediakan
2. Berikan diagnosis diferensial yang mungkin
3. Sertakan tingkat keyakinan diagnosis
4. Rekomendasikan pemeriksaan penunjang jika diperlukan
5. JANGAN memberikan diagnosis pasti tanpa pemeriksaan langsung""",
            
            'general': """Anda adalah asisten medis AI yang berpengetahuan luas. 
Berikan informasi medis yang akurat berdasarkan konteks yang disediakan.

INSTRUKSI:
1. Gunakan informasi dari konteks yang disediakan
2. Berikan penjelasan yang akurat dan mudah dipahami
3. Jika informasi tidak mencukupi, nyatakan dengan jelas
4. Hindari memberikan saran medis spesifik tanpa konsultasi dokter"""
        }
        
        system_prompt = system_prompts.get(context, system_prompts['general'])
        
   
        result = retriever.rag_query(query, max_docs, system_prompt)
        
   
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        # Output error as JSON
        error_result = {
            'error': str(e),
            'query': sys.argv[1] if len(sys.argv) > 1 else '',
            'response': 'Maaf, terjadi kesalahan saat memproses permintaan Anda.',
            'retrieved_documents': [],
            'metadata': {'error': True}
        }
        print(json.dumps(error_result, ensure_ascii=False, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()