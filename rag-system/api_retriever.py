#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API Retriever for RAG System
Script yang dipanggil dari Next.js API route untuk melakukan RAG query
"""

import json
import sys
import os
import io
from pathlib import Path

# Set UTF-8 encoding for stdout
if sys.platform.startswith('win'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add the parent directory to Python path to import our modules
sys.path.append(str(Path(__file__).parent))

from retriever import RAGRetriever

def main():
    """Main function untuk API call"""
    try:
        # Get command line arguments
        if len(sys.argv) < 2:
            raise ValueError("Query parameter is required")
        
        query = sys.argv[1]
        max_docs = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        context = sys.argv[3] if len(sys.argv) > 3 else 'anamnesis'
        
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
        
        # Initialize RAG retriever with data folder (supports multiple sources)
        retriever = RAGRetriever(gemini_api_key, data_folder_path=str(data_folder_path))
        
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
        
        # Perform RAG query
        result = retriever.rag_query(query, max_docs, system_prompt)
        
        # Output result as JSON
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
