#!/usr/bin/env python3
"""
FAISS Vector Database Implementation for RAG System
Provides high-performance vector similarity search using FAISS
"""

import os
import json
import pickle
import logging
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
import faiss
from sentence_transformers import SentenceTransformer
import google.generativeai as genai

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FaissVectorDB:
    """
    High-performance vector database using FAISS for similarity search
    Supports both offline and online embedding creation
    """
    
    def __init__(self, 
                 dimension: int = 768,
                 index_type: str = "IVF",
                 nlist: int = 100,
                 use_gpu: bool = False,
                 embedding_model: str = "sentence-transformers",
                 sentence_transformer_model: str = "all-MiniLM-L6-v2",
                 gemini_api_key: str = None):
        """
        Initialize FAISS Vector Database
        
        Args:
            dimension: Vector dimension (768 for sentence-transformers, 768 for Gemini)
            index_type: FAISS index type ('Flat', 'IVF', 'HNSW')
            nlist: Number of clusters for IVF index
            use_gpu: Whether to use GPU acceleration
            embedding_model: 'sentence-transformers' or 'gemini'
            sentence_transformer_model: Model name for sentence transformers
            gemini_api_key: API key for Gemini embedding model
        """
        self.dimension = dimension
        self.index_type = index_type
        self.nlist = nlist
        self.use_gpu = use_gpu
        self.embedding_model = embedding_model
        
        # Initialize embedding model
        if embedding_model == "sentence-transformers":
            self.st_model = SentenceTransformer(sentence_transformer_model)
            self.dimension = self.st_model.get_sentence_embedding_dimension()
        elif embedding_model == "gemini":
            if not gemini_api_key:
                raise ValueError("Gemini API key required for Gemini embedding model")
            genai.configure(api_key=gemini_api_key)
            self.gemini_embedding_model = "models/text-embedding-004"
            self.dimension = 768  # Gemini embedding dimension
        else:
            raise ValueError("embedding_model must be 'sentence-transformers' or 'gemini'")
        
        # Initialize FAISS index
        self.index = None
        self.documents = []
        self.doc_ids = []
        self.is_trained = False
        
        logger.info(f"Initialized FaissVectorDB with dimension={self.dimension}, model={embedding_model}")
    
    def _create_index(self) -> faiss.Index:
        """Create FAISS index based on configuration"""
        if self.index_type == "Flat":
            index = faiss.IndexFlatIP(self.dimension)  # Inner Product (cosine similarity)
        elif self.index_type == "IVF":
            quantizer = faiss.IndexFlatIP(self.dimension)
            index = faiss.IndexIVFFlat(quantizer, self.dimension, self.nlist)
        elif self.index_type == "HNSW":
            index = faiss.IndexHNSWFlat(self.dimension, 32)  # 32 connections per node
        else:
            raise ValueError(f"Unsupported index type: {self.index_type}")
        
        if self.use_gpu and faiss.get_num_gpus() > 0:
            res = faiss.StandardGpuResources()
            index = faiss.index_cpu_to_gpu(res, 0, index)
            logger.info("Using GPU acceleration for FAISS")
        
        return index
    
    def create_embedding(self, text: str) -> np.ndarray:
        """Create embedding for text using configured embedding model"""
        try:
            if self.embedding_model == "sentence-transformers":
                embedding = self.st_model.encode(text, convert_to_numpy=True)
                # Normalize for cosine similarity
                embedding = embedding / np.linalg.norm(embedding)
                return embedding
            
            elif self.embedding_model == "gemini":
                # Limit text length for Gemini API
                text_truncated = text[:8000] if len(text) > 8000 else text
                result = genai.embed_content(
                    model=self.gemini_embedding_model,
                    content=text_truncated,
                    task_type="retrieval_document"
                )
                embedding = np.array(result['embedding'], dtype=np.float32)
                # Normalize for cosine similarity
                embedding = embedding / np.linalg.norm(embedding)
                return embedding
        except Exception as e:
            logger.error(f"Error creating embedding: {e}")
            return np.zeros(self.dimension, dtype=np.float32)
    
    def create_query_embedding(self, query: str) -> np.ndarray:
        """Create embedding for query text"""
        try:
            if self.embedding_model == "sentence-transformers":
                embedding = self.st_model.encode(query, convert_to_numpy=True)
                embedding = embedding / np.linalg.norm(embedding)
                return embedding
            
            elif self.embedding_model == "gemini":
                result = genai.embed_content(
                    model=self.gemini_embedding_model,
                    content=query,
                    task_type="retrieval_query"
                )
                embedding = np.array(result['embedding'], dtype=np.float32)
                embedding = embedding / np.linalg.norm(embedding)
                return embedding
        except Exception as e:
            logger.error(f"Error creating query embedding: {e}")
            return np.zeros(self.dimension, dtype=np.float32)
    
    def add_documents(self, documents: List[Dict[str, Any]], batch_size: int = 32):
        """
        Add documents to the vector database
        
        Args:
            documents: List of document dictionaries with 'content' field
            batch_size: Batch size for embedding creation
        """
        if not documents:
            logger.warning("No documents to add")
            return
        
        logger.info(f"Adding {len(documents)} documents to vector database")
        
        # Create index if not exists
        if self.index is None:
            self.index = self._create_index()
        
        embeddings = []
        valid_docs = []
        
        # Process documents in batches for efficiency
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            batch_embeddings = []
            
            for doc in batch:
                content = doc.get('content', '')
                if not content:
                    logger.warning(f"Document {doc.get('id', 'unknown')} has no content")
                    continue
                
                # Use existing embedding if available, otherwise create new one
                if 'embedding' in doc and doc['embedding']:
                    embedding = np.array(doc['embedding'], dtype=np.float32)
                    # Ensure embedding is normalized
                    if np.linalg.norm(embedding) > 0:
                        embedding = embedding / np.linalg.norm(embedding)
                    else:
                        embedding = self.create_embedding(content)
                else:
                    embedding = self.create_embedding(content)
                
                if embedding is not None and np.any(embedding):
                    batch_embeddings.append(embedding)
                    valid_docs.append(doc)
            
            embeddings.extend(batch_embeddings)
            logger.info(f"Processed batch {i//batch_size + 1}/{(len(documents)-1)//batch_size + 1}")
        
        if not embeddings:
            logger.error("No valid embeddings created")
            return
        
        # Convert to numpy array
        embeddings_array = np.array(embeddings, dtype=np.float32)
        
        # Train index if needed (for IVF)
        if self.index_type == "IVF" and not self.is_trained:
            logger.info("Training IVF index...")
            self.index.train(embeddings_array)
            self.is_trained = True
        
        # Add vectors to index
        self.index.add(embeddings_array)
        
        # Store documents and IDs
        self.documents.extend(valid_docs)
        self.doc_ids.extend([doc.get('id', f'doc_{i}') for i, doc in enumerate(valid_docs)])
        
        logger.info(f"Successfully added {len(valid_docs)} documents to FAISS index")
        logger.info(f"Total documents in index: {len(self.documents)}")
    
    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar documents using FAISS
        
        Args:
            query: Search query text
            top_k: Number of top results to return
            
        Returns:
            List of similar documents with similarity scores
        """
        if self.index is None or len(self.documents) == 0:
            logger.warning("No documents in vector database")
            return []
        
        # Create query embedding
        query_embedding = self.create_query_embedding(query)
        if query_embedding is None or not np.any(query_embedding):
            logger.error("Failed to create query embedding")
            return []
        
        # Search using FAISS
        query_vector = query_embedding.reshape(1, -1).astype(np.float32)
        
        # Set search parameters for IVF
        if self.index_type == "IVF":
            self.index.nprobe = min(10, self.nlist)  # Search 10 clusters
        
        # Perform search
        scores, indices = self.index.search(query_vector, min(top_k, len(self.documents)))
        
        # Prepare results
        results = []
        for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx == -1:  # FAISS returns -1 for invalid indices
                continue
                
            doc = self.documents[idx].copy()
            doc['similarity_score'] = float(score)
            doc['rank'] = i + 1
            doc['search_method'] = 'faiss_vector'
            
            results.append(doc)
        
        return results
    
    def save_index(self, index_path: str, metadata_path: str):
        """Save FAISS index and metadata to disk"""
        try:
            # Save FAISS index
            if self.use_gpu:
                # Convert GPU index to CPU before saving
                cpu_index = faiss.index_gpu_to_cpu(self.index)
                faiss.write_index(cpu_index, index_path)
            else:
                faiss.write_index(self.index, index_path)
            
            # Save metadata
            metadata = {
                'documents': self.documents,
                'doc_ids': self.doc_ids,
                'dimension': self.dimension,
                'index_type': self.index_type,
                'nlist': self.nlist,
                'is_trained': self.is_trained,
                'embedding_model': self.embedding_model
            }
            
            with open(metadata_path, 'wb') as f:
                pickle.dump(metadata, f)
            
            logger.info(f"Saved FAISS index to {index_path} and metadata to {metadata_path}")
        except Exception as e:
            logger.error(f"Error saving index: {e}")
    
    def load_index(self, index_path: str, metadata_path: str):
        """Load FAISS index and metadata from disk"""
        try:
            # Load FAISS index
            self.index = faiss.read_index(index_path)
            
            if self.use_gpu and faiss.get_num_gpus() > 0:
                res = faiss.StandardGpuResources()
                self.index = faiss.index_cpu_to_gpu(res, 0, self.index)
            
            # Load metadata
            with open(metadata_path, 'rb') as f:
                metadata = pickle.load(f)
            
            self.documents = metadata['documents']
            self.doc_ids = metadata['doc_ids']
            self.dimension = metadata['dimension']
            self.index_type = metadata['index_type']
            self.nlist = metadata['nlist']
            self.is_trained = metadata['is_trained']
            
            logger.info(f"Loaded FAISS index from {index_path} with {len(self.documents)} documents")
        except Exception as e:
            logger.error(f"Error loading index: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector database"""
        return {
            'total_documents': len(self.documents),
            'dimension': self.dimension,
            'index_type': self.index_type,
            'is_trained': self.is_trained,
            'embedding_model': self.embedding_model,
            'use_gpu': self.use_gpu and faiss.get_num_gpus() > 0,
            'index_size_bytes': self.index.ntotal * self.dimension * 4 if self.index else 0  # 4 bytes per float32
        }


def main():
    """Test function for FAISS Vector DB"""
    # Sample documents for testing
    sample_docs = [
        {
            'id': 'doc1',
            'title': 'Diabetes Melitus',
            'content': 'Diabetes melitus adalah penyakit metabolik yang ditandai dengan tingginya kadar gula darah.',
            'data_source': 'test'
        },
        {
            'id': 'doc2', 
            'title': 'Hipertensi',
            'content': 'Hipertensi atau tekanan darah tinggi adalah kondisi medis kronis.',
            'data_source': 'test'
        }
    ]
    
    # Initialize vector DB with Flat index for small data
    vdb = FaissVectorDB(
        embedding_model="sentence-transformers",
        index_type="Flat"  # Use Flat for small datasets
    )
    
    # Add documents
    vdb.add_documents(sample_docs)
    
    # Test search
    results = vdb.search("penyakit gula darah tinggi", top_k=2)
    
    print("Search Results:")
    for result in results:
        print(f"- {result['title']}: {result['similarity_score']:.3f}")
    
    # Print stats
    print("\nDatabase Stats:")
    stats = vdb.get_stats()
    for key, value in stats.items():
        print(f"- {key}: {value}")


if __name__ == "__main__":
    main()