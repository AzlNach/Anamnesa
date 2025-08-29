import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

export async function POST(request: NextRequest) {
  try {
    const { sessionData, potentialDiagnoses, currentAnswer } = await request.json();

    if (!sessionData || !potentialDiagnoses) {
      return NextResponse.json(
        { error: "Data sesi tidak lengkap" },
        { status: 400 }
      );
    }

    // Generate next question based on previous answers and current diagnosis possibilities
    const nextQuestionPrompt = `
    Anda adalah dokter AI yang melakukan anamnesis untuk mempersempit diagnosis.
    
    Keluhan awal: "${sessionData.originalComplaint}"
    Kemungkinan diagnosis: ${JSON.stringify(potentialDiagnoses)}
    
    Jawaban sebelumnya:
    ${sessionData.answersGiven.map((qa: any, index: number) => 
      `${index + 1}. ${qa.question} - Jawaban: ${qa.answer}`
    ).join('\n')}
    
    Jawaban terbaru: "${currentAnswer}"
    
    Pertanyaan ke-${sessionData.questionsAsked + 1} dari 5 total pertanyaan.
    
    PENTING: Buat pertanyaan PILIHAN GANDA dengan TEPAT 4 opsi jawaban yang spesifik dan relevan.
    
    ${getQuestionFocus(sessionData.questionsAsked + 1)}
    
    Berdasarkan jawaban-jawaban tersebut, buat pertanyaan berikutnya yang paling efektif untuk:
    1. Membedakan diagnosis yang masih mungkin
    2. Mengidentifikasi faktor risiko
    3. Mengetahui riwayat medis yang relevan
    4. Memahami gaya hidup yang mempengaruhi kondisi
    
    RULES:
    - HARUS berupa pilihan ganda dengan 4 opsi
    - Opsi harus spesifik dan dapat dipilih (bukan pertanyaan terbuka)
    - Gunakan bahasa Indonesia yang jelas
    - Fokus pada aspek medis yang relevan
    
    Output HARUS dalam format JSON berikut:
    {
      "question": "Pertanyaan pilihan ganda yang spesifik",
      "options": ["Opsi A yang spesifik", "Opsi B yang spesifik", "Opsi C yang spesifik", "Opsi D yang spesifik"],
      "questionType": "multiple_choice",
      "importance": "Penjelasan mengapa pertanyaan ini penting untuk diagnosis"
    }
    
    Contoh format yang benar:
    {
      "question": "Bagaimana pola aktivitas fisik Anda dalam seminggu terakhir?",
      "options": ["Tidak ada aktivitas fisik", "Olahraga ringan 1-2x seminggu", "Olahraga sedang 3-4x seminggu", "Olahraga intensif hampir setiap hari"],
      "questionType": "multiple_choice",
      "importance": "Aktivitas fisik mempengaruhi sirkulasi dan dapat menjadi faktor dalam beberapa kondisi medis"
    }
    
    Berikan hanya JSON tanpa penjelasan tambahan.
    `;

    const questionResult = await model.generateContent(nextQuestionPrompt);
    const questionText = questionResult.response.text();
    
    let nextQuestion;
    try {
      const parsed = JSON.parse(questionText.replace(/```json\n?|\n?```/g, ''));
      
      // Validate the structure
      if (validateQuestionStructure(parsed)) {
        nextQuestion = parsed;
      } else {
        console.warn('Generated question invalid, using fallback');
        nextQuestion = getFallbackQuestion(sessionData.questionsAsked + 1);
      }
    } catch (parseError) {
      console.error('Error parsing question generation:', parseError);
      nextQuestion = getFallbackQuestion(sessionData.questionsAsked + 1);
    }

    return NextResponse.json({
      success: true,
      nextQuestion
    });

  } catch (error) {
    console.error("Error in anamnesis API:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan dalam proses anamnesis. Silakan coba lagi." },
      { status: 500 }
    );
  }
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

function getQuestionFocus(questionNumber: number): string {
  switch (questionNumber) {
    case 2:
      return "Fokus pada karakteristik gejala (intensitas, frekuensi, pola waktu).";
    case 3:
      return "Fokus pada riwayat penyakit keluarga dan faktor genetik.";
    case 4:
      return "Fokus pada gaya hidup (merokok, alkohol, olahraga, pola tidur, stres).";
    case 5:
      return "Fokus pada faktor pemicu, obat-obatan, atau kondisi penyerta.";
    default:
      return "Fokus pada informasi yang paling krusial untuk diagnosis.";
  }
}

function getFallbackQuestion(questionNumber: number) {
  const fallbackQuestions = [
    {
      question: "Bagaimana intensitas gejala yang Anda rasakan pada skala 1-10?",
      options: ["Ringan (1-3)", "Sedang (4-6)", "Berat (7-8)", "Sangat berat (9-10)"],
      questionType: "multiple_choice",
      importance: "Tingkat intensitas membantu menentukan tingkat keparahan kondisi dan urgensi perawatan"
    },
    {
      question: "Apakah ada anggota keluarga yang pernah mengalami kondisi serupa?",
      options: ["Ya, orang tua", "Ya, saudara kandung", "Ya, keluarga lain (kakek/nenek/paman/bibi)", "Tidak ada riwayat keluarga"],
      questionType: "multiple_choice",
      importance: "Riwayat keluarga dapat mengindikasikan faktor genetik atau predisposisi terhadap kondisi tertentu"
    },
    {
      question: "Bagaimana pola aktivitas fisik Anda dalam 2 minggu terakhir?",
      options: ["Tidak ada aktivitas fisik", "Aktivitas ringan (jalan santai)", "Aktivitas sedang (olahraga 2-3x seminggu)", "Aktivitas berat (olahraga intensif rutin)"],
      questionType: "multiple_choice",
      importance: "Aktivitas fisik mempengaruhi sirkulasi darah, metabolisme, dan dapat menjadi faktor dalam berbagai kondisi medis"
    },
    {
      question: "Apakah Anda memiliki kebiasaan merokok atau konsumsi alkohol?",
      options: ["Tidak merokok dan tidak minum alkohol", "Merokok saja", "Minum alkohol saja", "Merokok dan minum alkohol"],
      questionType: "multiple_choice",
      importance: "Kebiasaan merokok dan alkohol dapat memperburuk gejala dan mempengaruhi diagnosis serta pengobatan"
    },
    {
      question: "Bagaimana kualitas tidur Anda dalam seminggu terakhir?",
      options: ["Tidur nyenyak 7-8 jam setiap malam", "Tidur cukup tapi kadang terbangun", "Sering kesulitan tidur atau terbangun", "Insomnia atau tidur sangat tidak teratur"],
      questionType: "multiple_choice",
      importance: "Kualitas tidur mempengaruhi sistem imun, proses penyembuhan, dan dapat menjadi faktor dalam berbagai kondisi kesehatan"
    }
  ];

  return fallbackQuestions[questionNumber - 2] || fallbackQuestions[0];
}
