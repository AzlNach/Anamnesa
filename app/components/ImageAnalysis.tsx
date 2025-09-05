import React, { useState, useRef } from 'react';
import { Upload, Camera, Loader2, AlertCircle, CheckCircle, Eye, Pill, Calendar, AlertTriangle } from 'lucide-react';

interface ImageAnalysisProps {
  patientData?: any;
  onAnalysisComplete?: (analysis: any) => void;
}

interface Analysis {
  imageQuality: string;
  anatomicalRegion: string;
  visualObservations: {
    normalFindings: string[];
    abnormalFindings: string[];
    lesionCharacteristics: {
      size: string;
      shape: string;
      color: string;
      texture: string;
      borders: string;
    };
  };
  segmentationAnalysis: {
    affectedAreas: string[];
    severity: string;
    distribution: string;
  };
  differentialDiagnosis: Array<{
    condition: string;
    probability: string;
    reasoning: string;
    supportingFeatures: string[];
  }>;
  recommendations: {
    immediate: {
      selfCare: string[];
      medications: string[];
      avoidance: string[];
    };
    followUp: {
      timeframe: string;
      specialist: string;
      urgentSigns: string[];
    };
    prevention: string[];
  };
  patientEducation: {
    explanation: string;
    prognosis: string;
    lifestyle: string[];
  };
  disclaimer: string;
}

const ImageAnalysisComponent: React.FC<ImageAnalysisProps> = ({
  patientData,
  onAnalysisComplete
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Reset previous state
      setAnalysis(null);
      setError(null);
      setHasAnalyzed(false);
      setImageDescription(''); // Reset description when new image is selected

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Format gambar tidak didukung. Gunakan JPEG, PNG, atau WebP');
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('Ukuran gambar terlalu besar. Maksimal 10MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    // Prevent multiple analysis requests
    if (hasAnalyzed) {
      setError('Gambar sudah dianalisis. Upload gambar baru untuk analisis lainnya.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      // Add image description if provided
      if (imageDescription.trim()) {
        formData.append('imageDescription', imageDescription.trim());
      }
      
      if (patientData) {
        formData.append('patientData', JSON.stringify(patientData));
      }

      const response = await fetch('/api/image-analysis', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Terjadi kesalahan dalam analisis gambar');
      }

      setAnalysis(result.analysis);
      setHasAnalyzed(true);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result.analysis);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageDescription('');
    setAnalysis(null);
    setError(null);
    setHasAnalyzed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'ringan': return 'text-green-600';
      case 'sedang': return 'text-yellow-600';
      case 'berat': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProbabilityColor = (probability: string) => {
    switch (probability.toLowerCase()) {
      case 'tinggi': return 'bg-red-100 text-red-800';
      case 'sedang': return 'bg-yellow-100 text-yellow-800';
      case 'rendah': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mt-12 mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload size={20} />
          Upload Gambar
        </h3>
        
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            selectedImage ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {imagePreview ? (
            <div className="space-y-4">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-w-xs max-h-64 mx-auto rounded-lg shadow-md"
              />
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Ganti Gambar
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || hasAnalyzed}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isAnalyzing || hasAnalyzed
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menganalisis...
                    </>
                  ) : hasAnalyzed ? (
                    <>
                      <CheckCircle size={16} />
                      Sudah Dianalisis
                    </>
                  ) : (
                    'Analisis Gambar'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer"
            >
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 mb-2">
                Klik untuk upload gambar
              </p>
              <p className="text-sm text-gray-500">
                Format: JPEG, PNG, WebP (Maks. 10MB)
              </p>
            </div>
          )}
        </div>

        {/* Image Description Field */}
        {selectedImage && (
          <div className="mt-6">
            <label htmlFor="imageDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi Gambar (Opsional)
            </label>
            <textarea
              id="imageDescription"
              value={imageDescription}
              onChange={(e) => setImageDescription(e.target.value)}
              placeholder="Deskripsikan apa yang Anda lihat atau rasakan pada area yang difoto. Contoh: 'Ruam kemerahan di tangan kanan, terasa gatal, muncul 3 hari yang lalu setelah kontak dengan tanaman...'"
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none text-gray-700 text-sm"
              disabled={isAnalyzing || hasAnalyzed}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {imageDescription.length}/500 karakter
              </span>
              <span className="text-xs text-blue-600">
                💡 Deskripsi membantu AI memberikan analisis yang lebih akurat
              </span>
            </div>
          </div>
        )}

        {hasAnalyzed && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle size={16} />
              <span className="font-medium">Perhatian:</span>
            </div>
            <p className="text-amber-700 text-sm mt-1">
              Setiap gambar hanya bisa dianalisis sekali untuk menghemat penggunaan API. 
              Upload gambar baru untuk analisis lainnya.
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle size={20} />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Image Quality & Region */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye size={20} />
              Informasi Gambar
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Kualitas Gambar:</span>
                <p className="text-gray-600">{analysis.imageQuality}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Area Anatomi:</span>
                <p className="text-gray-600">{analysis.anatomicalRegion}</p>
              </div>
            </div>
          </div>

          {/* Visual Observations */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Observasi Visual</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-700 mb-2">Temuan Normal</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {analysis.visualObservations.normalFindings.map((finding, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-red-700 mb-2">Temuan Abnormal</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {analysis.visualObservations.abnormalFindings.map((finding, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Lesion Characteristics */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Karakteristik Lesi</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Ukuran:</span>
                  <p className="text-gray-800">{analysis.visualObservations.lesionCharacteristics.size}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Bentuk:</span>
                  <p className="text-gray-800">{analysis.visualObservations.lesionCharacteristics.shape}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Warna:</span>
                  <p className="text-gray-800">{analysis.visualObservations.lesionCharacteristics.color}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Tekstur:</span>
                  <p className="text-gray-800">{analysis.visualObservations.lesionCharacteristics.texture}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Tepi:</span>
                  <p className="text-gray-800">{analysis.visualObservations.lesionCharacteristics.borders}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Segmentation Analysis */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Analisis Segmentasi</h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <span className="font-medium text-gray-700">Area Terdampak:</span>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  {analysis.segmentationAnalysis.affectedAreas.map((area, index) => (
                    <li key={index}>• {area}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tingkat Keparahan:</span>
                <p className={`text-sm font-medium mt-1 ${getSeverityColor(analysis.segmentationAnalysis.severity)}`}>
                  {analysis.segmentationAnalysis.severity}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Distribusi:</span>
                <p className="text-sm text-gray-600 mt-1">{analysis.segmentationAnalysis.distribution}</p>
              </div>
            </div>
          </div>

          {/* Differential Diagnosis */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Kemungkinan Diagnosis</h3>
            
            <div className="space-y-4">
              {analysis.differentialDiagnosis.map((diagnosis, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800">{diagnosis.condition}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProbabilityColor(diagnosis.probability)}`}>
                      {diagnosis.probability}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{diagnosis.reasoning}</p>
                  <div>
                    <span className="text-xs font-medium text-gray-700">Ciri Pendukung:</span>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      {diagnosis.supportingFeatures.map((feature, featureIndex) => (
                        <li key={featureIndex}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Pill size={20} />
              Rekomendasi Pengobatan
            </h3>
            
            <div className="space-y-6">
              {/* Immediate Care */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3">Perawatan Segera</h4>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-blue-700">Perawatan Mandiri:</span>
                    <ul className="text-sm text-blue-600 mt-1 space-y-1">
                      {analysis.recommendations.immediate.selfCare.map((care, index) => (
                        <li key={index}>• {care}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-blue-700">Obat yang Dapat Digunakan:</span>
                    <ul className="text-sm text-blue-600 mt-1 space-y-1">
                      {analysis.recommendations.immediate.medications.map((med, index) => (
                        <li key={index}>• {med}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-blue-700">Yang Harus Dihindari:</span>
                    <ul className="text-sm text-blue-600 mt-1 space-y-1">
                      {analysis.recommendations.immediate.avoidance.map((avoid, index) => (
                        <li key={index}>• {avoid}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Follow-up */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                  <Calendar size={16} />
                  Tindak Lanjut
                </h4>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-yellow-700">Waktu Kontrol:</span>
                    <p className="text-sm text-yellow-600 mt-1">{analysis.recommendations.followUp.timeframe}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-yellow-700">Spesialis:</span>
                    <p className="text-sm text-yellow-600 mt-1">{analysis.recommendations.followUp.specialist}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-yellow-700">Tanda Bahaya:</span>
                    <ul className="text-sm text-yellow-600 mt-1 space-y-1">
                      {analysis.recommendations.followUp.urgentSigns.map((sign, index) => (
                        <li key={index}>• {sign}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Prevention */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-3">Pencegahan</h4>
                <ul className="text-sm text-green-600 space-y-1">
                  {analysis.recommendations.prevention.map((prev, index) => (
                    <li key={index}>• {prev}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Patient Education */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Edukasi Pasien</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Penjelasan Kondisi</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{analysis.patientEducation.explanation}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Prognosis</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{analysis.patientEducation.prognosis}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Modifikasi Gaya Hidup</h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  {analysis.patientEducation.lifestyle.map((lifestyle, index) => (
                    <li key={index}>• {lifestyle}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 mb-1">Penting untuk Diingat</h4>
                <p className="text-red-700 text-sm leading-relaxed">{analysis.disclaimer}</p>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="text-center">
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Analisis Gambar Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnalysisComponent;
