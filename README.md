# Anamnesa AI - Asisten Konsultasi Kesehatan Berbasis AI

**Description**  
Anamnesa AI adalah aplikasi web statis berbasis Next.js yang berfungsi sebagai asisten diagnosis kesehatan awal berbasis chatbot. Aplikasi ini menggunakan teknologi Google Gemini AI untuk melakukan analisis gejala dan proses anamnesis (wawancara medis) interaktif dengan ekspor hasil dalam format PDF profesional berstandar A4.

---

## 🧑‍💻 Team

| **Name** | **Role**        |
|-----------|----------------|
| Azel (AzlNach) | Full Stack Developer & AI Engineer |

---

## 🚀 Features
- **🤖 AI-Powered Symptom Analysis**: Analisis gejala menggunakan Google Gemini AI untuk ekstraksi dan interpretasi keluhan medis secara akurat.
- **💬 Interactive Anamnesis**: Proses tanya jawab interaktif berbasis AI dengan minimal 5-10 pertanyaan dinamis berdasarkan kompleksitas kasus.
- **🎯 Intelligent Medical Diagnosis**: Sintesis komprehensif informasi untuk memberikan diagnosis yang paling mungkin dengan tingkat keyakinan.
- **📄 Professional PDF Export**: Ekspor hasil konsultasi dalam format PDF A4 dengan desain medis profesional, margin standar, dan struktur yang rapi.
- **♿ Responsive & Accessible**: Interface yang ramah pengguna dengan desain mobile-first dan aksesibilitas yang optimal.
- **🔐 Privacy-First Approach**: Tidak menyimpan data pribadi, proses analisis dilakukan secara real-time tanpa tracking pengguna.
- **🏥 Medical-Grade Formatting**: Hasil diagnosis dengan format standar medis termasuk disclaimer, rekomendasi tindakan, dan panduan follow-up.

## 🛠 Tech Stack

**Frontend:**
- Next.js 15.5.2 (App Router)
- TypeScript
- Tailwind CSS 4.0
- Lucide React Icons

**Backend:**
- Next.js API Routes
- Google Gemini 2.5 Flash Lite API
- jsPDF (PDF Generation)
- Node.js Runtime

**AI & Analytics:**
- Google Gemini AI
- Natural Language Processing
- Medical Symptom Analysis

---

## 🚀 How to Run the Project

### Step 1. Clone the Repository
```bash
git clone https://github.com/AzlNach/anamnesa.git
cd anamnesa
```

### Step 2. Install Dependencies
```bash
npm install
```

### Step 3. Setup Environment Variables
```bash
cp .env.local.example .env.local
```

Edit `.env.local` dan tambahkan Google Gemini API Key:
```env
GOOGLE_API_KEY=your_google_gemini_api_key_here
```

### Step 4. Get Google Gemini API Key
- Kunjungi [Google AI Studio](https://makersuite.google.com/app/apikey)
- Buat API key baru
- Copy dan paste ke file `.env.local`

### Step 5. Run Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### Step 6. Build for Production
```bash
npm run build
npm start
```

## 📋 Requirements
- Node.js versi 18 atau lebih tinggi
- NPM atau Yarn package manager
- Google Gemini API Key (gratis)
- Modern web browser dengan JavaScript enabled

---

## ⚠️ Disclaimer Penting
**Aplikasi ini BUKAN pengganti konsultasi medis profesional. Hasil analisis hanya sebagai panduan awal sebelum berkonsultasi dengan dokter.**

## 📋 Alur Kerja Aplikasi

### 1. Input Keluhan Utama
- Pengguna menginput keluhan atau gejala dalam text area
- Validasi input dan disclaimer medis
- UI yang clean dan menenangkan

### 2. Analisis Awal & Ekstraksi Gejala
- Gemini AI mengekstrak gejala kunci dari input
- Format gejala sesuai untuk API medis
- Simulasi panggilan EndlessMedical API untuk diagnosis potensial

### 3. Proses Anamnesis (5-10 Pertanyaan)
- Gemini AI menghasilkan pertanyaan berdasarkan diagnosis potensial
- Pertanyaan fokus pada: karakteristik gejala, riwayat keluarga, gaya hidup
- Interface chatbot untuk interaksi yang natural

### 4. Diagnosis Final
- Analisis komprehensif semua data yang terkumpul
- Gemini AI menentukan diagnosis paling mungkin
- Tingkat keyakinan dan alasan logis

### 5. Hasil & Rekomendasi
- Tampilan hasil dalam format kartu yang mudah dibaca
- Rekomendasi tindakan segera dan jenis dokter
- Saran perawatan umum dan gaya hidup
- Opsi download hasil PDF profesional format A4

---

## � Troubleshooting

Jika mengalami masalah, lihat [Troubleshooting Guide](./TROUBLESHOOTING.md) untuk solusi masalah umum seperti:
- Pertanyaan tidak memiliki opsi pilihan ganda
- API key errors
- Rate limiting issues
- Loading problems

## �📁 Struktur Proyek

```
anamnesa/
├── app/
│   ├── api/
│   │   ├── analyze/          # Analisis awal gejala
│   │   ├── anamnesis/        # Pertanyaan lanjutan
│   │   └── final-diagnosis/  # Diagnosis final
│   ├── consultation/         # Halaman proses anamnesis
│   ├── results/             # Halaman hasil diagnosis
│   ├── lib/                 # Utility functions
│   ├── globals.css          # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── public/                  # Static assets
├── .env.local.example      # Environment variables template
└── README.md
```

## 🔀 API Endpoints

### POST `/api/analyze`
Analisis awal keluhan dan ekstraksi gejala
```typescript
Request: { complaint: string }
Response: {
  extractedSymptoms: object,
  potentialDiagnoses: array,
  firstQuestion: object
}
```

### POST `/api/anamnesis`
Generasi pertanyaan lanjutan berdasarkan jawaban sebelumnya
```typescript
Request: {
  sessionData: object,
  potentialDiagnoses: array,
  currentAnswer: string
}
Response: { nextQuestion: object }
```

### POST `/api/final-diagnosis`
Pembentukan diagnosis final dan rekomendasi
```typescript
Request: {
  sessionData: object,
  potentialDiagnoses: array
}
Response: { finalDiagnosis: object }
```

## 🎨 Kustomisasi Tampilan

### Tema Warna
Aplikasi menggunakan tema kesehatan dengan warna dasar:
- Primary: Blue (600-700)
- Secondary: Green (500-600) 
- Warning: Yellow (400-500)
- Error: Red (500-600)

### Responsif Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Grid system untuk layout yang fleksibel

## 🚀 Deployment

### Vercel (Recommended)
1. Push ke GitHub repository
2. Connect repository di [Vercel](https://vercel.com)
3. Add environment variables di Vercel dashboard
4. Deploy otomatis

### Netlify
1. Build aplikasi: `npm run build`
2. Upload folder `out/` ke Netlify
3. Set environment variables di Netlify dashboard

## 🔮 Roadmap & Pengembangan Selanjutnya

### Phase 2 - Integrasi API Medis
- [ ] Integrasi real EndlessMedical API
- [ ] Database diagnosis yang lebih comprehensive
- [ ] Caching untuk performa yang lebih baik

### Phase 3 - Fitur Lanjutan
- [ ] Riwayat konsultasi pengguna
- [ ] Export PDF yang lebih rich
- [ ] Notifikasi follow-up
- [ ] Multi-language support

### Phase 4 - AI Enhancement
- [ ] Fine-tuning model untuk domain medis Indonesia
- [ ] Integrasi dengan medical knowledge base
- [ ] Prediksi tingkat risiko

## 🤝 Kontribusi

1. Fork repository ini
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 Lisensi

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Kontak & Support

- **Email**: your-email@example.com
- **Issues**: GitHub Issues section
- **Documentation**: Wiki section

## ⚖️ Legal & Etika

### Medical Disclaimer
- Aplikasi ini tidak memberikan nasihat medis profesional
- Tidak dimaksudkan untuk diagnosis, pengobatan, atau pencegahan penyakit
- Konsultasikan selalu dengan tenaga medis profesional
- Dalam keadaan darurat, segera hubungi layanan medis terdekat

### Privacy & Data
- Tidak menyimpan data pribadi pengguna
- Proses analisis dilakukan secara lokal dan melalui API eksternal
- Tidak ada tracking atau profiling pengguna

### AI Ethics
- AI digunakan sebagai alat bantu, bukan pengganti judgment medis
- Transparency dalam proses decision-making AI
- Bias mitigation dalam proses training dan inference

---

**Anamnesa AI** - Membantu persiapan konsultasi medis dengan teknologi AI yang bertanggung jawab.

> "Technology should augment human healthcare professionals, not replace them."

## 🤝 Kontribusi

Kami menyambut kontribusi dari developer lain untuk meningkatkan kualitas aplikasi ini:

1. Fork repository ini
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📞 Kontak & Support

- **Developer**: Azel (AzlNach)
- **GitHub**: [https://github.com/AzlNach](https://github.com/AzlNach)
- **LinkedIn**: [https://www.linkedin.com/in/azlnach-si26](https://www.linkedin.com/in/azlnach-si26)
- **Issues**: GitHub Issues section
- **Project Repository**: [https://github.com/AzlNach/anamnesa](https://github.com/AzlNach/anamnesa)

## 📄 Lisensi

Distributed under the MIT License. Lihat `LICENSE` untuk informasi lebih lanjut.

## 🏆 Acknowledgments

- **Google Gemini AI** untuk teknologi AI yang powerful
- **Next.js Team** untuk framework yang luar biasa
- **Tailwind CSS** untuk styling yang efisien
- **Lucide React** untuk icon set yang lengkap
- **jsPDF** untuk kemampuan ekspor PDF profesional

---

### 📱 Demo

Aplikasi ini telah dilengkapi dengan:
- ✅ Floating Action Button (FAB) untuk akses cepat ke profil developer
- ✅ Footer informatif dengan kredit developer
- ✅ Export PDF format A4 profesional
- ✅ Responsive design untuk semua perangkat
- ✅ Antarmuka intuitif dengan tema medis

*Terima kasih telah menggunakan Anamnesa AI! 🏥💙*
