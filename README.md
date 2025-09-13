# Anamnesa AI - RAG-Powered Medical Consultation Assistant

**Description**  
Anamnesa AI adalah aplikasi web berbasis Next.js dengan sistem RAG (Retrieval-Augmented Generation) yang berfungsi sebagai asisten konsultasi kesehatan AI. Aplikasi ini menggunakan teknologi Google Gemini AI dan sistem RAG untuk melakukan analisis gejala, proses anamnesis interaktif, dan mengakses database pengetahuan medis yang luas dari Google Drive dan NCBI PMC.

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
- **📸 Medical Image Analysis**: Analisis gambar medis dengan AI segmentasi menggunakan Chain of Thought prompting untuk diagnosis visual yang komprehensif.
- **🧠 Chain of Thought Medical Analysis**: Pendekatan analisis step-by-step (6 tahap) untuk memberikan reasoning yang jelas dan diagnosis yang lebih akurat.
- **🎯 Intelligent Medical Diagnosis**: Sintesis komprehensif informasi untuk memberikan diagnosis yang paling mungkin dengan tingkat keyakinan.
- **📄 Professional PDF Export**: Ekspor hasil konsultasi dalam format PDF A4 dengan design medis profesional.

### Advanced RAG System Features
- **📚 RAG-Powered Knowledge Base**: Sistem Retrieval-Augmented Generation yang mengakses database pengetahuan medis dari multiple sources.
- **☁️ Google Drive Integration**: Akses dan indeks dokumen medis dari Google Drive dengan support multi-format (PDF, DOCX, TXT, CSV, JSON).
- **🧬 NCBI PMC Literature Crawler**: Crawler otomatis untuk mengakses dan memproses literature medis dari NCBI PMC database.
- **🔍 Semantic Document Search**: Pencarian dokumen berdasarkan similarity score menggunakan embeddings untuk menemukan informasi yang paling relevan.
- **📖 Contextual Medical Responses**: Response yang diperkaya dengan referensi dokumen dan similarity scores untuk transparansi sumber informasi.
- **🎯 Multi-Context Support**: Support untuk context anamnesis, diagnosis, dan general medical consultation.

### Technical Features
- **⚡ Fast Response Time**: Rata-rata response time 9.91 detik dengan 100% reference inclusion rate.
- **🔒 API Cost Optimization**: Sistem caching dan optimization untuk menghemat penggunaan API.
- **📊 Comprehensive Testing**: Testing suite lengkap untuk Google Drive, NCBI crawler, dan RAG integration.
- **🌐 Real-time Web Interface**: Interface web responsif dengan real-time query processing.

---

## 📁 Struktur Proyek

```
anamnesa/
├── app/
│   ├── api/
│   │   ├── analyze/          # Analisis awal gejala
│   │   ├── anamnesis/        # Pertanyaan lanjutan  
│   │   ├── final-diagnosis/  # Diagnosis final
│   │   ├── image-analysis/   # Analisis gambar medis
│   │   └── rag/             # RAG API endpoint (NEW!)
│   ├── components/
│   │   ├── DeveloperFooter.tsx
│   │   ├── FloatingActionButton.tsx
│   │   ├── ImageAnalysis.tsx # Komponen analisis gambar
│   │   ├── RAGAssistant.tsx  # RAG assistant component (NEW!)
│   │   └── NoDataError.tsx
│   ├── consultation/         # Halaman proses anamnesis
│   ├── image-analysis/       # Halaman analisis gambar
│   ├── results/             # Halaman hasil diagnosis
│   ├── lib/                 # Utility functions
│   │   ├── pdfGenerator.ts  # PDF generation
│   │   ├── utils.ts         # General utilities
│   │   └── ragUtils.ts      # RAG utilities (NEW!)
│   ├── globals.css          # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage with RAG integration
├── rag-system/             # RAG System Backend (NEW!)
│   ├── indexer.py          # Google Drive document indexer
│   ├── retriever.py        # RAG retrieval engine
│   ├── api_retriever.py    # API interface for Next.js
│   ├── ncbi_crawler.py     # NCBI PMC literature crawler
│   ├── test_comprehensive.py # Comprehensive testing suite
│   ├── test_ui.py          # UI testing script
│   ├── credentials.json    # Google Drive credentials
│   ├── .env                # Environment variables
│   ├── requirements.txt    # Python dependencies
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
- **RAG Framework**: Custom implementation with LangChain
- **Vector Search**: NumPy + scikit-learn cosine similarity
- **Document Processing**: PyMuPDF, python-docx, PyPDF2
- **Web Scraping**: requests, BeautifulSoup4

### Data Sources
- **Primary**: Google Drive API with OAuth 2.0
- **Secondary**: NCBI PMC FTP literature database
- **Formats**: PDF, DOCX, TXT, CSV, JSON
- **Storage**: JSON-based vector database

### Development & Testing
- **Testing**: Comprehensive Python testing suite
- **Logging**: Python logging with file rotation
- **Environment**: dotenv configuration management
- **API Integration**: RESTful APIs with proper error handling

---

## 📋 Prerequisites

- **Node.js** v18+ dan npm
- **Python** 3.11+
- **Google Cloud Account** dengan Gemini API access
- **Google Drive API** credentials (credentials.json)
- **Internet connection** untuk NCBI PMC access

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

### 3. Backend Setup (RAG System)
```bash
cd rag-system

# Install Python dependencies
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

### 5. Initial Data Indexing
```bash
cd rag-system

# Run indexing untuk pertama kali
python indexer.py

# Test RAG system
python test_comprehensive.py
```

---

## 🚀 Running the Application

### 1. Start Next.js Development Server
```bash
# Dari root directory
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### 2. Test RAG System
```bash
cd rag-system

# Test comprehensive system
python test_comprehensive.py

# Test UI integration
python test_ui.py
```

---

## 📖 Usage Guide

### Basic Medical Consultation
1. **Buka aplikasi** di browser
2. **Masukkan keluhan** pada form utama
3. **Ikuti proses anamnesis** interaktif
4. **Review hasil diagnosis** dengan referensi
5. **Export PDF** hasil konsultasi

### RAG-Enhanced Queries
1. **Gunakan RAG Assistant** di homepage
2. **Masukkan pertanyaan medis** dalam bahasa Indonesia atau Inggris
3. **Pilih context** (anamnesis/diagnosis/general)
4. **Review response** dengan source references
5. **Similarity scores** menunjukkan relevansi sumber

### Medical Image Analysis
1. **Upload gambar medis** (X-ray, CT scan, dll)
2. **Tambahkan deskripsi** (opsional)
3. **Proses analisis AI** dengan Chain of Thought
4. **Review hasil** diagnosis visual
5. **Export hasil** dalam PDF

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

### v2.0.0 - RAG System Integration (Current)
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

### Latest Test Results (v2.0.0)
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
```

---

**Made with ❤️ by AzlNach | Powered by Google Gemini AI & RAG Technology**
