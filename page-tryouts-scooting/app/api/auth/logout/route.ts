import { NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';

export async function POST() {
  await setAuthCookie(false);
  return NextResponse.json({ success: true });
}