#!/usr/bin/env python3
"""
Hybrid Search Engine for RAG System
Combines FAISS vector search and BM25 keyword search with re-ranking
"""

import os
import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
import numpy as np
from sklearn.preprocessing import MinMaxScaler

# Import our custom modules
from faiss_vector_db import FaissVectorDB
from bm25_search import BM25Search

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HybridSearchEngine:
    """
    Hybrid search engine combining vector similarity and keyword search
    with parallel processing and intelligent re-ranking
    """
    
    def __init__(self,
                 vector_weight: float = 0.6,
                 keyword_weight: float = 0.4,
                 use_parallel_search: bool = True,
                 max_workers: int = 2,
                 vector_top_k: int = 20,
                 keyword_top_k: int = 20,
                 final_top_k: int = 10,
                 rerank_method: str = "weighted_sum",
                 embedding_model: str = "sentence-transformers",
                 gemini_api_key: str = None):
        """
        Initialize Hybrid Search Engine
        
        Args:
            vector_weight: Weight for vector similarity scores
            keyword_weight: Weight for keyword search scores  
            use_parallel_search: Whether to run searches in parallel
            max_workers: Maximum number of parallel workers
            vector_top_k: Number of results from vector search
            keyword_top_k: Number of results from keyword search
            final_top_k: Final number of results to return
            rerank_method: Method for combining scores ('weighted_sum', 'rrf', 'adaptive')
            embedding_model: Model for vector embeddings
            gemini_api_key: API key for Gemini embeddings
        """
        self.vector_weight = vector_weight
        self.keyword_weight = keyword_weight
        self.use_parallel_search = use_parallel_search
        self.max_workers = max_workers
        self.vector_top_k = vector_top_k
        self.keyword_top_k = keyword_top_k
        self.final_top_k = final_top_k
        self.rerank_method = rerank_method
        
        # Initialize search engines
        self.vector_db = FaissVectorDB(
            embedding_model=embedding_model,
            gemini_api_key=gemini_api_key,
            index_type="Flat"  # Use Flat for small datasets
        )
        
        self.bm25_search = BM25Search(
            language="indonesian",
            use_stemming=True,
            remove_stopwords=True
        )
        
        # Performance tracking
        self.search_stats = {
            'total_searches': 0,
            'avg_vector_time': 0.0,
            'avg_keyword_time': 0.0,
            'avg_rerank_time': 0.0,
            'avg_total_time': 0.0
        }
        
        logger.info(f"Initialized HybridSearchEngine with {rerank_method} re-ranking")
    
    def add_documents(self, documents: List[Dict[str, Any]], batch_size: int = 32):
        """
        Add documents to both vector and keyword search engines
        
        Args:
            documents: List of document dictionaries
            batch_size: Batch size for processing
        """
        if not documents:
            logger.warning("No documents to add")
            return
        
        logger.info(f"Adding {len(documents)} documents to hybrid search engine")
        
        start_time = time.time()
        
        # Add to vector database
        logger.info("Adding documents to FAISS vector database...")
        self.vector_db.add_documents(documents, batch_size)
        
        # Add to BM25 search
        logger.info("Adding documents to BM25 keyword search...")
        self.bm25_search.add_documents(documents)
        
        total_time = time.time() - start_time
        logger.info(f"Successfully added documents in {total_time:.2f} seconds")
    
    def search(self, query: str, top_k: int = None) -> List[Dict[str, Any]]:
        """
        Perform hybrid search combining vector and keyword search
        
        Args:
            query: Search query text
            top_k: Number of final results (defaults to final_top_k)
            
        Returns:
            List of ranked documents with combined scores
        """
        if top_k is None:
            top_k = self.final_top_k
        
        start_time = time.time()
        
        # Perform searches
        if self.use_parallel_search:
            vector_results, keyword_results = self._parallel_search(query)
        else:
            vector_results, keyword_results = self._sequential_search(query)
        
        # Re-rank and combine results
        rerank_start = time.time()
        final_results = self._rerank_results(query, vector_results, keyword_results, top_k)
        rerank_time = time.time() - rerank_start
        
        # Update performance statistics
        total_time = time.time() - start_time
        self._update_stats(total_time, rerank_time)
        
        # Add metadata to results
        for i, result in enumerate(final_results):
            result['final_rank'] = i + 1
            result['search_engine'] = 'hybrid'
            result['query'] = query
        
        logger.info(f"Hybrid search completed in {total_time:.3f}s, returned {len(final_results)} results")
        
        return final_results
    
    def _parallel_search(self, query: str) -> Tuple[List[Dict], List[Dict]]:
        """Perform vector and keyword searches in parallel"""
        vector_results = []
        keyword_results = []
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit search tasks
            vector_future = executor.submit(self._vector_search, query)
            keyword_future = executor.submit(self._keyword_search, query)
            
            # Collect results
            for future in as_completed([vector_future, keyword_future]):
                try:
                    if future == vector_future:
                        vector_results = future.result()
                    elif future == keyword_future:
                        keyword_results = future.result()
                except Exception as e:
                    logger.error(f"Error in parallel search: {e}")
        
        return vector_results, keyword_results
    
    def _sequential_search(self, query: str) -> Tuple[List[Dict], List[Dict]]:
        """Perform vector and keyword searches sequentially"""
        vector_results = self._vector_search(query)
        keyword_results = self._keyword_search(query)
        return vector_results, keyword_results
    
    def _vector_search(self, query: str) -> List[Dict[str, Any]]:
        """Perform vector similarity search"""
        start_time = time.time()
        try:
            results = self.vector_db.search(query, self.vector_top_k)
            search_time = time.time() - start_time
            logger.debug(f"Vector search completed in {search_time:.3f}s, found {len(results)} results")
            return results
        except Exception as e:
            logger.error(f"Error in vector search: {e}")
            return []
    
    def _keyword_search(self, query: str) -> List[Dict[str, Any]]:
        """Perform BM25 keyword search"""
        start_time = time.time()
        try:
            results = self.bm25_search.search(query, self.keyword_top_k)
            search_time = time.time() - start_time
            logger.debug(f"Keyword search completed in {search_time:.3f}s, found {len(results)} results")
            return results
        except Exception as e:
            logger.error(f"Error in keyword search: {e}")
            return []
    
    def _rerank_results(self, query: str, vector_results: List[Dict], 
                       keyword_results: List[Dict], top_k: int) -> List[Dict[str, Any]]:
        """
        Re-rank and combine results from vector and keyword searches
        
        Args:
            query: Original search query
            vector_results: Results from vector search
            keyword_results: Results from keyword search
            top_k: Number of final results to return
            
        Returns:
            Combined and re-ranked results
        """
        if not vector_results and not keyword_results:
            return []
        
        # Create document lookup by ID for merging
        all_docs = {}
        
        # Process vector results
        for result in vector_results:
            doc_id = result.get('id', result.get('title', ''))
            if doc_id not in all_docs:
                all_docs[doc_id] = result.copy()
                all_docs[doc_id]['vector_score'] = result.get('similarity_score', 0.0)
                all_docs[doc_id]['vector_rank'] = result.get('rank', len(vector_results))
                all_docs[doc_id]['has_vector'] = True
                all_docs[doc_id]['has_keyword'] = False
            else:
                all_docs[doc_id]['vector_score'] = result.get('similarity_score', 0.0)
                all_docs[doc_id]['vector_rank'] = result.get('rank', len(vector_results))
                all_docs[doc_id]['has_vector'] = True
        
        # Process keyword results
        for result in keyword_results:
            doc_id = result.get('id', result.get('title', ''))
            if doc_id not in all_docs:
                all_docs[doc_id] = result.copy()
                all_docs[doc_id]['keyword_score'] = result.get('bm25_score', 0.0)
                all_docs[doc_id]['keyword_rank'] = result.get('rank', len(keyword_results))
                all_docs[doc_id]['has_vector'] = False
                all_docs[doc_id]['has_keyword'] = True
            else:
                all_docs[doc_id]['keyword_score'] = result.get('bm25_score', 0.0)
                all_docs[doc_id]['keyword_rank'] = result.get('rank', len(keyword_results))
                all_docs[doc_id]['has_keyword'] = True
        
        # Calculate combined scores
        combined_docs = list(all_docs.values())
        
        if self.rerank_method == "weighted_sum":
            combined_docs = self._weighted_sum_rerank(combined_docs)
        elif self.rerank_method == "rrf":
            combined_docs = self._reciprocal_rank_fusion(combined_docs)
        elif self.rerank_method == "adaptive":
            combined_docs = self._adaptive_rerank(combined_docs, query)
        else:
            logger.warning(f"Unknown rerank method: {self.rerank_method}, using weighted_sum")
            combined_docs = self._weighted_sum_rerank(combined_docs)
        
        # Sort by combined score and return top-k
        combined_docs.sort(key=lambda x: x['combined_score'], reverse=True)
        return combined_docs[:top_k]
    
    def _weighted_sum_rerank(self, documents: List[Dict]) -> List[Dict]:
        """Re-rank using weighted sum of normalized scores"""
        # Normalize scores
        vector_scores = [doc.get('vector_score', 0.0) for doc in documents]
        keyword_scores = [doc.get('keyword_score', 0.0) for doc in documents]
        
        # Handle case where all scores are zero
        if max(vector_scores) > 0:
            scaler = MinMaxScaler()
            vector_scores_norm = scaler.fit_transform(np.array(vector_scores).reshape(-1, 1)).flatten()
        else:
            vector_scores_norm = np.zeros(len(vector_scores))
        
        if max(keyword_scores) > 0:
            scaler = MinMaxScaler()
            keyword_scores_norm = scaler.fit_transform(np.array(keyword_scores).reshape(-1, 1)).flatten()
        else:
            keyword_scores_norm = np.zeros(len(keyword_scores))
        
        # Calculate combined scores
        for i, doc in enumerate(documents):
            vector_score = vector_scores_norm[i] if doc.get('has_vector', False) else 0.0
            keyword_score = keyword_scores_norm[i] if doc.get('has_keyword', False) else 0.0
            
            combined_score = (self.vector_weight * vector_score + 
                            self.keyword_weight * keyword_score)
            
            doc['combined_score'] = combined_score
            doc['normalized_vector_score'] = vector_score
            doc['normalized_keyword_score'] = keyword_score
            doc['rerank_method'] = 'weighted_sum'
        
        return documents
    
    def _reciprocal_rank_fusion(self, documents: List[Dict], k: int = 60) -> List[Dict]:
        """Re-rank using Reciprocal Rank Fusion (RRF)"""
        for doc in documents:
            vector_rank = doc.get('vector_rank', float('inf'))
            keyword_rank = doc.get('keyword_rank', float('inf'))
            
            # RRF formula: 1/(k + rank)
            vector_rrf = 1.0 / (k + vector_rank) if doc.get('has_vector', False) else 0.0
            keyword_rrf = 1.0 / (k + keyword_rank) if doc.get('has_keyword', False) else 0.0
            
            combined_score = vector_rrf + keyword_rrf
            
            doc['combined_score'] = combined_score
            doc['vector_rrf'] = vector_rrf
            doc['keyword_rrf'] = keyword_rrf
            doc['rerank_method'] = 'rrf'
        
        return documents
    
    def _adaptive_rerank(self, documents: List[Dict], query: str) -> List[Dict]:
        """Adaptive re-ranking based on query characteristics"""
        # Analyze query to determine optimal weighting
        query_tokens = query.lower().split()
        
        # Heuristics for adaptive weighting
        has_medical_terms = any(term in query.lower() for term in 
                              ['penyakit', 'gejala', 'diagnosis', 'pengobatan', 'terapi'])
        is_short_query = len(query_tokens) <= 3
        has_exact_phrases = '"' in query
        
        # Adjust weights based on query characteristics
        if has_exact_phrases or is_short_query:
            # Favor keyword search for exact matches and short queries
            adaptive_vector_weight = 0.3
            adaptive_keyword_weight = 0.7
        elif has_medical_terms:
            # Favor vector search for medical concept queries
            adaptive_vector_weight = 0.7
            adaptive_keyword_weight = 0.3
        else:
            # Use default weights
            adaptive_vector_weight = self.vector_weight
            adaptive_keyword_weight = self.keyword_weight
        
        # Apply weighted sum with adaptive weights
        original_weights = (self.vector_weight, self.keyword_weight)
        self.vector_weight = adaptive_vector_weight
        self.keyword_weight = adaptive_keyword_weight
        
        documents = self._weighted_sum_rerank(documents)
        
        # Restore original weights
        self.vector_weight, self.keyword_weight = original_weights
        
        # Add adaptive metadata
        for doc in documents:
            doc['rerank_method'] = 'adaptive'
            doc['adaptive_vector_weight'] = adaptive_vector_weight
            doc['adaptive_keyword_weight'] = adaptive_keyword_weight
        
        return documents
    
    def _update_stats(self, total_time: float, rerank_time: float):
        """Update performance statistics"""
        self.search_stats['total_searches'] += 1
        n = self.search_stats['total_searches']
        
        # Update running averages
        self.search_stats['avg_total_time'] = (
            (self.search_stats['avg_total_time'] * (n - 1) + total_time) / n
        )
        self.search_stats['avg_rerank_time'] = (
            (self.search_stats['avg_rerank_time'] * (n - 1) + rerank_time) / n
        )
    
    def save_indexes(self, vector_index_path: str, vector_metadata_path: str, 
                    bm25_index_path: str):
        """Save both search indexes to disk"""
        logger.info("Saving search indexes...")
        self.vector_db.save_index(vector_index_path, vector_metadata_path)
        self.bm25_search.save_index(bm25_index_path)
        logger.info("Search indexes saved successfully")
    
    def load_indexes(self, vector_index_path: str, vector_metadata_path: str,
                    bm25_index_path: str):
        """Load both search indexes from disk"""
        logger.info("Loading search indexes...")
        self.vector_db.load_index(vector_index_path, vector_metadata_path)
        self.bm25_search.load_index(bm25_index_path)
        logger.info("Search indexes loaded successfully")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive statistics about the hybrid search engine"""
        vector_stats = self.vector_db.get_stats()
        bm25_stats = self.bm25_search.get_stats()
        
        return {
            'hybrid_config': {
                'vector_weight': self.vector_weight,
                'keyword_weight': self.keyword_weight,
                'rerank_method': self.rerank_method,
                'use_parallel_search': self.use_parallel_search,
                'vector_top_k': self.vector_top_k,
                'keyword_top_k': self.keyword_top_k,
                'final_top_k': self.final_top_k
            },
            'vector_search': vector_stats,
            'keyword_search': bm25_stats,
            'performance': self.search_stats
        }


def main():
    """Test function for Hybrid Search Engine"""
    # Sample documents for testing
    sample_docs = [
        {
            'id': 'doc1',
            'title': 'Diabetes Melitus Tipe 2',
            'content': 'Diabetes melitus tipe 2 adalah penyakit metabolik yang ditandai dengan resistensi insulin dan tingginya kadar gula darah. Gejala meliputi poliuria, polidipsia, dan penurunan berat badan.',
            'data_source': 'test'
        },
        {
            'id': 'doc2', 
            'title': 'Hipertensi Esensial',
            'content': 'Hipertensi esensial adalah tekanan darah tinggi tanpa penyebab yang diketahui. Dapat menyebabkan komplikasi kardiovaskular seperti stroke dan penyakit jantung koroner.',
            'data_source': 'test'
        },
        {
            'id': 'doc3',
            'title': 'Penyakit Jantung Koroner',
            'content': 'Penyakit jantung koroner terjadi ketika pembuluh darah koroner mengalami penyempitan akibat plak aterosklerosis. Gejala utama adalah angina pektoris.',
            'data_source': 'test'
        }
    ]
    
    # Initialize hybrid search engine
    hybrid_engine = HybridSearchEngine(
        rerank_method="adaptive",
        use_parallel_search=True,
        embedding_model="sentence-transformers"  # Use sentence transformers for testing
    )
    
    # Add documents
    hybrid_engine.add_documents(sample_docs)
    
    # Test searches
    test_queries = [
        "diabetes gula darah tinggi",
        "tekanan darah hipertensi", 
        "jantung koroner angina",
        "penyakit metabolik"
    ]
    
    for query in test_queries:
        print(f"\n{'='*50}")
        print(f"Query: '{query}'")
        print('='*50)
        
        results = hybrid_engine.search(query, top_k=3)
        
        for i, result in enumerate(results, 1):
            print(f"\n{i}. {result['title']}")
            print(f"   Combined Score: {result['combined_score']:.3f}")
            print(f"   Vector: {result.get('has_vector', False)} "
                  f"({result.get('normalized_vector_score', 0):.3f})")
            print(f"   Keyword: {result.get('has_keyword', False)} "
                  f"({result.get('normalized_keyword_score', 0):.3f})")
            print(f"   Method: {result.get('rerank_method', 'unknown')}")
    
    # Print overall stats
    print(f"\n{'='*50}")
    print("Hybrid Search Engine Statistics")
    print('='*50)
    stats = hybrid_engine.get_stats()
    
    print(f"Vector Documents: {stats['vector_search']['total_documents']}")
    print(f"Keyword Documents: {stats['keyword_search']['total_documents']}")
    print(f"Total Searches: {stats['performance']['total_searches']}")
    print(f"Avg Total Time: {stats['performance']['avg_total_time']:.3f}s")


if __name__ == "__main__":
    main()