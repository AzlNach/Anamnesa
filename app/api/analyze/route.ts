import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export async function POST(request: NextRequest) {
  try {
    const { complaint } = await request.json();

    if (!complaint || typeof complaint !== 'string') {
      return NextResponse.json(
        { error: "Keluhan harus berupa teks yang valid" },
        { status: 400 }
      );
    }

    // Step 1: Extract symptoms using Gemini
    const symptomExtractionPrompt = `
    Anda adalah asisten medis AI yang bertugas mengekstrak gejala-gejala kunci dari keluhan pasien.
    
    Dari keluhan berikut: "${complaint}"
    
    Ekstrak gejala-gejala utama dan ubah menjadi format yang terstruktur. Fokus pada:
    1. Gejala fisik yang spesifik
    2. Durasi dan frekuensi
    3. Lokasi atau area tubuh yang terkena
    4. Faktor pemicu atau yang memperburuk
    5. Gejala penyerta
    
    Berikan output dalam format JSON dengan struktur:
    {
      "mainSymptoms": ["gejala1", "gejala2", ...],
      "duration": "durasi",
      "location": "lokasi",
      "triggers": ["pemicu1", "pemicu2", ...],
      "associatedSymptoms": ["gejala_penyerta1", "gejala_penyerta2", ...]
    }
    
    Contoh:
    Input: "Sakit kepala parah di belakang kepala selama 3 hari, disertai mual dan muntah"
    Output: {
      "mainSymptoms": ["sakit kepala parah"],
      "duration": "3 hari",
      "location": "belakang kepala",
      "triggers": [],
      "associatedSymptoms": ["mual", "muntah"]
    }
    
    Berikan hanya JSON tanpa penjelasan tambahan.
    `;

    const symptomResult = await model.generateContent(symptomExtractionPrompt);
    const symptomText = symptomResult.response.text();
    
    // Parse the JSON response from Gemini
    let extractedSymptoms;
    try {
      extractedSymptoms = JSON.parse(symptomText.replace(/```json\n?|\n?```/g, ''));
    } catch (parseError) {
      console.error('Error parsing symptom extraction:', parseError);
      // Fallback extraction
      extractedSymptoms = {
        mainSymptoms: [complaint.slice(0, 100) + "..."],
        duration: "tidak spesifik",
        location: "tidak spesifik",
        triggers: [],
        associatedSymptoms: []
      };
    }

    // Step 2: Simulate EndlessMedical API call (for demo purposes)
    // In production, you would call the actual EndlessMedical API here
    const potentialDiagnoses = await simulateEndlessMedicalAPI(extractedSymptoms);

    // Step 3: Generate initial questions using Gemini
    const questionGenerationPrompt = `
    Anda adalah dokter AI yang akan melakukan anamnesis (wawancara medis) untuk mempersempit diagnosis.
    
    Keluhan awal: "${complaint}"
    Gejala yang diekstrak: ${JSON.stringify(extractedSymptoms)}
    Kemungkinan diagnosis: ${JSON.stringify(potentialDiagnoses)}
    
    PENTING: Buat 1 pertanyaan pertama yang PALING KRUSIAL dengan format PILIHAN GANDA.
    
    Buat pertanyaan pilihan ganda dengan TEPAT 4 opsi untuk membedakan diagnosis-diagnosis tersebut.
    
    Fokus pada:
    - Karakteristik gejala (intensitas, kualitas, pola, lokasi spesifik)
    - Faktor pemicu atau yang memperburuk
    - Waktu onset dan pola temporal
    - Gejala penyerta yang spesifik
    
    RULES:
    - HARUS berupa pilihan ganda dengan 4 opsi
    - Opsi harus spesifik dan dapat dipilih (bukan pertanyaan terbuka)
    - Gunakan bahasa Indonesia yang jelas
    - Fokus pada diferensiasi diagnosis
    
    Berikan dalam format JSON:
    {
      "question": "Pertanyaan yang akan ditanyakan (harus spesifik)",
      "options": ["Opsi A yang spesifik", "Opsi B yang spesifik", "Opsi C yang spesifik", "Opsi D yang spesifik"],
      "questionType": "multiple_choice",
      "importance": "Mengapa pertanyaan ini penting untuk diagnosis"
    }
    
    Contoh format yang benar:
    {
      "question": "Bagaimana karakteristik sakit kepala yang Anda rasakan?",
      "options": ["Nyeri berdenyut seperti dipukul-pukul", "Nyeri seperti diikat atau ditekan", "Nyeri tajam seperti ditusuk", "Nyeri tumpul dan menyebar"],
      "questionType": "multiple_choice",
      "importance": "Karakteristik nyeri membantu membedakan antara migrain, tension headache, dan jenis sakit kepala lainnya"
    }
    
    Berikan hanya JSON tanpa penjelasan tambahan.
    `;

    const questionResult = await model.generateContent(questionGenerationPrompt);
    const questionText = questionResult.response.text();
    
    let firstQuestion;
    try {
      const parsed = JSON.parse(questionText.replace(/```json\n?|\n?```/g, ''));
      
      // Validate the structure
      if (validateQuestionStructure(parsed)) {
        firstQuestion = parsed;
      } else {
        console.warn('Generated first question invalid, using fallback');
        firstQuestion = getDefaultFirstQuestion();
      }
    } catch (parseError) {
      console.error('Error parsing question generation:', parseError);
      firstQuestion = getDefaultFirstQuestion();
    }

    // Determine number of questions based on complaint complexity
    const questionCount = determineQuestionCount(complaint, extractedSymptoms);

    return NextResponse.json({
      success: true,
      extractedSymptoms,
      potentialDiagnoses,
      firstQuestion,
      sessionData: {
        originalComplaint: complaint,
        questionsAsked: 0,
        answersGiven: [],
        totalQuestions: questionCount
      }
    });

  } catch (error) {
    console.error("Error in analyze API:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan dalam analisis. Silakan coba lagi." },
      { status: 500 }
    );
  }
}

// Simulate EndlessMedical API (replace with actual API call in production)
async function simulateEndlessMedicalAPI(symptoms: any) {
  // This is a mock function. In production, you would:
  // 1. Format the symptoms according to EndlessMedical API requirements
  // 2. Make actual API calls to EndlessMedical
  // 3. Return the actual diagnosis list
  
  const mockDiagnoses = [
    {
      name: "Migrain",
      probability: 0.75,
      description: "Sakit kepala primer yang ditandai dengan nyeri berdenyut",
      icd10: "G43"
    },
    {
      name: "Tension Headache",
      probability: 0.65,
      description: "Sakit kepala karena ketegangan otot",
      icd10: "G44.2"
    },
    {
      name: "Vertigo",
      probability: 0.45,
      description: "Sensasi berputar atau kehilangan keseimbangan",
      icd10: "H81"
    }
  ];

  // Sort by probability
  return mockDiagnoses.sort((a, b) => b.probability - a.probability);
}

function validateQuestionStructure(question: any): boolean {
  return (
    question &&
    typeof question.question === 'string' &&
    question.question.trim().length > 0 &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every((opt: any) => typeof opt === 'string' && opt.trim().length > 0) &&
    question.questionType === 'multiple_choice' &&
    typeof question.importance === 'string' &&
    question.importance.trim().length > 0
  );
}

function getDefaultFirstQuestion() {
  return {
    question: "Bagaimana karakteristik gejala yang Anda rasakan?",
    options: [
      "Gejala ringan dan hilang timbul", 
      "Gejala sedang dan terus menerus", 
      "Gejala berat dan mengganggu aktivitas", 
      "Gejala sangat berat dan tidak tertahankan"
    ],
    questionType: "multiple_choice",
    importance: "Karakteristik dan intensitas gejala membantu menentukan tingkat keparahan kondisi dan urgensi perawatan yang diperlukan"
  };
}

function determineQuestionCount(complaint: string, extractedSymptoms: any): number {
  let baseQuestions = 5; // Minimum questions
  
  // Analyze complaint complexity
  const words = complaint.toLowerCase().split(/\s+/);
  const complexityFactors = {
    symptomCount: extractedSymptoms.mainSymptoms?.length || 0,
    associatedSymptoms: extractedSymptoms.associatedSymptoms?.length || 0,
    hasTimeline: words.some(word => 
      ['hari', 'minggu', 'bulan', 'jam', 'sejak', 'selama'].includes(word)
    ),
    hasLocation: extractedSymptoms.location !== 'tidak spesifik',
    hasTriggers: extractedSymptoms.triggers?.length > 0,
    wordCount: words.length
  };
  
  // Add questions based on complexity
  if (complexityFactors.symptomCount > 2) baseQuestions += 1;
  if (complexityFactors.associatedSymptoms > 1) baseQuestions += 1;
  if (complexityFactors.hasTimeline && complexityFactors.hasLocation) baseQuestions += 1;
  if (complexityFactors.hasTriggers) baseQuestions += 1;
  if (complexityFactors.wordCount > 50) baseQuestions += 1;
  
  // Cap at maximum 10 questions to avoid fatigue
  return Math.min(baseQuestions, 10);
}
