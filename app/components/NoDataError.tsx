'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

interface Props {
  title: string
  message: string
  redirectPath?: string
  redirectLabel?: string
}

export default function NoDataError({ 
  title, 
  message, 
  redirectPath = '/',
  redirectLabel = 'Kembali ke Beranda'
}: Props) {
  const router = useRouter()

  const handleRedirect = () => {
    router.push(redirectPath)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 rounded-full p-4">
              <AlertTriangle className="w-12 h-12 text-yellow-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {title}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          <button
            onClick={handleRedirect}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {redirectLabel}
          </button>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Tips:</strong> Mulai konsultasi dari halaman utama untuk mendapatkan analisis yang lengkap.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
