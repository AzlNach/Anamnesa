#!/usr/bin/env python3
"""
BM25 Keyword Search Implementation for RAG System
Provides keyword-based search using BM25 algorithm with Indonesian text preprocessing
"""

import os
import re
import json
import logging
import pickle
from typing import List, Dict, Any, Set
from pathlib import Path
import numpy as np
from rank_bm25 import BM25Okapi
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BM25Search:
    """
    BM25 keyword-based search with Indonesian text preprocessing
    Provides fast keyword matching and ranking
    """
    
    def __init__(self, 
                 language: str = "indonesian",
                 use_stemming: bool = True,
                 remove_stopwords: bool = True,
                 min_word_length: int = 2,
                 k1: float = 1.2,
                 b: float = 0.75):
        """
        Initialize BM25 Search
        
        Args:
            language: Language for stopwords and processing
            use_stemming: Whether to apply stemming
            remove_stopwords: Whether to remove stopwords
            min_word_length: Minimum word length to include
            k1: BM25 parameter controlling term frequency scaling
            b: BM25 parameter controlling document length normalization
        """
        self.language = language
        self.use_stemming = use_stemming
        self.remove_stopwords = remove_stopwords
        self.min_word_length = min_word_length
        self.k1 = k1
        self.b = b
        
        # Initialize NLTK components
        self._download_nltk_data()
        
        # Initialize text processing components
        if self.use_stemming:
            self.stemmer = PorterStemmer()  # For English; could add Indonesian stemmer
        
        if self.remove_stopwords:
            try:
                self.stopwords = set(stopwords.words(language))
            except:
                logger.warning(f"Stopwords for {language} not available, using English")
                self.stopwords = set(stopwords.words('english'))
                
                # Add common Indonesian stopwords manually
                indonesian_stopwords = {
                    'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'dalam', 
                    'adalah', 'ini', 'itu', 'atau', 'jika', 'dapat', 'akan', 'tidak', 
                    'ada', 'bila', 'oleh', 'satu', 'dua', 'tiga', 'juga', 'sudah', 
                    'telah', 'masih', 'hanya', 'sama', 'bisa', 'maka', 'agar', 'supaya',
                    'ia', 'dia', 'kita', 'kami', 'mereka', 'saya', 'anda', 'nya'
                }
                self.stopwords.update(indonesian_stopwords)
        else:
            self.stopwords = set()
        
        # Initialize BM25 components
        self.bm25 = None
        self.documents = []
        self.tokenized_docs = []
        self.doc_ids = []
        
        logger.info(f"Initialized BM25Search for {language} language")
    
    def _download_nltk_data(self):
        """Download required NLTK data"""
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            logger.info("Downloading NLTK punkt tokenizer...")
            nltk.download('punkt', quiet=True)
        
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            logger.info("Downloading NLTK stopwords...")
            nltk.download('stopwords', quiet=True)
    
    def preprocess_text(self, text: str) -> List[str]:
        """
        Preprocess text for keyword search
        
        Args:
            text: Input text to preprocess
            
        Returns:
            List of processed tokens
        """
        if not text:
            return []
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove non-alphanumeric characters but keep spaces
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        
        # Tokenize
        try:
            tokens = word_tokenize(text)
        except:
            # Fallback to simple split if NLTK tokenizer fails
            tokens = text.split()
        
        # Filter tokens
        processed_tokens = []
        for token in tokens:
            # Skip short tokens
            if len(token) < self.min_word_length:
                continue
            
            # Skip stopwords
            if self.remove_stopwords and token in self.stopwords:
                continue
            
            # Apply stemming
            if self.use_stemming:
                token = self.stemmer.stem(token)
            
            processed_tokens.append(token)
        
        return processed_tokens
    
    def add_documents(self, documents: List[Dict[str, Any]]):
        """
        Add documents to BM25 index
        
        Args:
            documents: List of document dictionaries with 'content' field
        """
        if not documents:
            logger.warning("No documents to add")
            return
        
        logger.info(f"Adding {len(documents)} documents to BM25 index")
        
        # Process documents
        for doc in documents:
            content = doc.get('content', '')
            if not content:
                logger.warning(f"Document {doc.get('id', 'unknown')} has no content")
                continue
            
            # Combine title and content for better matching
            title = doc.get('title', '')
            full_text = f"{title} {content}".strip()
            
            # Preprocess text
            tokens = self.preprocess_text(full_text)
            
            if tokens:
                self.documents.append(doc)
                self.tokenized_docs.append(tokens)
                self.doc_ids.append(doc.get('id', f'doc_{len(self.documents)}'))
        
        # Build BM25 index
        if self.tokenized_docs:
            self.bm25 = BM25Okapi(self.tokenized_docs, k1=self.k1, b=self.b)
            logger.info(f"Built BM25 index with {len(self.tokenized_docs)} documents")
        else:
            logger.error("No valid documents for BM25 indexing")
    
    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search documents using BM25 keyword matching
        
        Args:
            query: Search query text
            top_k: Number of top results to return
            
        Returns:
            List of matching documents with BM25 scores
        """
        if self.bm25 is None or len(self.documents) == 0:
            logger.warning("No documents in BM25 index")
            return []
        
        # Preprocess query
        query_tokens = self.preprocess_text(query)
        if not query_tokens:
            logger.warning("No valid tokens in query after preprocessing")
            return []
        
        # Get BM25 scores
        scores = self.bm25.get_scores(query_tokens)
        
        # Get top-k results
        top_indices = np.argsort(scores)[::-1][:min(top_k, len(self.documents))]
        
        results = []
        for i, idx in enumerate(top_indices):
            if scores[idx] <= 0:  # Skip documents with zero score
                continue
                
            doc = self.documents[idx].copy()
            doc['bm25_score'] = float(scores[idx])
            doc['rank'] = i + 1
            doc['search_method'] = 'bm25_keyword'
            doc['matched_tokens'] = self._get_matched_tokens(query_tokens, self.tokenized_docs[idx])
            
            results.append(doc)
        
        return results
    
    def _get_matched_tokens(self, query_tokens: List[str], doc_tokens: List[str]) -> List[str]:
        """Get tokens that matched between query and document"""
        doc_token_set = set(doc_tokens)
        matched = [token for token in query_tokens if token in doc_token_set]
        return matched
    
    def get_document_tokens(self, doc_index: int) -> List[str]:
        """Get processed tokens for a specific document"""
        if 0 <= doc_index < len(self.tokenized_docs):
            return self.tokenized_docs[doc_index]
        return []
    
    def save_index(self, index_path: str):
        """Save BM25 index to disk"""
        try:
            index_data = {
                'bm25': self.bm25,
                'documents': self.documents,
                'tokenized_docs': self.tokenized_docs,
                'doc_ids': self.doc_ids,
                'config': {
                    'language': self.language,
                    'use_stemming': self.use_stemming,
                    'remove_stopwords': self.remove_stopwords,
                    'min_word_length': self.min_word_length,
                    'k1': self.k1,
                    'b': self.b
                }
            }
            
            with open(index_path, 'wb') as f:
                pickle.dump(index_data, f)
            
            logger.info(f"Saved BM25 index to {index_path}")
        except Exception as e:
            logger.error(f"Error saving BM25 index: {e}")
    
    def load_index(self, index_path: str):
        """Load BM25 index from disk"""
        try:
            with open(index_path, 'rb') as f:
                index_data = pickle.load(f)
            
            self.bm25 = index_data['bm25']
            self.documents = index_data['documents']
            self.tokenized_docs = index_data['tokenized_docs']
            self.doc_ids = index_data['doc_ids']
            
            # Load configuration
            config = index_data.get('config', {})
            self.language = config.get('language', self.language)
            self.use_stemming = config.get('use_stemming', self.use_stemming)
            self.remove_stopwords = config.get('remove_stopwords', self.remove_stopwords)
            self.min_word_length = config.get('min_word_length', self.min_word_length)
            self.k1 = config.get('k1', self.k1)
            self.b = config.get('b', self.b)
            
            logger.info(f"Loaded BM25 index from {index_path} with {len(self.documents)} documents")
        except Exception as e:
            logger.error(f"Error loading BM25 index: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the BM25 index"""
        avg_doc_length = np.mean([len(doc) for doc in self.tokenized_docs]) if self.tokenized_docs else 0
        
        return {
            'total_documents': len(self.documents),
            'language': self.language,
            'use_stemming': self.use_stemming,
            'remove_stopwords': self.remove_stopwords,
            'min_word_length': self.min_word_length,
            'avg_document_length': float(avg_doc_length),
            'bm25_params': {'k1': self.k1, 'b': self.b},
            'vocabulary_size': len(set([token for doc in self.tokenized_docs for token in doc])) if self.tokenized_docs else 0
        }


def main():
    """Test function for BM25 Search"""
    # Sample documents for testing
    sample_docs = [
        {
            'id': 'doc1',
            'title': 'Diabetes Melitus',
            'content': 'Diabetes melitus adalah penyakit metabolik yang ditandai dengan tingginya kadar gula darah. Penyakit ini dapat menyebabkan komplikasi serius.',
            'data_source': 'test'
        },
        {
            'id': 'doc2', 
            'title': 'Hipertensi',
            'content': 'Hipertensi atau tekanan darah tinggi adalah kondisi medis kronis yang dapat menyebabkan penyakit jantung dan stroke.',
            'data_source': 'test'
        },
        {
            'id': 'doc3',
            'title': 'Penyakit Jantung',
            'content': 'Penyakit jantung koroner adalah kondisi di mana pembuluh darah yang memasok darah ke jantung mengalami penyempitan.',
            'data_source': 'test'
        }
    ]
    
    # Initialize BM25 search
    bm25_search = BM25Search()
    
    # Add documents
    bm25_search.add_documents(sample_docs)
    
    # Test searches
    test_queries = [
        "penyakit gula darah",
        "tekanan darah tinggi", 
        "jantung koroner",
        "diabetes komplikasi"
    ]
    
    for query in test_queries:
        print(f"\nQuery: '{query}'")
        results = bm25_search.search(query, top_k=3)
        
        for result in results:
            print(f"- {result['title']}: BM25={result['bm25_score']:.3f}, Matched={result['matched_tokens']}")
    
    # Print stats
    print("\nBM25 Index Stats:")
    stats = bm25_search.get_stats()
    for key, value in stats.items():
        print(f"- {key}: {value}")


if __name__ == "__main__":
    main()