import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not set in this environment.' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch models from Google API', details: data }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true, 
      models: data.models.map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        supportedGenerationMethods: m.supportedGenerationMethods
      })) 
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Network or parse error', message: err.message }, { status: 500 });
  }
}
