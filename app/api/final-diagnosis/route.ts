import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export async function POST(request: NextRequest) {
  try {
    const { sessionData, potentialDiagnoses } = await request.json();

    if (!sessionData || !potentialDiagnoses) {
      return NextResponse.json(
        { error: "Data tidak lengkap untuk diagnosis final" },
        { status: 400 }
      );
    }

    // Generate final diagnosis using Gemini
    const finalDiagnosisPrompt = `
    Anda adalah seorang dokter AI yang harus memberikan diagnosis final berdasarkan anamnesis lengkap.
    
    KELUHAN AWAL PASIEN:
    "${sessionData.originalComplaint}"
    
    KEMUNGKINAN DIAGNOSIS AWAL:
    ${JSON.stringify(potentialDiagnoses, null, 2)}
    
    HASIL ANAMNESIS LENGKAP:
    ${sessionData.answersGiven.map((qa: any, index: number) => 
      `${index + 1}. Pertanyaan: ${qa.question}\n   Jawaban: ${qa.answer}`
    ).join('\n\n')}
    
    Berdasarkan semua informasi di atas, tentukan:
    1. Diagnosis yang PALING MUNGKIN (pilih 1 dari kemungkinan diagnosis atau yang paling didukung evidence)
    2. Tingkat keyakinan diagnosis (0-100%)
    3. Alasan logis mengapa diagnosis ini dipilih
    4. Rekomendasi tindakan medis yang tepat
    5. Perawatan umum dan gaya hidup
    
    INSTRUKSI KHUSUS:
    - Analisis setiap jawaban anamnesis dan bagaimana mendukung/menolak setiap kemungkinan diagnosis
    - Berikan confidence score yang realistis (jangan terlalu tinggi tanpa evidence kuat)
    - Pastikan rekomendasi sesuai dengan tingkat keparahan kondisi
    - Berikan peringatan yang appropriate untuk kondisi
    
    Output dalam format JSON berikut:
    {
      "name": "Nama diagnosis yang paling mungkin",
      "confidence": 85,
      "description": "Deskripsi singkat kondisi dalam bahasa awam",
      "reasoning": "Penjelasan logis mengapa diagnosis ini dipilih berdasarkan gejala dan jawaban anamnesis",
      "recommendations": {
        "immediateAction": "Tindakan yang harus segera dilakukan",
        "doctorType": "Jenis dokter spesialis yang harus dikonsultasikan",
        "urgencyLevel": "Rendah/Sedang/Tinggi",
        "additionalTests": ["Tes 1", "Tes 2"]
      },
      "generalCare": {
        "medications": ["Saran obat umum (HARUS dikonsultasikan dengan dokter)"],
        "lifestyle": ["Saran gaya hidup 1", "Saran gaya hidup 2"],
        "warnings": ["Peringatan 1", "Peringatan 2"]
      }
    }
    
    Berikan hanya JSON tanpa penjelasan tambahan.
    `;

    const diagnosisResult = await model.generateContent(finalDiagnosisPrompt);
    const diagnosisText = diagnosisResult.response.text();
    
    let finalDiagnosis;
    try {
      finalDiagnosis = JSON.parse(diagnosisText.replace(/```json\n?|\n?```/g, ''));
    } catch (parseError) {
      console.error('Error parsing final diagnosis:', parseError);
      // Fallback diagnosis
      finalDiagnosis = generateFallbackDiagnosis(sessionData, potentialDiagnoses);
    }

    // Enhance with mock EndlessMedical recommendations
    const enhancedDiagnosis = await enhanceWithEndlessMedicalData(finalDiagnosis);

    return NextResponse.json({
      success: true,
      finalDiagnosis: enhancedDiagnosis
    });

  } catch (error) {
    console.error("Error in final diagnosis API:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan dalam pembentukan diagnosis final. Silakan coba lagi." },
      { status: 500 }
    );
  }
}

function generateFallbackDiagnosis(sessionData: any, potentialDiagnoses: any[]) {
  const topDiagnosis = potentialDiagnoses[0] || {
    name: "Kondisi Medis Umum",
    description: "Kondisi yang memerlukan evaluasi medis lebih lanjut"
  };

  return {
    name: topDiagnosis.name,
    confidence: 70,
    description: topDiagnosis.description || "Kondisi medis yang memerlukan evaluasi lebih lanjut oleh tenaga medis profesional.",
    reasoning: `Berdasarkan keluhan "${sessionData.originalComplaint}" dan hasil anamnesis, kondisi ini merupakan kemungkinan yang paling sesuai dengan gejala yang dilaporkan.`,
    recommendations: {
      immediateAction: "Konsultasikan dengan dokter untuk evaluasi lebih lanjut",
      doctorType: "Dokter Umum",
      urgencyLevel: "Sedang",
      additionalTests: ["Pemeriksaan fisik lengkap", "Riwayat medis detail"]
    },
    generalCare: {
      medications: ["Konsultasikan dengan dokter sebelum mengonsumsi obat apapun"],
      lifestyle: ["Istirahat yang cukup", "Pola makan sehat", "Hindari stress berlebihan"],
      warnings: ["Segera ke dokter jika gejala memburuk", "Jangan mengabaikan gejala yang persisten"]
    }
  };
}

async function enhanceWithEndlessMedicalData(diagnosis: any) {
  // In production, this would make actual calls to EndlessMedical API
  // For now, we'll enhance with mock data based on diagnosis type
  
  const mockEnhancements: Record<string, any> = {
    "Migrain": {
      medications: [
        "Paracetamol atau ibuprofen (sesuai petunjuk dokter)",
        "Hindari penggunaan berlebihan obat penghilang nyeri"
      ],
      lifestyle: [
        "Identifikasi dan hindari pemicu migrain",
        "Tidur teratur 7-8 jam per hari",
        "Kelola stress dengan baik",
        "Minum air yang cukup"
      ],
      additionalTests: ["CT scan kepala (jika diperlukan)", "MRI (untuk kasus yang kompleks)"]
    },
    "Tension Headache": {
      medications: [
        "Paracetamol atau aspirin (sesuai dosis yang dianjurkan)",
        "Konsultasikan dengan dokter untuk penggunaan jangka panjang"
      ],
      lifestyle: [
        "Teknik relaksasi dan manajemen stress",
        "Pijat leher dan bahu secara teratur",
        "Postur tubuh yang baik saat bekerja",
        "Olahraga ringan secara teratur"
      ],
      additionalTests: ["Pemeriksaan neurologis dasar"]
    },
    "Vertigo": {
      medications: [
        "Obat anti-vertigo (betahistine) sesuai resep dokter",
        "Antiemetik untuk mual (jika diperlukan)"
      ],
      lifestyle: [
        "Hindari gerakan kepala yang tiba-tiba",
        "Latihan rehabilitasi vestibular",
        "Posisi tidur dengan kepala sedikit tinggi",
        "Hindari berkendara saat gejala muncul"
      ],
      additionalTests: ["Tes fungsi vestibular", "Audiometri"]
    }
  };

  const enhancement = mockEnhancements[diagnosis.name] || {};
  
  return {
    ...diagnosis,
    recommendations: {
      ...diagnosis.recommendations,
      additionalTests: [...(diagnosis.recommendations.additionalTests || []), ...(enhancement.additionalTests || [])]
    },
    generalCare: {
      medications: enhancement.medications || diagnosis.generalCare.medications,
      lifestyle: [...(diagnosis.generalCare.lifestyle || []), ...(enhancement.lifestyle || [])],
      warnings: [
        ...(diagnosis.generalCare.warnings || []),
        "Hasil ini bukan diagnosis medis final",
        "Konsultasikan dengan dokter untuk konfirmasi diagnosis"
      ]
    }
  };
}
