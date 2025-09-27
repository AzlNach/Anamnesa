import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Configure runtime for longer execution
export const runtime = 'nodejs';
export const maxDuration = 180; // 3 minutes for Vercel Pro, 30s for hobby

// Try persistent server first, fallback to script
async function tryPersistentServer(query: string, maxDocs: number, context: string) {
  const persistentUrl = 'http://localhost:8001/query';
  
  try {
    const response = await fetch(persistentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        max_docs: maxDocs,
        context: context
      }),
      // Short timeout for persistent server
      signal: AbortSignal.timeout(15000) // 15 seconds
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Used persistent RAG server');
      return {
        success: true,
        data: data,
        source: 'persistent_server'
      };
    }
  } catch (error) {
    console.log('⚠️ Persistent server not available, falling back to script');
  }
  
  return null;
}

async function fallbackToScript(query: string, maxDocs: number, context: string) {
  const pythonScript = path.join(process.cwd(), 'rag-system', 'api_retriever.py');
  
  const pythonCommand = process.platform === 'win32' 
    ? `chcp 65001 >nul && python "${pythonScript}" "${query}" ${maxDocs} "${context}"`
    : `python "${pythonScript}" "${query}" ${maxDocs} "${context}"`;

  console.log('🐍 Using fallback Python script');

  // Execute Python script with UTF-8 encoding
  const { stdout, stderr } = await execAsync(pythonCommand, {
    cwd: process.cwd(),
    timeout: 60000, // 1 minute timeout for script
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10, // 10MB buffer for large outputs
    env: { 
      ...process.env, 
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1'
    }
  });

  if (stderr) {
    console.log('Python stderr:', stderr);
  }

  // Parse the JSON response
  const result = JSON.parse(stdout);

  if (result.error) {
    throw new Error(`Python script error: ${result.error}`);
  }

  return {
    success: true,
    data: result,
    source: 'python_script'
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { query, context = 'anamnesis', maxDocs = 5 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 RAG Query: "${query}" (maxDocs: ${maxDocs}, context: ${context})`);

    // Try persistent server first
    let result = await tryPersistentServer(query, maxDocs, context);
    
    // Fallback to Python script if persistent server is not available
    if (!result) {
      result = await fallbackToScript(query, maxDocs, context);
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ RAG processing completed in ${processingTime}ms using ${result.source}`);

    // Add processing metadata
    const responseData = {
      success: true,
      query: result.data.query,
      response: result.data.response,
      sources: result.data.retrieved_documents,
      metadata: {
        ...result.data.metadata,
        processing_time_ms: processingTime,
        processing_source: result.source
      }
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('❌ RAG API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error',
        code: error.code || 'UNKNOWN',
        processing_time_ms: processingTime
      },
      { status: 500 }
    );
  }
}
