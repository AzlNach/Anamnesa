/**
 * RAG (Retrieval-Augmented Generation) Utilities
 * Utility functions untuk integrasi sistem RAG dengan aplikasi Anamnesa
 */

export interface RAGQuery {
  query: string;
  context?: 'anamnesis' | 'diagnosis' | 'general';
  maxDocs?: number;
}

export interface RAGResponse {
  success: boolean;
  query: string;
  response: string;
  sources: {
    file_name: string;
    content_preview: string;
    similarity_score: number;
  }[];
  metadata: {
    num_retrieved_docs: number;
    top_similarity_score: number;
    error?: boolean;
  };
  error?: string;
}

export interface RAGConfig {
  apiEndpoint: string;
  timeout: number;
  retries: number;
}

const DEFAULT_CONFIG: RAGConfig = {
  apiEndpoint: '/api/rag',
  timeout: 30000, // 30 seconds
  retries: 3
};

/**
 * RAG Client class untuk berkomunikasi dengan sistem RAG
 */
export class RAGClient {
  private config: RAGConfig;

  constructor(config: Partial<RAGConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Query RAG system dengan retry mechanism
   */
  async query(ragQuery: RAGQuery): Promise<RAGResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ragQuery),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: RAGResponse = await response.json();
        return result;

      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    return {
      success: false,
      query: ragQuery.query,
      response: 'Maaf, terjadi kesalahan saat mengakses basis pengetahuan medis. Silakan coba lagi.',
      sources: [],
      metadata: {
        num_retrieved_docs: 0,
        top_similarity_score: 0,
        error: true
      },
      error: lastError?.message || 'Unknown error'
    };
  }

  /**
   * Query untuk anamnesis dengan prompt yang disesuaikan
   */
  async queryForAnamnesis(userInput: string): Promise<RAGResponse> {
    return this.query({
      query: userInput,
      context: 'anamnesis',
      maxDocs: 5
    });
  }

  /**
   * Query untuk diagnosis dengan prompt yang disesuaikan
   */
  async queryForDiagnosis(symptoms: string): Promise<RAGResponse> {
    return this.query({
      query: symptoms,
      context: 'diagnosis',
      maxDocs: 7
    });
  }

  /**
   * Query umum untuk informasi medis
   */
  async queryGeneral(question: string): Promise<RAGResponse> {
    return this.query({
      query: question,
      context: 'general',
      maxDocs: 5
    });
  }
}

/**
 * Helper function untuk format response RAG menjadi text yang readable
 */
export function formatRAGResponse(response: RAGResponse): string {
  if (!response.success) {
    return response.error || 'Terjadi kesalahan dalam memproses permintaan';
  }

  let formatted = response.response;

  // Tambahkan informasi sumber jika ada
  if (response.sources && response.sources.length > 0) {
    formatted += '\n\n**Sumber Informasi:**\n';
    response.sources.forEach((source, index) => {
      formatted += `${index + 1}. ${source.file_name} (relevansi: ${(source.similarity_score * 100).toFixed(1)}%)\n`;
    });
  }

  return formatted;
}

/**
 * Helper function untuk ekstrak keywords dari query
 */
export function extractMedicalKeywords(query: string): string[] {
  const medicalTerms = [
    'sakit', 'nyeri', 'demam', 'batuk', 'pilek', 'mual', 'muntah', 'diare',
    'pusing', 'lemas', 'sesak', 'nafas', 'jantung', 'tekanan', 'darah',
    'gula', 'kolesterol', 'diabetes', 'hipertensi', 'asma', 'alergi',
    'infeksi', 'virus', 'bakteri', 'antibiotik', 'obat', 'vitamin',
    'gejala', 'diagnosa', 'pengobatan', 'terapi', 'konsultasi'
  ];

  const words = query.toLowerCase().split(/\s+/);
  return words.filter(word => 
    medicalTerms.some(term => word.includes(term) || term.includes(word))
  );
}

/**
 * Helper function untuk validasi query medis
 */
export function validateMedicalQuery(query: string): {
  isValid: boolean;
  suggestion?: string;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!query || query.trim().length === 0) {
    errors.push('Query tidak boleh kosong');
  }
  
  if (query.length < 3) {
    errors.push('Query terlalu pendek (minimum 3 karakter)');
  }
  
  if (query.length > 1000) {
    errors.push('Query terlalu panjang (maksimum 1000 karakter)');
  }

  // Check if query contains medical-related terms
  const keywords = extractMedicalKeywords(query);
  if (keywords.length === 0) {
    return {
      isValid: true, // Still valid, but suggest improvement
      suggestion: 'Untuk hasil yang lebih baik, gunakan istilah medis yang spesifik seperti gejala, nama penyakit, atau bagian tubuh.',
      errors
    };
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Default export sebagai singleton instance
const defaultRAGClient = new RAGClient();
export default defaultRAGClient;
