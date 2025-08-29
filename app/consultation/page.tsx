'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import NoDataError from "../components/NoDataError";

interface Question {
  question: string;
  options: string[];
  questionType: string;
  importance: string;
}

interface SessionData {
  originalComplaint: string;
  questionsAsked: number;
  answersGiven: { question: string; answer: string; questionIndex: number }[];
  totalQuestions?: number;
}

export default function ConsultationPage() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [potentialDiagnoses, setPotentialDiagnoses] = useState<any[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load initial analysis data from localStorage
    const initialAnalysis = localStorage.getItem('initialAnalysis');
    if (initialAnalysis) {
      const data = JSON.parse(initialAnalysis);
      setCurrentQuestion(data.firstQuestion);
      setSessionData(data.sessionData);
      setPotentialDiagnoses(data.potentialDiagnoses);
      setIsInitialized(true);
    } else {
      // If no initial analysis, show error
      setIsInitialized(true);
    }
  }, []);

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || !currentQuestion || !sessionData) return;

    setIsLoading(true);

    try {
      const updatedAnswers = [
        ...sessionData.answersGiven,
        {
          question: currentQuestion.question,
          answer: selectedAnswer,
          questionIndex: sessionData.questionsAsked
        }
      ];

      const updatedSessionData = {
        ...sessionData,
        questionsAsked: sessionData.questionsAsked + 1,
        answersGiven: updatedAnswers
      };

      // Check if we should continue with more questions or proceed to final diagnosis
      if (updatedSessionData.questionsAsked >= (sessionData.totalQuestions || 5)) {
        // Proceed to final diagnosis
        localStorage.setItem('finalSessionData', JSON.stringify(updatedSessionData));
        localStorage.setItem('potentialDiagnoses', JSON.stringify(potentialDiagnoses));
        router.push('/results');
        return;
      }

      // Get next question from anamnesis API
      const response = await fetch('/api/anamnesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionData: updatedSessionData,
          potentialDiagnoses: potentialDiagnoses,
          currentAnswer: selectedAnswer
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentQuestion(data.nextQuestion);
        setSessionData(updatedSessionData);
        setSelectedAnswer("");
      } else {
        throw new Error('Gagal mendapatkan pertanyaan berikutnya');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sessionData || !currentQuestion) {
    return (
      <NoDataError
        title="Data Konsultasi Tidak Ditemukan"
        message="Sepertinya Anda mengakses halaman ini tanpa memulai konsultasi. Silakan mulai konsultasi dari halaman utama."
        redirectPath="/"
        redirectLabel="Mulai Konsultasi Baru"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center">
                <MessageCircle className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Konsultasi Anamnesis</h1>
                  <p className="text-gray-600">Proses tanya jawab untuk diagnosis yang lebih akurat</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Pertanyaan</div>
              <div className="text-lg font-semibold text-blue-600">
                {sessionData ? sessionData.questionsAsked + 1 : 1} / {sessionData?.totalQuestions || 5}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progres Konsultasi</span>
            <span className="text-sm text-gray-500">
              {sessionData ? Math.round(((sessionData.questionsAsked + 1) / (sessionData.totalQuestions || 5)) * 100) : 20}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${sessionData ? ((sessionData.questionsAsked + 1) / (sessionData.totalQuestions || 5)) * 100 : 20}%` }}
            ></div>
          </div>
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {currentQuestion.question}
              </h2>
              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <strong>Mengapa pertanyaan ini penting:</strong> {currentQuestion.importance}
              </p>
            </div>

            {/* Validation: Ensure we have valid options */}
            {currentQuestion.options && currentQuestion.options.length > 0 ? (
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedAnswer === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      selectedAnswer === option ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {selectedAnswer === option && (
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <span className="text-gray-700 font-medium">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">
                  Terjadi masalah dengan format pertanyaan. Silakan gunakan tombol "Lewati" atau muat ulang halaman.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleAnswerSubmit}
                disabled={!selectedAnswer || isLoading || !currentQuestion.options || currentQuestion.options.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Memproses...
                  </>
                ) : sessionData && sessionData.questionsAsked >= (sessionData.totalQuestions || 5) - 1 ? (
                  <>
                    Selesaikan Konsultasi
                    <CheckCircle className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    Lanjut ke Pertanyaan Berikutnya
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
              
              {/* Skip button for problematic questions */}
              {(!currentQuestion.options || currentQuestion.options.length === 0) && (
                <button
                  onClick={() => setSelectedAnswer("Tidak dapat menjawab - masalah teknis")}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200"
                >
                  Lewati
                </button>
              )}
            </div>
          </div>
        )}

        {/* Previous Answers Summary */}
        {sessionData && sessionData.answersGiven.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Jawaban Sebelumnya</h3>
            <div className="space-y-3">
              {sessionData.answersGiven.map((qa, index) => (
                <div key={index} className="border-l-4 border-green-400 pl-4 py-2">
                  <p className="text-sm font-medium text-gray-700">{qa.question}</p>
                  <p className="text-sm text-green-600 font-semibold">{qa.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
