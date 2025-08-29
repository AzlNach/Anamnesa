'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Heart, 
  AlertTriangle, 
  CheckCircle, 
  MapPin, 
  Download, 
  ArrowLeft,
  Stethoscope,
  Pill,
  Calendar,
  Shield
} from "lucide-react";
import NoDataError from "../components/NoDataError";
import { generateHealthReportPDF } from "../lib/pdfGenerator";

interface FinalDiagnosis {
  name: string;
  confidence: number;
  description: string;
  reasoning: string;
  recommendations: {
    immediateAction: string;
    doctorType: string;
    urgencyLevel: string;
    additionalTests: string[];
  };
  generalCare: {
    medications: string[];
    lifestyle: string[];
    warnings: string[];
  };
}

interface SessionData {
  originalComplaint: string;
  questionsAsked: number;
  answersGiven: { question: string; answer: string; questionIndex: number }[];
  totalQuestions?: number;
}

export default function ResultsPage() {
  const [finalDiagnosis, setFinalDiagnosis] = useState<FinalDiagnosis | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const router = useRouter();

  useEffect(() => {
    generateFinalDiagnosis();
  }, []);

  const generateFinalDiagnosis = async () => {
    try {
      const finalSessionData = localStorage.getItem('finalSessionData');
      const potentialDiagnoses = localStorage.getItem('potentialDiagnoses');
      
      if (!finalSessionData || !potentialDiagnoses) {
        setIsLoading(false);
        return;
      }

      const sessionDataParsed = JSON.parse(finalSessionData);
      const diagnosesParsed = JSON.parse(potentialDiagnoses);
      
      setSessionData(sessionDataParsed);

      // Call final diagnosis API
      const response = await fetch('/api/final-diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionData: sessionDataParsed,
          potentialDiagnoses: diagnosesParsed
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFinalDiagnosis(data.finalDiagnosis);
      } else {
        throw new Error('Gagal mendapatkan diagnosis final');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!finalDiagnosis || !sessionData) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Transform data to match PDF generator expectations
      const pdfData = {
        finalDiagnosis: {
          diagnosis: finalDiagnosis.name,
          confidence: finalDiagnosis.confidence,
          description: finalDiagnosis.description,
          reasoning: finalDiagnosis.reasoning,
          recommendations: {
            immediate_actions: [finalDiagnosis.recommendations.immediateAction],
            doctor_type: finalDiagnosis.recommendations.doctorType,
            urgency_level: finalDiagnosis.recommendations.urgencyLevel,
            tests_needed: finalDiagnosis.recommendations.additionalTests,
            general_care: finalDiagnosis.generalCare.medications.concat(
              finalDiagnosis.generalCare.lifestyle.map(item => `Gaya hidup: ${item}`)
            ),
            lifestyle_changes: finalDiagnosis.generalCare.lifestyle
          }
        },
        sessionData: {
          originalComplaint: sessionData.originalComplaint,
          questions: sessionData.answersGiven.map(qa => ({ question: qa.question })),
          answers: sessionData.answersGiven.map(qa => qa.answer)
        },
        generatedAt: new Date()
      };

      // Generate PDF using the professional health report generator
      generateHealthReportPDF(pdfData);
      
      // Show success message
      setTimeout(() => {
        alert('Laporan kesehatan berhasil diunduh dalam format PDF!');
      }, 1000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Terjadi kesalahan saat membuat PDF. Silakan coba lagi.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generatePDFContent = () => {
    if (!finalDiagnosis || !sessionData) return '';

    return `
HASIL KONSULTASI ANAMNESA AI
=============================

Tanggal: ${new Date().toLocaleDateString('id-ID')}
Waktu: ${new Date().toLocaleTimeString('id-ID')}

KELUHAN AWAL:
${sessionData.originalComplaint}

HASIL ANAMNESIS:
${sessionData.answersGiven.map((qa, index) => 
  `${index + 1}. ${qa.question}\n   Jawaban: ${qa.answer}`
).join('\n\n')}

DIAGNOSIS YANG PALING MUNGKIN:
${finalDiagnosis.name} (Tingkat Keyakinan: ${finalDiagnosis.confidence}%)

DESKRIPSI:
${finalDiagnosis.description}

ALASAN DIAGNOSIS:
${finalDiagnosis.reasoning}

REKOMENDASI TINDAKAN:
- Tindakan Segera: ${finalDiagnosis.recommendations.immediateAction}
- Konsultasi dengan: ${finalDiagnosis.recommendations.doctorType}
- Tingkat Urgensi: ${finalDiagnosis.recommendations.urgencyLevel}
- Tes Tambahan: ${finalDiagnosis.recommendations.additionalTests.join(', ')}

PERAWATAN UMUM:
- Obat-obatan: ${finalDiagnosis.generalCare.medications.join(', ')}
- Gaya Hidup: ${finalDiagnosis.generalCare.lifestyle.join(', ')}
- Peringatan: ${finalDiagnosis.generalCare.warnings.join(', ')}

DISCLAIMER:
Hasil ini BUKAN diagnosis medis final dan hanya sebagai panduan awal.
Selalu konsultasikan dengan tenaga medis profesional untuk diagnosis dan perawatan yang tepat.

Generated by Anamnesa AI
    `;
  };

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFindDoctor = () => {
    const query = `dokter ${finalDiagnosis?.recommendations.doctorType || 'umum'} terdekat`;
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank');
  };

  const handleStartNew = () => {
    localStorage.removeItem('initialAnalysis');
    localStorage.removeItem('finalSessionData');
    localStorage.removeItem('potentialDiagnoses');
    localStorage.removeItem('originalComplaint');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Menganalisis hasil konsultasi...</p>
        </div>
      </div>
    );
  }

  if (!finalDiagnosis || !sessionData) {
    return (
      <NoDataError
        title="Hasil Konsultasi Tidak Ditemukan"
        message="Data hasil konsultasi tidak dapat ditemukan. Silakan mulai konsultasi baru dari halaman utama."
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
                onClick={handleStartNew}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Hasil Konsultasi</h1>
                  <p className="text-gray-600">Diagnosis dan rekomendasi berdasarkan anamnesis</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Konsultasi Selesai</div>
              <div className="text-lg font-semibold text-green-600">
                {new Date().toLocaleDateString('id-ID')}
              </div>
            </div>
          </div>
        </div>

        {/* Final Diagnosis Card */}
        {finalDiagnosis && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center mb-6">
              <Stethoscope className="w-8 h-8 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Diagnosis yang Paling Mungkin</h2>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-blue-800">{finalDiagnosis.name}</h3>
                <div className="text-right">
                  <div className="text-sm text-blue-600">Tingkat Keyakinan</div>
                  <div className="text-2xl font-bold text-blue-800">{finalDiagnosis.confidence}%</div>
                </div>
              </div>
              <p className="text-blue-700 mb-4">{finalDiagnosis.description}</p>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Alasan Diagnosis:</h4>
                <p className="text-gray-700">{finalDiagnosis.reasoning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {finalDiagnosis && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Immediate Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Calendar className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-bold text-gray-800">Tindakan Segera</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Yang Harus Dilakukan:</h4>
                  <p className="text-gray-600">{finalDiagnosis.recommendations.immediateAction}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Konsultasi dengan:</h4>
                  <p className="text-blue-600 font-semibold">{finalDiagnosis.recommendations.doctorType}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Tingkat Urgensi:</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    finalDiagnosis.recommendations.urgencyLevel.toLowerCase().includes('tinggi') 
                      ? 'bg-red-100 text-red-800'
                      : finalDiagnosis.recommendations.urgencyLevel.toLowerCase().includes('sedang')
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {finalDiagnosis.recommendations.urgencyLevel}
                  </span>
                </div>
                {finalDiagnosis.recommendations.additionalTests.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Tes yang Mungkin Diperlukan:</h4>
                    <ul className="list-disc list-inside text-gray-600">
                      {finalDiagnosis.recommendations.additionalTests.map((test, index) => (
                        <li key={index}>{test}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* General Care */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Pill className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-bold text-gray-800">Perawatan Umum</h3>
              </div>
              <div className="space-y-4">
                {finalDiagnosis.generalCare.medications.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Obat-obatan:</h4>
                    <ul className="list-disc list-inside text-gray-600">
                      {finalDiagnosis.generalCare.medications.map((med, index) => (
                        <li key={index}>{med}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {finalDiagnosis.generalCare.lifestyle.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Pola Hidup:</h4>
                    <ul className="list-disc list-inside text-gray-600">
                      {finalDiagnosis.generalCare.lifestyle.map((lifestyle, index) => (
                        <li key={index}>{lifestyle}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {finalDiagnosis.generalCare.warnings.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-700 mb-2">Peringatan:</h4>
                    <ul className="list-disc list-inside text-red-600">
                      {finalDiagnosis.generalCare.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={handleFindDoctor}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Cari Dokter Terdekat
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
          >
            {isGeneratingPDF ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Membuat...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Download Hasil
              </>
            )}
          </button>
          <button
            onClick={handleStartNew}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
          >
            <Heart className="w-5 h-5 mr-2" />
            Konsultasi Baru
          </button>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <div className="flex items-start">
            <Shield className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Disclaimer Penting
              </h3>
              <ul className="text-yellow-700 space-y-1">
                <li>• Hasil ini <strong>BUKAN diagnosis medis final</strong> dan hanya sebagai panduan awal</li>
                <li>• <strong>Konsultasikan selalu</strong> dengan tenaga medis profesional untuk diagnosis yang akurat</li>
                <li>• Dalam kondisi darurat medis, segera hubungi rumah sakit atau layanan medis darurat</li>
                <li>• Aplikasi ini tidak menggantikan pemeriksaan fisik dan tes laboratorium yang diperlukan</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
