#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Index Builder Script
Script untuk membangun indeks RAG secara manual untuk menghindari timeout pada API calls
"""

import json
import sys
import os
import time
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

from api_retriever import EnhancedRAGRetriever

def build_indexes():
    """Build RAG indexes manually"""
    try:
        print("=== RAG Index Builder ===")
        print("Building indexes for faster API responses...")
        
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
            return False
        
        # Check if data folder exists
        if not data_folder_path.exists():
            print(f"❌ Error: Data folder not found at {data_folder_path}")
            return False
        
        print(f"📁 Data folder: {data_folder_path}")
        print(f"🔧 Building indexes...")
        
        start_time = time.time()
        
        # Initialize retriever (this will build indexes)
        retriever = EnhancedRAGRetriever(
            gemini_api_key=gemini_api_key,
            data_folder_path=str(data_folder_path),
            use_hybrid=True,
            timeout_seconds=300  # 5 minutes for manual building
        )
        
        total_time = time.time() - start_time
        
        print(f"✅ Index building completed in {total_time:.2f} seconds")
        
        # Test the search to verify
        print("🧪 Testing search functionality...")
        test_query = "sakit kepala"
        test_results = retriever.search_documents(test_query, top_k=3)
        
        if test_results:
            print(f"✅ Search test successful: Found {len(test_results)} results for '{test_query}'")
            for i, result in enumerate(test_results[:2], 1):
                title = result.get('title', 'Untitled')[:50]
                score = result.get('similarity_score', result.get('combined_score', 0))
                print(f"   {i}. {title}... (score: {score:.3f})")
        else:
            print("⚠️  Warning: No search results found")
        
        print("\n🎉 Index building completed successfully!")
        print("   API calls should now be much faster.")
        
        return True
        
    except Exception as e:
        print(f"❌ Error building indexes: {e}")
        return False

if __name__ == "__main__":
    success = build_indexes()
    sys.exit(0 if success else 1)