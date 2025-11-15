/**
 * Next.js Middleware
 *
 * CORS 및 보안 헤더 설정
 */

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const origin = request.headers.get('origin');

    // 허용된 출처 목록
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://nadcraft.vercel.app',
    ];

    // /api/upload-gif 엔드포인트에만 CORS 적용
    if (request.nextUrl.pathname === '/api/upload-gif') {
        // Preflight 요청 처리 (OPTIONS)
        if (request.method === 'OPTIONS') {
            if (origin && allowedOrigins.includes(origin)) {
                return new NextResponse(null, {
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                        'Access-Control-Max-Age': '86400', // 24시간
                    },
                });
            }

            return new NextResponse('Forbidden', { status: 403 });
        }

        // 실제 요청 처리
        if (origin && !allowedOrigins.includes(origin)) {
            return new NextResponse('Forbidden - Invalid origin', { status: 403 });
        }

        // 요청 통과, 응답에 CORS 헤더 추가
        const response = NextResponse.next();

        if (origin && allowedOrigins.includes(origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin);
            response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }

        return response;
    }

    // 다른 경로는 그대로 통과
    return NextResponse.next();
}

export const config = {
    matcher: '/api/upload-gif',
};
