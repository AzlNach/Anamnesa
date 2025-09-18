import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Configure runtime for longer execution
export const runtime = 'nodejs';
export const maxDuration = 180; // 3 minutes for Vercel Pro, 30s for hobby

export async function POST(request: NextRequest) {
  try {
    const { query, context = 'anamnesis', maxDocs = 5 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Path to the Python RAG script
    const pythonScript = path.join(process.cwd(), 'rag-system', 'api_retriever.py');
    
    // Use chcp 65001 to set UTF-8 encoding on Windows
    const pythonCommand = process.platform === 'win32' 
      ? `chcp 65001 >nul && python "${pythonScript}" "${query}" ${maxDocs} "${context}"`
      : `python "${pythonScript}" "${query}" ${maxDocs} "${context}"`;

    console.log('Executing command:', pythonCommand);

    // Execute Python script with UTF-8 encoding
    const { stdout, stderr } = await execAsync(pythonCommand, {
      cwd: process.cwd(),
      timeout: 90000, // 1.5 minutes timeout for original retriever
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer for large outputs
      env: { 
        ...process.env, 
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      }
    });

    console.log('Python stdout:', stdout);
    if (stderr) {
      console.log('Python stderr:', stderr);
    }

    // Parse the JSON response from Python script
    let result;
    try {
      result = JSON.parse(stdout);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw stdout:', stdout);
      return NextResponse.json(
        { error: 'Invalid response format from Python script' },
        { status: 500 }
      );
    }

    // Check if there's an error in the result
    if (result.error) {
      console.error('Python script error:', result.error);
      return NextResponse.json(
        { 
          error: 'Python processing error',
          details: result.error,
          query: result.query 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      query: result.query,
      response: result.response,
      sources: result.retrieved_documents,
      metadata: result.metadata
    });

  } catch (error: any) {
    console.error('RAG API error:', error);
    
    // More detailed error information
    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || 'UNKNOWN';
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        code: errorCode
      },
      { status: 500 }
    );
  }
}
