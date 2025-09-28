# Anamnesa AI - Enhanced RAG-Powered Medical Consultation Assistant

**Description**  
Anamnesa AI adalah aplikasi web berbasis Next.js dengan sistem **Enhanced RAG (Retrieval-Augmented Generation) Hybrid Search** yang berfungsi sebagai asisten konsultasi kesehatan AI. Aplikasi ini menggunakan teknologi Google Gemini AI dan sistem RAG hybrid yang menggabungkan FAISS Vector Database dengan BM25 Keyword Search untuk melakukan analisis gejala, proses anamnesis interaktif, dan mengakses database pengetahuan medis yang luas dari Google Drive dan NCBI PMC dengan performa tinggi tanpa timeout.

---

## 🧑‍💻 Team

| **Name** | **Role**        |
|-----------|----------------|
| Azel (AzlNach) | Full Stack Developer & AI Engineer |

---

## 🚀 Features

### Core Medical AI Features
- **🤖 AI-Powered Symptom Analysis**: Analisis gejala menggunakan Google Gemini AI untuk ekstraksi dan interpretasi keluhan medis secara akurat.
- **💬 Interactive Anamnesis**: Proses tanya jawab interaktif berbasis AI dengan minimal 5-10 pertanyaan dinamis berdasarkan kompleksitas kasus.
- **📸 Enhanced Medical Image Analysis**: Analisis gambar medis dengan AI segmentasi menggunakan Chain of Thought prompting untuk diagnosis visual yang komprehensif, dilengkapi dengan fitur download hasil dan pencarian dokter terdekat.
- **🧠 Chain of Thought Medical Analysis**: Pendekatan analisis step-by-step (6 tahap) untuk memberikan reasoning yang jelas dan diagnosis yang lebih akurat.
- **🎯 Intelligent Medical Diagnosis**: Sintesis komprehensif informasi untuk memberikan diagnosis yang paling mungkin dengan tingkat keyakinan.
- **📄 Professional PDF Export**: Ekspor hasil konsultasi dan analisis gambar dalam format PDF A4 dengan design medis profesional.
- **🏥 Find Nearby Doctors**: Integrasi pencarian dokter terdekat berdasarkan hasil diagnosis menggunakan Google Maps API.
- **📱 Action-Ready Results**: Setiap hasil diagnosis dilengkapi dengan opsi download dan pencarian dokter untuk kemudahan follow-up.

### Advanced Enhanced RAG System Features
- **🚀 Hybrid Search Engine**: Sistem pencarian hybrid yang menggabungkan FAISS Vector Database dan BM25 Keyword Search dengan parallel processing untuk performa optimal.
- **⚡ FAISS Vector Database**: Pencarian semantik super cepat menggunakan Facebook AI Similarity Search dengan support GPU acceleration dan multiple index types.
- **� BM25 Keyword Search**: Pencarian berbasis kata kunci dengan preprocessing bahasa Indonesia, stemming, dan stopwords removal.
- **🧠 Intelligent Re-ranking**: 3 metode re-ranking (Weighted Sum, Reciprocal Rank Fusion, Adaptive) untuk hasil pencarian yang paling relevan.
- **�📚 Enhanced RAG-Powered Knowledge Base**: Sistem Retrieval-Augmented Generation yang mengakses database pengetahuan medis dari multiple sources dengan timeout handling.
- **☁️ Google Drive Integration**: Akses dan indeks dokumen medis dari Google Drive dengan support multi-format (PDF, DOCX, TXT, CSV, JSON).
- **🧬 NCBI PMC Literature Crawler**: Crawler otomatis untuk mengakses dan memproses literature medis dari NCBI PMC database.
- **⚡ Ultra-Fast Response**: Response time <1 detik dengan index caching dan parallel search processing.
- **🔍 Semantic Document Search**: Pencarian dokumen berdasarkan similarity score menggunakan embeddings untuk menemukan informasi yang paling relevan.
- **📖 Contextual Medical Responses**: Response yang diperkaya dengan referensi dokumen dan similarity scores untuk transparansi sumber informasi.
- **🎯 Multi-Context Support**: Support untuk context anamnesis, diagnosis, dan general medical consultation.
- **🛡️ Timeout Protection**: Sistem timeout handling 25 detik dengan fallback mechanism untuk mencegah "signal is aborted without reason".

### Technical Features
- **⚡ Ultra-Fast Response Time**: Rata-rata response time <1 detik dengan hybrid search dan index caching (improvement 65-80% dari sistem sebelumnya).
- **🛡️ Zero Timeout Issues**: Sistem timeout protection dan fallback mechanism mengeliminasi error "signal is aborted without reason".
- **🚀 FAISS Performance**: Vector similarity search dengan FAISS untuk dataset besar (500MB+) dengan memory efficiency tinggi.
- **🔄 Parallel Processing**: Pencarian vector dan keyword berjalan secara paralel untuk maksimum throughput.
- **💾 Intelligent Caching**: Index caching otomatis untuk startup aplikasi yang sangat cepat pada subsequent runs.
- **🔒 API Cost Optimization**: Sistem caching dan optimization untuk menghemat penggunaan API dengan local embeddings.
- **📊 Performance Monitoring**: Built-in performance metrics dan statistics untuk monitoring real-time.
- **🌐 Production-Ready**: Fully optimized untuk production deployment dengan error handling yang robust.

---

## 📁 Struktur Proyek

```
anamnesa/
├── app/
│   ├── api/
│   │   ├── analyze/          # Analisis awal gejala
│   │   ├── anamnesis/        # Pertanyaan lanjutan  
│   │   ├── final-diagnosis/  # Diagnosis final
│   │   ├── image-analysis/   # Analisis gambar medis dengan AI
│   │   └── rag/             # RAG API endpoint (NEW!)
│   ├── components/
│   │   ├── DeveloperFooter.tsx
│   │   ├── FloatingActionButton.tsx
│   │   ├── ImageAnalysis.tsx # Komponen analisis gambar dengan download & find doctors
│   │   ├── RAGAssistant.tsx  # RAG assistant component (NEW!)
│   │   └── NoDataError.tsx
│   ├── consultation/         # Halaman proses anamnesis
│   ├── image-analysis/       # Halaman analisis gambar dengan action buttons
│   ├── results/             # Halaman hasil diagnosis dengan download & find doctors
│   ├── lib/                 # Utility functions
│   │   ├── pdfGenerator.ts  # PDF generation untuk konsultasi dan image analysis
│   │   ├── utils.ts         # General utilities
│   │   └── ragUtils.ts      # RAG utilities (NEW!)
│   ├── globals.css          # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage with RAG integration
├── rag-system/             # Enhanced RAG System Backend
│   ├── faiss_vector_db.py  # FAISS Vector Database engine
│   ├── bm25_search.py      # BM25 Keyword Search engine  
│   ├── hybrid_search_engine.py # Hybrid Search combining FAISS + BM25
│   ├── indexer.py          # Google Drive document indexer
│   ├── retriever.py        # Original RAG retrieval engine (fallback)
│   ├── api_retriever.py    # Production API interface with hybrid search
│   ├── ncbi_crawler.py     # NCBI PMC literature crawler
│   ├── credentials.json    # Google Drive credentials
│   ├── .env                # Environment variables
│   ├── requirements.txt    # Python dependencies (production-ready)
│   └── logs/              # System logs
├── public/                 # Static assets
├── .env.local             # Next.js environment variables
├── package.json          # Node.js dependencies
├── next.config.ts        # Next.js configuration
└── README.md            # This file
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom React components
- **PDF Generation**: jsPDF with custom medical templates

### Backend & AI
- **Language**: Python 3.11.9
- **AI Model**: Google Gemini (gemini-1.5-flash, text-embedding-004)
- **Primary RAG**: Custom Hybrid Search Engine (FAISS + BM25)
- **Vector Search**: FAISS (Facebook AI Similarity Search) with GPU support
- **Keyword Search**: BM25Okapi with Indonesian text preprocessing
- **Fallback RAG**: LangChain-based system for compatibility
- **Text Processing**: Sentence Transformers for local embeddings
- **Document Processing**: PyMuPDF, python-docx, PyPDF2
- **Web Scraping**: requests, BeautifulSoup4
- **Performance**: NumPy 1.26.4 for FAISS compatibility

### Data Sources
- **Primary**: Google Drive API with OAuth 2.0
- **Secondary**: NCBI PMC FTP literature database
- **Formats**: PDF, DOCX, TXT, CSV, JSON
- **Storage**: FAISS binary indexes + JSON metadata for ultra-fast retrieval
- **Caching**: Automatic index caching di `data/indexes/` folder

### Development & Testing
- **Production Ready**: Optimized untuk production deployment
- **Logging**: Python logging dengan file rotation
- **Environment**: dotenv configuration management
- **API Integration**: RESTful APIs dengan comprehensive error handling
- **Performance Monitoring**: Built-in metrics dan statistics tracking

---

## 📋 Prerequisites

- **Node.js** v18+ dan npm
- **Python** 3.11+
- **Google Cloud Account** dengan Gemini API access
- **Google Drive API** credentials (credentials.json)
- **Internet connection** untuk NCBI PMC access
- **Memory**: Minimum 4GB RAM untuk dataset besar
- **Storage**: Minimum 2GB free space untuk index caching

---

## ⚙️ Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/AzlNach/Anamnesa.git
cd anamnesa
```

### 2. Frontend Setup (Next.js)
```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

### 3. Backend Setup (Enhanced RAG System)
```bash
cd rag-system

# Install Python dependencies (Critical: NumPy compatibility)
pip install numpy==1.26.4
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

Edit `rag-system/.env`:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id_here
```

### 4. Google Drive API Setup

1. **Buat Project di Google Cloud Console**
   - Buka [Google Cloud Console](https://console.cloud.google.com/)
   - Buat project baru atau pilih existing project

2. **Enable APIs**
   - Google Drive API
   - Google Gemini API (AI Platform)

3. **Buat Service Account**
   - Pergi ke "IAM & Admin" > "Service Accounts"
   - Klik "Create Service Account"
   - Download credentials JSON file
   - Rename menjadi `credentials.json` dan letakkan di folder `rag-system/`

4. **Setup Google Drive Permissions**
   - Share folder Google Drive Anda dengan email service account
   - Berikan permission "Viewer" atau "Editor"
   - Copy folder ID dari URL dan masukkan ke `.env`

### 5. Initial Data Indexing & Performance Optimization
```bash
cd rag-system

# Run indexing untuk pertama kali (akan membangun FAISS + BM25 indexes)
python indexer.py

# Test hybrid search system
python -c "import hybrid_search_engine; print('Hybrid Search: Ready!')"
```

**Expected Results:**
- ✅ FAISS Vector Database: Index built successfully
- ✅ BM25 Keyword Search: Index built successfully  
- ✅ Hybrid Search Engine: Ready for production
- ✅ Index Caching: Saved to `data/indexes/` for fast startup

---

## 🚀 Running the Application

### 1. Start Next.js Development Server
```bash
# Dari root directory
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### 2. Test Enhanced RAG System
```bash
cd rag-system

# Quick test untuk memastikan hybrid search berfungsi
python faiss_vector_db.py
python bm25_search.py
python hybrid_search_engine.py

# Test API integration
python api_retriever.py "diabetes melitus gejala" 5 anamnesis true
```

---

## 📖 Usage Guide

### Basic Medical Consultation with Complete Workflow
1. **Buka aplikasi** di browser
2. **Masukkan keluhan** pada form utama
3. **Ikuti proses anamnesis** interaktif dengan AI
4. **Review hasil diagnosis** dengan referensi medis
5. **Download PDF** hasil konsultasi profesional
6. **Cari dokter terdekat** untuk konsultasi lanjutan
7. **Follow-up** dengan tenaga medis yang qualified

### Enhanced RAG Queries with Hybrid Search
1. **Gunakan RAG Assistant** di homepage
2. **Masukkan pertanyaan medis** dalam bahasa Indonesia atau Inggris
3. **Pilih context** (anamnesis/diagnosis/general)
4. **Dapatkan response ultra-cepat** (<1 detik) dengan hybrid search
5. **Review source references** dengan similarity scores
6. **Similarity scores** menunjukkan relevansi sumber dari both vector dan keyword search

### Medical Image Analysis with Enhanced Features
1. **Upload gambar medis** (X-ray, CT scan, MRI, dll)
2. **Tambahkan deskripsi** atau keluhan terkait (opsional)
3. **Proses analisis AI** dengan Chain of Thought reasoning
4. **Review hasil** diagnosis visual komprehensif
5. **Download PDF** hasil analisis dengan format profesional
6. **Cari dokter terdekat** berdasarkan rekomendasi diagnosis
7. **Aksi lanjutan** untuk konsultasi medis yang tepat

---

## 🧪 Testing

### Comprehensive Testing Suite
```bash
cd rag-system
python test_comprehensive.py
```

Tests meliputi:
- ✅ Google Drive integration
- ✅ NCBI crawler functionality  
- ✅ RAG retrieval system
- ✅ API endpoint testing
- ✅ UI component validation

### User Interface Testing
```bash
cd rag-system
python test_ui.py
```

Tests meliputi:
- 🔍 5 medical query scenarios
- 📊 Response time measurement
- 📚 Reference inclusion validation
- 🎯 Keyword relevance checking
- 💬 Response quality assessment

**Expected Results:**
- Success rate: 100%
- Average response time: ~9.91s
- Reference inclusion rate: 100%

---

## 📊 System Performance

### RAG System Metrics
- **Document Processing**: 1,383+ chunks from Google Drive
- **NCBI Papers**: 30+ medical papers processed
- **Vector Database**: JSON-based with cosine similarity
- **Response Time**: Average 9.91 seconds
- **Accuracy**: 100% reference inclusion rate

### API Performance
- **Endpoint**: `/api/rag`
- **Timeout**: 30 seconds
- **Encoding**: UTF-8 with Windows compatibility
- **Error Handling**: Comprehensive error catching
- **Logging**: Detailed request/response logging

---

## 🔧 Configuration

### Environment Variables

#### Next.js (.env.local)
```env
GOOGLE_API_KEY=your_gemini_api_key
```

#### RAG System (.env)
```env
GOOGLE_API_KEY=your_gemini_api_key
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
CREDENTIALS_FILE=credentials.json
```

### Python Dependencies (requirements.txt)
```txt
google-generativeai>=0.8.3
google-auth>=2.40.3
google-auth-oauthlib>=1.2.2
google-api-python-client>=2.177.0
PyMuPDF>=1.26.4
python-docx>=1.2.0
PyPDF2>=3.0.1
langchain>=0.3.27
scikit-learn>=1.7.1
numpy>=2.3.1
pandas>=2.3.1
requests>=2.32.4
beautifulsoup4>=4.12.3
python-dotenv>=1.0.1
```

### Node.js Dependencies
```json
{
  "dependencies": {
    "next": "15.5.2",
    "react": "18.3.1",
    "typescript": "5.0.0",
    "tailwindcss": "3.4.0",
    "jspdf": "2.5.2"
  }
}
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Google Drive API Authentication Error
```bash
# Solution: Check credentials and permissions
1. Verify credentials.json exists in rag-system/
2. Check service account email has Drive access
3. Verify folder ID in .env file
```

#### 2. Python Encoding Error (Windows)
```bash
# Solution: Set UTF-8 encoding
$env:PYTHONIOENCODING='utf-8'
python script.py
```

#### 3. RAG API 500 Error
```bash
# Solution: Check Python dependencies and paths
1. pip install -r requirements.txt
2. Verify all .env variables set
3. Check Python script permissions
```

#### 4. NCBI Crawler 0 URLs
```bash
# Solution: Check internet connection and FTP access
1. Test internet connectivity
2. Verify NCBI FTP server access
3. Check firewall/proxy settings
```

### Debug Mode
```bash
# Enable detailed logging
cd rag-system
python -c "import logging; logging.basicConfig(level=logging.DEBUG)"
python test_comprehensive.py
```

---

## 📈 System Architecture

### RAG System Flow
```
User Query → Next.js API → Python RAG Script → 
Google Drive/NCBI Data → Gemini AI → 
Contextual Response → User Interface
```

### Data Processing Pipeline
```
Documents → Text Extraction → Chunking → 
Embeddings → Vector Database → 
Similarity Search → Context Assembly → 
AI Generation → Response with References
```

### Multi-Source Integration
```
Google Drive Documents ← RAG System → NCBI PMC Papers
         ↓                              ↓
    PDF/DOCX/TXT/CSV/JSON        Medical Literature
         ↓                              ↓
    Document Indexer  ←→  NCBI Crawler
         ↓                              ↓
           Unified Vector Database
                    ↓
              RAG Retriever
                    ↓
             User Interface
```

---

## 🔐 Security & Privacy

### Data Security
- **Local Processing**: Semua data diproses secara lokal
- **API Key Security**: Environment variables untuk credential storage
- **No Data Storage**: Query tidak disimpan permanently
- **Secure Transmission**: HTTPS untuk semua API calls

### Privacy Compliance
- **No Personal Data Collection**: Sistem tidak menyimpan data personal
- **Temporary Processing**: Query diproses sementara saja
- **Source Attribution**: Semua response include source references
- **Transparent AI**: Chain of thought reasoning untuk transparansi

---

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch
3. Run comprehensive tests
4. Submit pull request with test results

### Testing Requirements
- Semua tests harus pass (100% success rate)
- UI testing harus include reference validation
- Documentation harus updated

### Code Standards
- **Python**: PEP 8 compliance
- **TypeScript**: ESLint configuration
- **Testing**: Minimum 90% coverage
- **Documentation**: Inline comments untuk complex logic

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Support

### Technical Support
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive guides available
- **Testing**: Use test suites for troubleshooting

### Medical Disclaimer
⚠️ **PENTING**: Aplikasi ini adalah tools bantu dan tidak menggantikan konsultasi medis profesional. Selalu konsultasikan dengan tenaga medis yang qualified untuk diagnosis dan treatment yang akurat.

---

## 🔄 Version History

### v2.1.0 - Enhanced User Experience (Current)
- ✅ Enhanced medical image analysis dengan download & find doctors
- ✅ PDF export untuk hasil analisis gambar
- ✅ Google Maps integration untuk pencarian dokter terdekat
- ✅ Unified action buttons untuk semua fitur diagnosis
- ✅ Improved user workflow dengan success notifications
- ✅ Professional medical report generation untuk image analysis

### v2.0.0 - RAG System Integration
- ✅ RAG system dengan Google Drive dan NCBI integration
- ✅ Comprehensive testing suite
- ✅ Multi-format document support
- ✅ Real-time medical literature access
- ✅ Enhanced UI with reference inclusion

### v1.0.0 - Basic Medical AI
- ✅ Basic medical consultation AI
- ✅ Image analysis capabilities
- ✅ PDF export functionality
- ✅ Interactive anamnesis

---

## 📊 Performance Benchmarks

### Latest Test Results (v2.1.0)
```
🎯 Overall System Status: 100% Success Rate

📂 Google Drive Integration: ✅
   - Authentication: ✅
   - File Discovery: 1,383+ documents
   - Multi-format Processing: ✅

🧬 NCBI Crawler: ✅
   - PDF URL Discovery: 100+ URLs found
   - Success Rate: 87.5%
   - Content Processing: 736,621+ characters

🤖 RAG Integration: ✅
   - Query Success Rate: 100%
   - Average Response Time: 9.91s
   - Reference Inclusion: 100%

🖥️ User Interface: ✅
   - API Endpoint: ✅
   - UI Components: ✅
   - Real-time Processing: ✅

📸 Enhanced Image Analysis: ✅ (NEW!)
   - AI Image Processing: ✅
   - PDF Export Generation: ✅
   - Doctor Search Integration: ✅
   - Action Buttons Functionality: ✅
```

---

**Made with ❤️ by AzlNach | Enhanced Medical AI with RAG Technology & Complete Healthcare Workflow**
