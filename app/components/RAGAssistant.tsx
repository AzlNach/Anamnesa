'use client'

import { useState, useEffect } from 'react';
import { Search, BookOpen, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { RAGClient, formatRAGResponse, validateMedicalQuery } from '../lib/ragUtils';

interface RAGAssistantProps {
  context?: 'anamnesis' | 'diagnosis' | 'general';
  onResponse?: (response: string) => void;
  className?: string;
  initialQuery?: string;
}

interface RAGSource {
  file_name: string;
  content_preview: string;
  similarity_score: number;
}

export default function RAGAssistant({ 
  context = 'general', 
  onResponse, 
  className = '',
  initialQuery = '' 
}: RAGAssistantProps) {
  const [query, setQuery] = useState(initialQuery);
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<RAGSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Menganalisis informasi medis...');
  const [error, setError] = useState('');
  const [ragClient] = useState(() => new RAGClient());

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleQuery = async (queryText?: string) => {
    const currentQuery = queryText || query;
    
    if (!currentQuery.trim()) {
      setError('Silakan masukkan pertanyaan Anda');
      return;
    }

    // Validate query
    const validation = validateMedicalQuery(currentQuery);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');
    setSources([]);
    setLoadingMessage('Menganalisis informasi medis...');

    try {
      // Update loading message after some time
      const messageTimer = setTimeout(() => {
        setLoadingMessage('Memproses data medis dalam jumlah besar, mohon tunggu...');
      }, 10000);

      const result = await ragClient.query({
        query: currentQuery,
        context,
        maxDocs: 5
      });

      clearTimeout(messageTimer);

      if (result.success) {
        setResponse(result.response);
        setSources(result.sources);
        
        // Call callback if provided
        if (onResponse) {
          onResponse(result.response);
        }
      } else {
        setError(result.error || 'Terjadi kesalahan saat memproses permintaan');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan koneksi. Silakan coba lagi.';
      setError(errorMessage);
      console.error('RAG query error:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('Menganalisis informasi medis...');
    }
  };

  const getContextLabel = () => {
    switch (context) {
      case 'anamnesis': return 'Anamnesis';
      case 'diagnosis': return 'Diagnosis';
      default: return 'Umum';
    }
  };

  const getContextColor = () => {
    switch (context) {
      case 'anamnesis': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'diagnosis': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Asisten Medis RAG</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getContextColor()}`}>
            {getContextLabel()}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Tanyakan tentang gejala, diagnosis, atau informasi medis lainnya
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Query Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Pertanyaan Anda:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Misalnya: Apa saja gejala diabetes?"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleQuery()}
              disabled={isLoading}
            />
            <button
              onClick={() => handleQuery()}
              disabled={isLoading || !query.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {isLoading ? 'Mencari...' : 'Cari'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3 text-gray-600">
              <Loader className="w-5 h-5 animate-spin" />
              <span className="text-center">{loadingMessage}</span>
              <div className="text-xs text-gray-500 max-w-md text-center">
                {loadingMessage.includes('besar') ? 
                  'Sistem sedang memproses 37,000+ dokumen medis. Proses ini membutuhkan waktu hingga 2 menit.' : 
                  'Mencari informasi terkait dari basis data medis...'
                }
              </div>
            </div>
          </div>
        )}

        {/* Response */}
        {response && !isLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Hasil Pencarian:</span>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="prose prose-sm max-w-none">
                {response.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-2 last:mb-0 text-gray-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Sources */}
            {sources.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Sumber Informasi:</h4>
                <div className="space-y-2">
                  {sources.map((source, index) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">
                            {source.file_name}
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            {source.content_preview}
                          </p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                          {(source.similarity_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 mb-2">Contoh pertanyaan:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'Apa saja gejala hipertensi?',
              'Bagaimana cara menangani demam?',
              'Apa penyebab sakit kepala?'
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(example);
                  handleQuery(example);
                }}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
                disabled={isLoading}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
