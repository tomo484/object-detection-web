import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  
  const origin = request.headers.get('origin');
  
  
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  } else {
    
    const allowedOrigins = [
      'https://your-production-domain.com',
      'https://your-frontend-domain.com',
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};

