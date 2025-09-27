'use client';

import { useState } from 'react';
import ImageAnalysis from '../components/ImageAnalysis';
import { Camera, ArrowLeft, Stethoscope, Focus, Archive, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ImageAnalysisPage() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleAnalysisComplete = (analysis: any) => {
    setAnalysisResult(analysis);
    setShowSuccessMessage(true);
    console.log('Analysis completed:', analysis);
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Kembali</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Camera className="text-blue-600" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Analisis Gambar Medis</h1>
                  <p className="text-sm text-gray-600">Powered by Gemini AI</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Stethoscope size={16} />
              <span>AI Medical Assistant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-1">
                  ✅ Analisis Gambar Selesai!
                </h3>
                <p className="text-green-700">
                  Scroll ke bawah untuk melihat hasil analisis lengkap. Jangan lupa untuk:
                </p>
                <ul className="text-green-700 text-sm mt-2 ml-4 space-y-1">
                  <li>• <strong>Download hasil</strong> dalam format PDF untuk dibawa ke dokter</li>
                  <li>• <strong>Cari dokter terdekat</strong> yang sesuai dengan rekomendasi spesialis</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Navigation to Other Features */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Fitur Lainnya
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link 
              href="/consultation"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <Focus className="text-green-600" size={20} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Konsultasi Anamnesis</h4>
                <p className="text-sm text-gray-600">Analisis gejala dengan pertanyaan terarah</p>
              </div>
            </Link>
            
            <Link 
              href="/results"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <Archive className="text-purple-600" size={20} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Riwayat Analisis</h4>
                <p className="text-sm text-gray-600">Lihat hasil analisis sebelumnya</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Introduction */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-3">
              Analisis Gambar Medis dengan AI Canggih
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Fitur Unggulan:</h3>
                <ul className="space-y-1 text-sm opacity-90">
                  <li>• Segmentasi gambar otomatis</li>
                  <li>• Analisis step-by-step (Chain of Thought)</li>
                  <li>• Diagnosis diferensial yang komprehensif</li>
                  <li>• Rekomendasi pengobatan yang detail</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Keunggulan:</h3>
                <ul className="space-y-1 text-sm opacity-90">
                  <li>• Satu kali analisis per gambar (hemat API)</li>
                  <li>• Edukasi pasien yang mudah dipahami</li>
                  <li>• Prioritas keamanan dalam setiap rekomendasi</li>
                  <li>• Deskripsi gambar untuk analisis lebih akurat</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mb-8 grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📸 Format Gambar</h3>
            <p className="text-sm text-blue-700">
              Mendukung JPEG, PNG, dan WebP dengan ukuran maksimal 10MB
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">� Deskripsi Opsional</h3>
            <p className="text-sm text-green-700">
              Tambahkan deskripsi gambar untuk meningkatkan akurasi analisis AI
            </p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <h3 className="font-semibold text-amber-800 mb-2">⚕️ Konsultasi Medis</h3>
            <p className="text-sm text-amber-700">
              Hasil analisis tidak menggantikan konsultasi langsung dengan dokter
            </p>
          </div>
        </div>

        {/* Image Analysis Component */}
        <ImageAnalysis 
          onAnalysisComplete={handleAnalysisComplete}
        />
      </div>
    </div>
  );
}
