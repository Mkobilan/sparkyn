import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) return new NextResponse('Missing url parameter', { status: 400 });
    
    // Fetch the raw image from Supabase
    const res = await fetch(imageUrl);
    
    if (!res.ok) {
      return new NextResponse(`Failed to fetch upstream image: ${res.statusText}`, { status: res.status });
    }
    
    const buffer = await res.arrayBuffer();
    
    // Serve the image transparently to Facebook/Instagram 
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    console.error('Proxy Error:', error.message);
    return new NextResponse('Internal Proxy Error', { status: 500 });
  }
}
