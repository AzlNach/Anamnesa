#!/usr/bin/env python3
"""
NCBI PMC FTP Crawler for RAG Knowledge Base
Crawls NCBI FTP server untuk mendownload dan memproses paper medis
"""

import os
import sys
import json
import logging
import requests
import pymupdf  # PyMuPDF for PDF processing
from pathlib import Path
from typing import List, Dict, Set, Optional
import time
from datetime import datetime
import concurrent.futures
from urllib.parse import urljoin, urlparse
import re
from dataclasses import dataclass
import sqlite3
import hashlib

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(Path(__file__).parent / 'logs' / 'ncbi_crawler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ProcessedPaper:
    """Data class for processed paper information"""
    url: str
    title: str
    content: str
    file_hash: str
    processed_date: str
    content_length: int
    success: bool
    error_message: Optional[str] = None

class NCBICrawler:
    """NCBI PMC FTP Crawler with parallel processing and incremental indexing"""
    
    def __init__(self, 
                 base_url: str = "https://ftp.ncbi.nlm.nih.gov/pub/pmc/oa_pdf/",
                 max_workers: int = 10,
                 timeout: int = 30,
                 max_papers_per_run: int = 1000):  # Increased from 100 to 1000
        
        self.base_url = base_url
        self.max_workers = max_workers
        self.timeout = timeout
        self.max_papers_per_run = max_papers_per_run
        
        # Setup paths
        self.data_dir = Path(__file__).parent / 'data' / 'ncbi'
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        self.db_path = self.data_dir / 'processed_papers.db'
        self.papers_json = self.data_dir / 'processed_papers.json'
        
        # Initialize database
        self._init_database()
        
        # Load processed URLs
        self.processed_urls = self._load_processed_urls()
        
        logger.info(f"Initialized NCBI Crawler with {len(self.processed_urls)} previously processed papers")
    
    def _init_database(self):
        """Initialize SQLite database for tracking processed papers"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS processed_papers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT UNIQUE,
                file_hash TEXT,
                title TEXT,
                content TEXT,
                content_length INTEGER,
                processed_date TEXT,
                success BOOLEAN,
                error_message TEXT
            )
        ''')
        
        # Create index for faster lookups
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_url ON processed_papers(url)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_hash ON processed_papers(file_hash)')
        
        conn.commit()
        conn.close()
    
    def _load_processed_urls(self) -> Set[str]:
        """Load set of already processed URLs from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT url FROM processed_papers WHERE success = 1')
        urls = {row[0] for row in cursor.fetchall()}
        
        conn.close()
        return urls
    
    def _save_processed_paper(self, paper: ProcessedPaper):
        """Save processed paper info to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO processed_papers 
            (url, file_hash, title, content, content_length, processed_date, success, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            paper.url,
            paper.file_hash,
            paper.title,
            paper.content,
            paper.content_length,
            paper.processed_date,
            paper.success,
            paper.error_message
        ))
        
        conn.commit()
        conn.close()
        
        if paper.success:
            self.processed_urls.add(paper.url)
    
    def discover_pdf_urls(self, max_directories: int = 20) -> List[str]:  # Increased from 5 to 20
        """Discover PDF URLs from NCBI FTP directory structure"""
        logger.info("Starting PDF URL discovery...")
        
        pdf_urls = []
        directories_processed = 0
        
        # Known directory structure based on provided example
        # Format: https://ftp.ncbi.nlm.nih.gov/pub/pmc/oa_pdf/00/00/filename.pdf
        level1_dirs = [
            '00', '01', '02', '03', '04', '05', '06', '07', '08', '09',
            '0a', '0b', '0c', '0d', '0e', '0f', '10', '11', '12', '13',
            '14', '15', '16', '17', '18', '19', '1a', '1b', '1c', '1d',
            '1e', '1f', '20', '21', '22', '23', '24', '25', '26', '27',
            '28', '29', '2a', '2b', '2c', '2d', '2e', '2f', '30'
        ]
        
        # Level 2 directories (same pattern)
        level2_dirs = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09']
        
        try:
            for level1 in level1_dirs[:max_directories]:  # Limit for testing
                if directories_processed >= max_directories:
                    break
                
                logger.info(f"Processing level-1 directory: {level1}/")
                
                for level2 in level2_dirs[:5]:  # Increased from 3 to 5 for more coverage
                    dir_url = f"{self.base_url}{level1}/{level2}/"
                    
                    try:
                        logger.info(f"Checking directory: {dir_url}")
                        response = requests.get(dir_url, timeout=self.timeout)
                        
                        if response.status_code == 200:
                            # Look for PDF files in the directory listing
                            # Pattern: href="filename.pdf"
                            pdf_pattern = r'href="([^"]+\.pdf)"'
                            pdf_matches = re.findall(pdf_pattern, response.text, re.IGNORECASE)
                            
                            for pdf_file in pdf_matches:
                                # Skip parent directory links
                                if pdf_file.startswith('../'):
                                    continue
                                
                                # Construct full URL
                                pdf_url = urljoin(dir_url, pdf_file)
                                
                                # Validate PDF URL format
                                if self._is_valid_pdf_url(pdf_url):
                                    if pdf_url not in self.processed_urls:
                                        pdf_urls.append(pdf_url)
                                        logger.info(f"Found PDF: {pdf_file}")
                                
                                if len(pdf_urls) >= self.max_papers_per_run:
                                    logger.info(f"Reached limit of {self.max_papers_per_run} papers")
                                    return pdf_urls
                        
                        else:
                            logger.debug(f"Directory {dir_url} returned status {response.status_code}")
                    
                    except requests.exceptions.RequestException as e:
                        logger.warning(f"Error accessing {dir_url}: {e}")
                        continue
                    
                    except Exception as e:
                        logger.warning(f"Unexpected error with {dir_url}: {e}")
                        continue
                
                directories_processed += 1
                
                # Add small delay to be respectful to the server
                time.sleep(0.1)
        
        except Exception as e:
            logger.error(f"Error in PDF URL discovery: {e}")
            return []
        
        logger.info(f"Discovered {len(pdf_urls)} new PDF URLs")
        return pdf_urls
    
    def _is_valid_pdf_url(self, url: str) -> bool:
        """Validate if URL is a valid PDF URL"""
        try:
            # Check if URL ends with .pdf
            if not url.lower().endswith('.pdf'):
                return False
            
            # Check if URL contains PMC (PubMed Central identifier)
            if 'PMC' not in url:
                return False
            
            # Check URL structure
            parsed = urlparse(url)
            if not parsed.netloc or not parsed.path:
                return False
            
            return True
        except:
            return False
    
    def process_single_pdf(self, pdf_url: str) -> ProcessedPaper:
        """Process a single PDF file"""
        try:
            # Download PDF content
            response = requests.get(pdf_url, timeout=self.timeout, stream=True)
            response.raise_for_status()
            
            pdf_content = response.content
            file_hash = hashlib.md5(pdf_content).hexdigest()
            
            # Check if we've already processed this exact file (by hash)
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('SELECT url FROM processed_papers WHERE file_hash = ? AND success = 1', (file_hash,))
            existing = cursor.fetchone()
            conn.close()
            
            if existing:
                logger.info(f"File already processed (duplicate): {pdf_url}")
                return ProcessedPaper(
                    url=pdf_url,
                    title="Duplicate file",
                    content="",
                    file_hash=file_hash,
                    processed_date=datetime.now().isoformat(),
                    content_length=0,
                    success=False,
                    error_message="Duplicate file already processed"
                )
            
            # Extract text using PyMuPDF
            pdf_document = pymupdf.open(stream=pdf_content, filetype="pdf")
            
            # Extract title from first page
            first_page = pdf_document[0]
            first_page_text = first_page.get_text()
            title_lines = first_page_text.split('\n')[:5]  # First 5 lines likely contain title
            title = ' '.join(title_lines).strip()[:200]  # Limit title length
            
            # Extract full text
            full_text = ""
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]
                full_text += page.get_text() + "\n"
            
            pdf_document.close()
            
            # Clean and validate text
            full_text = full_text.strip()
            if len(full_text) < 100:  # Skip papers with too little text
                return ProcessedPaper(
                    url=pdf_url,
                    title=title,
                    content="",
                    file_hash=file_hash,
                    processed_date=datetime.now().isoformat(),
                    content_length=len(full_text),
                    success=False,
                    error_message="Insufficient text content"
                )
            
            logger.info(f"Successfully processed: {os.path.basename(pdf_url)} ({len(full_text)} chars)")
            
            return ProcessedPaper(
                url=pdf_url,
                title=title,
                content=full_text,
                file_hash=file_hash,
                processed_date=datetime.now().isoformat(),
                content_length=len(full_text),
                success=True
            )
            
        except Exception as e:
            logger.error(f"Error processing {pdf_url}: {e}")
            return ProcessedPaper(
                url=pdf_url,
                title="",
                content="",
                file_hash="",
                processed_date=datetime.now().isoformat(),
                content_length=0,
                success=False,
                error_message=str(e)
            )
    
    def crawl_and_process(self, max_papers: int = None) -> Dict[str, any]:
        """Main method to crawl and process papers"""
        start_time = time.time()
        
        if max_papers:
            self.max_papers_per_run = max_papers
        
        logger.info(f"Starting NCBI crawl with max {self.max_papers_per_run} papers")
        
        # Discover PDF URLs
        pdf_urls = self.discover_pdf_urls()
        
        if not pdf_urls:
            logger.warning("No new PDF URLs discovered")
            return {
                'total_discovered': 0,
                'successfully_processed': 0,
                'failed': 0,
                'processing_time': time.time() - start_time,
                'papers': []
            }
        
        # Process PDFs in parallel
        processed_papers = []
        successful = 0
        failed = 0
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all tasks
            future_to_url = {
                executor.submit(self.process_single_pdf, url): url 
                for url in pdf_urls[:self.max_papers_per_run]
            }
            
            # Process completed tasks
            for future in concurrent.futures.as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    paper = future.result()
                    processed_papers.append(paper)
                    
                    # Save to database
                    self._save_processed_paper(paper)
                    
                    if paper.success:
                        successful += 1
                    else:
                        failed += 1
                    
                    logger.info(f"Progress: {len(processed_papers)}/{len(future_to_url)} completed")
                    
                except Exception as e:
                    logger.error(f"Error processing future for {url}: {e}")
                    failed += 1
        
        # Save results to JSON for external access
        results = {
            'timestamp': datetime.now().isoformat(),
            'total_discovered': len(pdf_urls),
            'successfully_processed': successful,
            'failed': failed,
            'processing_time': time.time() - start_time,
            'papers': [
                {
                    'url': paper.url,
                    'title': paper.title,
                    'content_length': paper.content_length,
                    'success': paper.success,
                    'error_message': paper.error_message
                }
                for paper in processed_papers
            ]
        }
        
        # Also save papers with full content for RAG system
        papers_with_content = self.get_processed_papers_for_rag()
        content_results = {
            'timestamp': datetime.now().isoformat(),
            'total_papers': len(papers_with_content),
            'source': 'NCBI_PMC_FTP',
            'papers': papers_with_content
        }
        
        # Save content version for RAG system
        content_file = str(self.data_dir / 'ncbi_papers_content.json')
        with open(content_file, 'w', encoding='utf-8') as f:
            json.dump(content_results, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Saved {len(papers_with_content)} papers with content to {content_file}")
        
        with open(self.papers_json, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Crawling completed: {successful} successful, {failed} failed")
        logger.info(f"Total processing time: {results['processing_time']:.2f} seconds")
        
        return results
    
    def get_processed_papers_for_rag(self, limit: int = None) -> List[Dict]:
        """Get processed papers in format suitable for RAG indexing"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = '''
            SELECT url, title, content, content_length, processed_date, file_hash
            FROM processed_papers 
            WHERE success = 1 AND content_length > 100
            ORDER BY processed_date DESC
        '''
        
        if limit:
            query += f' LIMIT {limit}'
        
        cursor.execute(query)
        rows = cursor.fetchall()
        conn.close()
        
        papers = []
        for row in rows:
            papers.append({
                'id': row[5],  # file_hash as ID
                'source': 'NCBI_PMC',
                'title': row[1],
                'content': row[2],  # Full text content
                'url': row[0],
                'content_length': row[3],
                'processed_date': row[4],
                'file_type': 'application/pdf'
            })
        
        return papers
    
    def export_for_rag_integration(self, output_file: str = None):
        """Export processed papers for RAG system integration"""
        if not output_file:
            output_file = str(self.data_dir / 'rag_papers.json')
        
        papers = self.get_processed_papers_for_rag()
        
        export_data = {
            'timestamp': datetime.now().isoformat(),
            'total_papers': len(papers),
            'source': 'NCBI_PMC_FTP',
            'papers': papers
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Exported {len(papers)} papers to {output_file}")
        return output_file

def main():
    """Main function for testing the crawler"""
    print("🕷️  NCBI PMC FTP Crawler")
    print("=" * 50)
    
    # Initialize crawler with higher limits
    crawler = NCBICrawler(
        max_workers=8,  # Increased for better performance
        max_papers_per_run=1000  
    )
    
    try:
        # Run crawling
        results = crawler.crawl_and_process()
        
        print(f"\n📊 Crawling Results:")
        print(f"   Discovered URLs: {results['total_discovered']}")
        print(f"   Successfully processed: {results['successfully_processed']}")
        print(f"   Failed: {results['failed']}")
        print(f"   Processing time: {results['processing_time']:.2f} seconds")
        
        # Export for RAG integration
        export_file = crawler.export_for_rag_integration()
        print(f"\n💾 RAG integration file: {export_file}")
        
        # Show sample papers
        papers = crawler.get_processed_papers_for_rag(limit=3)
        if papers:
            print(f"\n📄 Sample processed papers:")
            for i, paper in enumerate(papers, 1):
                print(f"   {i}. {paper['title'][:60]}...")
                print(f"      Length: {paper['content_length']} chars")
                print(f"      URL: {paper['url']}")
        
    except KeyboardInterrupt:
        print("\n⚠️  Crawling interrupted by user")
    except Exception as e:
        print(f"\n❌ Error during crawling: {e}")
        logger.error(f"Crawling error: {e}")

if __name__ == "__main__":
    main()
