#!/usr/bin/env python3
"""
Test script untuk memverifikasi persistent singleton RAGRetriever
"""

import os
import sys
import time
import requests
from pathlib import Path

def test_retriever_import():
    """Test import RAGRetriever dan OptimizedVectorSearch"""
    print("🧪 Testing RAGRetriever import...")
    
    try:
        sys.path.append(str(Path(__file__).parent))
        from retriever import RAGRetriever, OptimizedVectorSearch
        print("✅ Successfully imported RAGRetriever dan OptimizedVectorSearch")
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

def test_persistent_server():
    """Test persistent RAG server"""
    print("🧪 Testing persistent RAG server...")
    
    try:
        # Check server health
        health_response = requests.get('http://localhost:8001/health', timeout=5)
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"✅ Server is healthy:")
            print(f"   Documents: {health_data.get('total_documents')}")
            print(f"   Status: {health_data.get('status')}")
            
            # Test query
            query_data = {
                "query": "Apa itu diabetes?",
                "max_docs": 3,
                "context": "general"
            }
            
            start_time = time.time()
            query_response = requests.post(
                'http://localhost:8001/query', 
                json=query_data, 
                timeout=10
            )
            query_time = time.time() - start_time
            
            if query_response.status_code == 200:
                result = query_response.json()
                print(f"✅ Query successful in {query_time:.4f}s")
                print(f"   Response preview: {result.get('response', '')[:100]}...")
                print(f"   Documents found: {len(result.get('retrieved_documents', []))}")
                return True
            else:
                print(f"❌ Query failed: {query_response.status_code}")
                return False
        else:
            print(f"❌ Server not healthy: {health_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Server test failed: {e}")
        return False

def test_api_route():
    """Test Next.js API route (if running)"""
    print("🧪 Testing Next.js API route...")
    
    try:
        # Check if Next.js is running
        test_data = {
            "query": "Apa itu hipertensi?",
            "maxDocs": 3,
            "context": "general"
        }
        
        start_time = time.time()
        response = requests.post(
            'http://localhost:3000/api/rag',
            json=test_data,
            timeout=30
        )
        api_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            processing_source = result.get('metadata', {}).get('processing_source', 'unknown')
            print(f"✅ API route successful in {api_time:.4f}s")
            print(f"   Processing source: {processing_source}")
            print(f"   Response preview: {result.get('response', '')[:100]}...")
            return True
        else:
            print(f"❌ API route failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API route test failed (Next.js might not be running): {e}")
        return False

def test_retriever_initialization():
    """Test direct RAGRetriever initialization"""
    print("🧪 Testing direct RAGRetriever initialization...")
    
    try:
        # Load environment variables
        try:
            from dotenv import load_dotenv
            env_path = Path(__file__).parent.parent / '.env.local'
            if env_path.exists():
                load_dotenv(env_path)
        except ImportError:
            pass
        
        gemini_api_key = os.getenv('GOOGLE_API_KEY')
        if not gemini_api_key:
            print("❌ GOOGLE_API_KEY not found")
            return False
        
        data_folder_path = Path(__file__).parent / 'data'
        if not data_folder_path.exists():
            print(f"❌ Data folder not found: {data_folder_path}")
            return False
        
        # Initialize retriever
        sys.path.append(str(Path(__file__).parent))
        from retriever import RAGRetriever
        
        start_time = time.time()
        retriever = RAGRetriever(gemini_api_key, str(data_folder_path))
        init_time = time.time() - start_time
        
        print(f"✅ RAGRetriever initialized in {init_time:.4f}s")
        print(f"   Documents loaded: {len(retriever.documents)}")
        print(f"   Vector search available: {retriever.vector_search is not None}")
        
        # Test a simple query
        start_time = time.time()
        results = retriever.search_similar_documents("test diabetes", top_k=3)
        search_time = time.time() - start_time
        
        print(f"✅ Search completed in {search_time:.4f}s")
        print(f"   Results found: {len(results)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Direct initialization failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Persistent Singleton RAGRetriever Implementation")
    print("=" * 70)
    
    tests = [
        ("Import Test", test_retriever_import),
        ("Persistent Server Test", test_persistent_server),  
        ("Direct Initialization Test", test_retriever_initialization),
        ("API Route Test", test_api_route),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n{test_name}")
        print("-" * 50)
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results[test_name] = False
        time.sleep(1)  # Small delay between tests
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<30} {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Persistent singleton implementation is working correctly.")
    else:
        print("⚠️ Some tests failed. Please check the implementation.")
        
        # Recommendations
        print("\n💡 Troubleshooting:")
        if not results.get("Import Test"):
            print("- Check if retriever.py has all required classes")
        if not results.get("Persistent Server Test"):
            print("- Start the server with: python start_rag_server.py --port 8001")
        if not results.get("API Route Test"):
            print("- Start Next.js with: npm run dev")
        if not results.get("Direct Initialization Test"):
            print("- Check GOOGLE_API_KEY and data folder availability")

if __name__ == "__main__":
    main()