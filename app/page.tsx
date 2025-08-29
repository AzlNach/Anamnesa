'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Shield, AlertTriangle, ArrowRight } from "lucide-react";
import DeveloperFooter from "./components/DeveloperFooter";

export default function Home() {
  const [complaint, setComplaint] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartAnalysis = async () => {
    if (!complaint.trim()) {
      alert("Silakan masukkan keluhan Anda terlebih dahulu");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ complaint }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store initial analysis in localStorage for next steps
        localStorage.setItem('initialAnalysis', JSON.stringify(data));
        localStorage.setItem('originalComplaint', complaint);
        router.push('/consultation');
      } else {
        throw new Error('Gagal memulai analisis');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <h1 className="text-4xl font-bold text-gray-800">
              Anamnesa AI
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-4">
            Asisten Konsultasi Kesehatan Berbasis AI
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Dapatkan analisis awal kondisi kesehatan Anda melalui konsultasi interaktif 
            dengan teknologi AI Google Gemini. Hasil konsultasi dapat membantu Anda 
            mempersiapkan kunjungan ke dokter.
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="mb-6">
            <label htmlFor="complaint" className="block text-lg font-semibold text-gray-700 mb-3">
              Ceritakan keluhan atau gejala yang Anda rasakan
            </label>
            <textarea
              id="complaint"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Ketikkan keluhan utama Anda di sini, misalnya: 'Saya sering merasa sakit kepala di bagian belakang selama seminggu terakhir disertai mual dan pusing saat bangun tidur...'"
              className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-gray-700"
              disabled={isLoading}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {complaint.length}/500 karakter
              </span>
              <span className="text-sm text-gray-400">
                Deskripsikan dengan detail untuk analisis yang lebih akurat
              </span>
            </div>
          </div>

          <button
            onClick={handleStartAnalysis}
            disabled={isLoading || !complaint.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Menganalisis...
              </>
            ) : (
              <>
                Mulai Analisis
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Penting untuk Diingat
              </h3>
              <ul className="text-yellow-700 space-y-1">
                <li>• Aplikasi ini <strong>BUKAN pengganti konsultasi medis profesional</strong></li>
                <li>• Hasil analisis hanya sebagai <strong>panduan awal</strong> sebelum berkonsultasi dengan dokter</li>
                <li>• Dalam situasi darurat medis, segera hubungi layanan kesehatan terdekat</li>
                <li>• Selalu konsultasikan kondisi kesehatan Anda dengan tenaga medis profesional</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center p-6">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Analisis AI Terpercaya</h3>
            <p className="text-gray-600 text-sm">
              Powered by Google Gemini untuk analisis gejala yang akurat
            </p>
          </div>
          <div className="text-center p-6">
            <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Heart className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Konsultasi Interaktif</h3>
            <p className="text-gray-600 text-sm">
              Proses tanya jawab mendalam untuk diagnosis yang lebih tepat
            </p>
          </div>
          <div className="text-center p-6">
            <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Panduan Tindakan</h3>
            <p className="text-gray-600 text-sm">
              Rekomendasi langkah selanjutnya berdasarkan hasil analisis
            </p>
          </div>
        </div>
        </div>
      </div>
      <DeveloperFooter />
    </div>
  );
}
