import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function createToken(payload: Record<string, any>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function authenticate(code: string): Promise<boolean> {
  const correctCode = process.env.RECRUITMENT_ACCESS_CODE;
  return code === correctCode;
}

export async function setAuthCookie(isAuthenticated: boolean) {
  const cookieStore = cookies();
  
  if (isAuthenticated) {
    const token = await createToken({ authenticated: true });
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  } else {
    cookieStore.delete('auth-token');
  }
}

export async function getAuthState(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) return false;
  
  const payload = await verifyToken(token);
  return !!payload?.authenticated;
}