import { Heart } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Heart className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Memuat Anamnesa AI
        </h2>
        
        <p className="text-gray-500">
          Mohon tunggu sebentar...
        </p>
        
        <div className="mt-6 max-w-xs mx-auto">
          <div className="flex space-x-1 justify-center">
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
