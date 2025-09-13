#!/usr/bin/env python3
"""
RAG Retrieval and Generation System
Melakukan pencarian similarity dan generation untuk sistem RAG Anamnesa
"""

import json
import logging
import os
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import google.generativeai as genai

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGRetriever:
    """Kelas untuk retrieval dan generation menggunakan RAG dengan multiple data sources"""
    
    def __init__(self, gemini_api_key: str, data_folder_path: str = None, vector_db_path: str = None):
        """
        Initialize RAG Retriever
        Args:
            gemini_api_key: API key untuk Gemini
            data_folder_path: Path ke folder data yang berisi semua sumber data
            vector_db_path: Path ke file vector_db.json (backward compatibility)
        """
        # Backward compatibility - jika hanya vector_db_path yang diberikan
        if vector_db_path and not data_folder_path:
            self.data_folder_path = str(Path(vector_db_path).parent)
            self.vector_db_path = vector_db_path
        elif data_folder_path:
            self.data_folder_path = data_folder_path
            self.vector_db_path = os.path.join(data_folder_path, 'vector_db.json')
        else:
            raise ValueError("Either data_folder_path or vector_db_path must be provided")
            
        self.documents = []
        self.embeddings = []
        
        # Setup Gemini API
        genai.configure(api_key=gemini_api_key)
        self.embedding_model = "models/text-embedding-004"
        self.generation_model = "gemini-1.5-flash"
        
        # Load all data sources
        self.load_all_data_sources()
    
    def load_all_data_sources(self):
        """Load documents from all data sources in the data folder"""
        all_documents = []
        
        # 1. Load Google Drive vector database
        vector_db_file = Path(self.vector_db_path)
        if vector_db_file.exists():
            try:
                with open(vector_db_file, 'r', encoding='utf-8') as f:
                    drive_docs = json.load(f)
                    for doc in drive_docs:
                        doc['data_source'] = 'google_drive'
                    all_documents.extend(drive_docs)
                    logger.info(f"Loaded {len(drive_docs)} documents from Google Drive")
            except Exception as e:
                logger.error(f"Error loading Google Drive database: {e}")
        
        # 2. Load NCBI papers with content
        ncbi_content_file = Path(self.data_folder_path) / 'ncbi_papers_content.json'
        if ncbi_content_file.exists():
            try:
                with open(ncbi_content_file, 'r', encoding='utf-8') as f:
                    ncbi_data = json.load(f)
                    for paper in ncbi_data.get('papers', []):
                        # Create embedding for NCBI papers if they don't have one
                        if 'content' in paper and paper['content']:
                            embedding = self.create_content_embedding(paper['content'])
                            if embedding:
                                doc = {
                                    'id': paper['id'],
                                    'title': paper['title'],
                                    'content': paper['content'],
                                    'source': paper['source'],
                                    'url': paper.get('url', ''),
                                    'data_source': 'ncbi_pmc',
                                    'embedding': embedding
                                }
                                all_documents.append(doc)
                    logger.info(f"Loaded {len(ncbi_data.get('papers', []))} documents from NCBI PMC")
            except Exception as e:
                logger.error(f"Error loading NCBI content: {e}")
        
        # 3. Load other JSON files in data folder
        data_folder = Path(self.data_folder_path)
        for json_file in data_folder.glob('*.json'):
            if json_file.name in ['vector_db.json', 'ncbi_papers_content.json']:
                continue  # Skip already processed files
                
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    file_data = json.load(f)
                    
                    # Handle different JSON structures
                    if isinstance(file_data, list):
                        for item in file_data:
                            if 'embedding' in item:
                                item['data_source'] = json_file.stem
                                all_documents.append(item)
                    elif isinstance(file_data, dict):
                        if 'papers' in file_data:
                            for paper in file_data['papers']:
                                paper['data_source'] = json_file.stem
                                all_documents.append(paper)
                        elif 'documents' in file_data:
                            for doc in file_data['documents']:
                                doc['data_source'] = json_file.stem
                                all_documents.append(doc)
                    
                    logger.info(f"Loaded data from {json_file.name}")
            except Exception as e:
                logger.error(f"Error loading {json_file.name}: {e}")
        
        # Set documents and extract embeddings
        self.documents = all_documents
        self.embeddings = [doc['embedding'] for doc in self.documents if 'embedding' in doc]
        self.embeddings = np.array(self.embeddings) if self.embeddings else np.array([])
        
        logger.info(f"Total loaded: {len(self.documents)} documents from all sources")
    
    def create_content_embedding(self, content: str) -> List[float]:
        """Create embedding for content using Gemini API"""
        try:
            result = genai.embed_content(
                model=self.embedding_model,
                content=content[:8000],  # Limit content length for embedding
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Error creating content embedding: {e}")
            return []
    
    def create_query_embedding(self, query: str) -> List[float]:
        """Create embedding for query using Gemini API"""
        try:
            result = genai.embed_content(
                model=self.embedding_model,
                content=query,
                task_type="retrieval_query"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Error creating query embedding: {e}")
            return []
    
    def search_similar_documents(self, query: str, top_k: int = 5) -> List[Dict]:
        """Search for similar documents using cosine similarity"""
        if len(self.documents) == 0:
            logger.warning("No documents in vector database")
            return []
        
        # Create query embedding
        query_embedding = self.create_query_embedding(query)
        if not query_embedding:
            return []
        
        # Calculate similarities
        query_embedding = np.array(query_embedding).reshape(1, -1)
        similarities = cosine_similarity(query_embedding, self.embeddings)[0]
        
        # Get top-k most similar documents
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            doc = self.documents[idx].copy()
            doc['similarity_score'] = float(similarities[idx])
            # Add reference information for better tracking
            doc['reference'] = f"{doc.get('data_source', 'unknown')}:{doc.get('title', doc.get('id', 'untitled'))}"
            results.append(doc)
        
        return results
    
    def generate_response(self, query: str, context_docs: List[Dict], 
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
            logger.error(f"Error generating response: {e}")
            return "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi."
    
    def rag_query(self, query: str, top_k: int = 5, 
                  system_prompt: str = None) -> Dict[str, Any]:
        """Complete RAG pipeline: retrieve and generate"""
        
        # Retrieve similar documents
        retrieved_docs = self.search_similar_documents(query, top_k)
        
        # Generate response
        response = self.generate_response(query, retrieved_docs, system_prompt)
        
        # Prepare result
        result = {
            'query': query,
            'response': response,
            'retrieved_documents': [
                {
                    'title': doc.get('title', doc.get('file_name', 'Untitled')),
                    'source': doc.get('data_source', 'unknown'),
                    'content_preview': doc.get('content', '')[:200] + "..." if len(doc.get('content', '')) > 200 else doc.get('content', ''),
                    'similarity_score': doc['similarity_score'],
                    'reference': doc.get('reference', 'Unknown reference')
                }
                for doc in retrieved_docs
            ],
            'metadata': {
                'num_retrieved_docs': len(retrieved_docs),
                'data_sources': list(set([doc.get('data_source', 'unknown') for doc in retrieved_docs])),
                'total_documents_available': len(self.documents),
                'top_similarity_score': retrieved_docs[0]['similarity_score'] if retrieved_docs else 0.0
            }
        }
        
        return result

def main():
    """Main function for testing RAG system"""
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    gemini_api_key = os.getenv('GOOGLE_API_KEY')
    vector_db_path = "./rag-system/data/vector_db.json"
    
    if not gemini_api_key:
        print("Error: GOOGLE_API_KEY not found in environment variables")
        return
    
    # Initialize retriever
    retriever = RAGRetriever(gemini_api_key, vector_db_path)
    
    # Interactive testing
    print("RAG System Ready! Masukkan pertanyaan medis atau ketik 'quit' untuk keluar.")
    print("-" * 60)
    
    while True:
        query = input("\nPertanyaan: ").strip()
        
        if query.lower() in ['quit', 'exit', 'keluar']:
            break
        
        if not query:
            continue
        
        print("\nMemproses...")
        result = retriever.rag_query(query)
        
        print(f"\nJawaban: {result['response']}")
        print(f"\nSumber dokumen yang digunakan:")
        for i, doc in enumerate(result['retrieved_documents'], 1):
            print(f"  {i}. {doc['file_name']} (skor: {doc['similarity_score']:.3f})")
            print(f"     Preview: {doc['content_preview']}")
        
        print("-" * 60)

if __name__ == "__main__":
    main()
