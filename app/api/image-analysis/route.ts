import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API with Vision model
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const patientData = formData.get('patientData') as string;
    const imageDescription = formData.get('imageDescription') as string;

    if (!image) {
      return NextResponse.json(
        { error: "Gambar tidak ditemukan" },
        { status: 400 }
      );
    }

    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: "Format gambar tidak didukung. Gunakan JPEG, PNG, atau WebP" },
        { status: 400 }
      );
    }

    // Validate image size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (image.size > maxSize) {
      return NextResponse.json(
        { error: "Ukuran gambar terlalu besar. Maksimal 10MB" },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');

    // Parse patient data if provided
    let parsedPatientData = {};
    if (patientData) {
      try {
        parsedPatientData = JSON.parse(patientData);
      } catch (error) {
        console.warn('Error parsing patient data:', error);
      }
    }

    // Create comprehensive Chain of Thought prompt for medical image analysis
    const imageAnalysisPrompt = `
Anda adalah dokter spesialis yang ahli dalam analisis gambar medis dan diagnostik. Lakukan analisis mendalam terhadap gambar yang diberikan menggunakan pendekatan step-by-step (Chain of Thought).

${Object.keys(parsedPatientData).length > 0 ? `
Data Pasien:
${JSON.stringify(parsedPatientData, null, 2)}
` : ''}

${imageDescription ? `
Deskripsi dari Pasien:
"${imageDescription}"

PERHATIAN: Gunakan deskripsi ini sebagai konteks tambahan untuk memperkuat analisis visual. Jika ada ketidaksesuaian antara deskripsi dan gambar, prioritaskan temuan visual namun jelaskan perbedaannya.
` : ''}

INSTRUKSI ANALISIS STEP-BY-STEP:

1. **OBSERVASI AWAL**
   - Identifikasi jenis gambar medis (kulit, mata, mulut, ekstremitas, dll)
   - Catat kualitas gambar dan area yang terlihat
   - Identifikasi struktur anatomi yang tampak
   ${imageDescription ? '- Bandingkan dengan deskripsi yang diberikan pasien' : ''}

2. **SEGMENTASI VISUAL**
   - Identifikasi area yang normal vs abnormal
   - Tentukan batas-batas lesi atau kelainan (jika ada)
   - Analisis bentuk, ukuran, warna, dan tekstur
   ${imageDescription ? '- Validasi terhadap keluhan yang disampaikan pasien' : ''}

3. **ANALISIS MORFOLOGI**
   - Karakteristik lesi: simetri, tepi, warna, diameter, evolusi
   - Pola distribusi kelainan
   - Hubungan dengan struktur anatomi sekitar
   ${imageDescription ? '- Korelasi dengan gejala yang dirasakan pasien' : ''}

4. **DIAGNOSIS DIFERENSIAL**
   - Berdasarkan temuan visual${imageDescription ? ' dan deskripsi pasien' : ''}, susun 3-5 kemungkinan diagnosis
   - Urutkan berdasarkan probabilitas
   - Jelaskan reasoning untuk setiap diagnosis

5. **REKOMENDASI TINDAKAN**
   - Pemeriksaan lanjutan yang diperlukan
   - Pengobatan yang dapat dilakukan mandiri
   - Kapan harus segera ke dokter
   - Tindakan pencegahan

6. **EDUKASI PASIEN**
   - Penjelasan kondisi dalam bahasa awam
   - Faktor risiko yang perlu dihindari
   - Prognosis dan harapan penyembuhan

RULES PENTING:
- Berikan analisis yang komprehensif namun mudah dipahami
- Gunakan bahasa Indonesia yang jelas
- Selalu tekankan pentingnya konsultasi dengan dokter untuk diagnosis final
- Jangan memberikan diagnosis pasti, hanya kemungkinan berdasarkan analisis visual
- ${imageDescription ? 'Integrasikan deskripsi pasien dengan temuan visual untuk analisis yang lebih akurat' : 'Fokus pada analisis visual yang objektif'}
- Prioritaskan keamanan pasien dalam setiap rekomendasi

OUTPUT FORMAT:
Berikan response dalam format JSON berikut:

{
  "imageQuality": "penilaian kualitas gambar",
  "anatomicalRegion": "area anatomi yang difoto",
  "visualObservations": {
    "normalFindings": ["temuan normal 1", "temuan normal 2"],
    "abnormalFindings": ["kelainan 1", "kelainan 2"],
    "lesionCharacteristics": {
      "size": "ukuran perkiraan",
      "shape": "bentuk",
      "color": "warna",
      "texture": "tekstur",
      "borders": "karakteristik tepi"
    }
  },
  "segmentationAnalysis": {
    "affectedAreas": ["area terdampak 1", "area terdampak 2"],
    "severity": "ringan/sedang/berat",
    "distribution": "pola distribusi"
  },
  "differentialDiagnosis": [
    {
      "condition": "nama kondisi",
      "probability": "tinggi/sedang/rendah",
      "reasoning": "alasan mengapa kondisi ini mungkin",
      "supportingFeatures": ["ciri pendukung 1", "ciri pendukung 2"]
    }
  ],
  "recommendations": {
    "immediate": {
      "selfCare": ["perawatan mandiri 1", "perawatan mandiri 2"],
      "medications": ["obat bebas yang aman", "dosis dan cara pakai"],
      "avoidance": ["hal yang harus dihindari"]
    },
    "followUp": {
      "timeframe": "kapan harus kontrol",
      "specialist": "spesialis yang disarankan",
      "urgentSigns": ["tanda bahaya yang harus segera ke dokter"]
    },
    "prevention": ["langkah pencegahan 1", "langkah pencegahan 2"]
  },
  "patientEducation": {
    "explanation": "penjelasan kondisi dalam bahasa awam",
    "prognosis": "perkiraan perjalanan penyakit",
    "lifestyle": ["modifikasi gaya hidup yang disarankan"]
  },
  "disclaimer": "Analisis ini berdasarkan gambar dan tidak menggantikan konsultasi langsung dengan dokter. Segera konsultasi untuk diagnosis dan pengobatan yang tepat."
}

Analisis gambar dengan teliti dan berikan insight medis yang bermanfaat namun tetap aman untuk pasien.
`;

    // Send to Gemini Vision API
    const result = await model.generateContent([
      imageAnalysisPrompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: image.type,
        },
      },
    ]);

    const response = result.response;
    const analysisText = response.text();

    // Parse JSON response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const cleanedText = analysisText.replace(/```json\n?|\n?```/g, '');
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      
      // Fallback response if parsing fails
      analysis = {
        imageQuality: "Dapat dianalisis",
        anatomicalRegion: "Area tidak dapat ditentukan dengan pasti",
        visualObservations: {
          normalFindings: [],
          abnormalFindings: ["Analisis detail tidak dapat dilakukan"],
          lesionCharacteristics: {
            size: "Tidak dapat ditentukan",
            shape: "Tidak dapat ditentukan", 
            color: "Tidak dapat ditentukan",
            texture: "Tidak dapat ditentukan",
            borders: "Tidak dapat ditentukan"
          }
        },
        segmentationAnalysis: {
          affectedAreas: ["Tidak dapat ditentukan"],
          severity: "Tidak dapat ditentukan",
          distribution: "Tidak dapat ditentukan"
        },
        differentialDiagnosis: [
          {
            condition: "Konsultasi diperlukan",
            probability: "tinggi",
            reasoning: "Gambar memerlukan evaluasi langsung oleh dokter",
            supportingFeatures: ["Gambar memerlukan interpretasi profesional"]
          }
        ],
        recommendations: {
          immediate: {
            selfCare: ["Jaga kebersihan area"],
            medications: ["Konsultasi dokter untuk pengobatan"],
            avoidance: ["Hindari manipulasi area yang bermasalah"]
          },
          followUp: {
            timeframe: "Segera",
            specialist: "Dokter umum atau spesialis terkait",
            urgentSigns: ["Perburukan gejala", "Nyeri bertambah", "Demam"]
          },
          prevention: ["Konsultasi untuk panduan pencegahan"]
        },
        patientEducation: {
          explanation: "Gambar memerlukan evaluasi profesional untuk diagnosis yang akurat",
          prognosis: "Tergantung diagnosis dari dokter",
          lifestyle: ["Konsultasi dokter untuk panduan lengkap"]
        },
        disclaimer: "Analisis ini berdasarkan gambar dan tidak menggantikan konsultasi langsung dengan dokter. Segera konsultasi untuk diagnosis dan pengobatan yang tepat."
      };
    }

    return NextResponse.json({
      success: true,
      analysis,
      imageProcessed: true
    });

  } catch (error) {
    console.error("Error in image analysis API:", error);
    
    return NextResponse.json(
      { 
        error: "Terjadi kesalahan dalam analisis gambar. Silakan coba lagi.",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Limit request size to handle large images
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
