import { NextRequest, NextResponse } from 'next/server';
import { authenticate, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      );
    }

    const isValid = await authenticate(code);
    
    if (isValid) {
      await setAuthCookie(true);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}