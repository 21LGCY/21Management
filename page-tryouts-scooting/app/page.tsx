import { redirect } from 'next/navigation';
import { getAuthState } from '@/lib/auth';

export default async function HomePage() {
  const isAuthenticated = await getAuthState();
  
  if (!isAuthenticated) {
    redirect('/login');
  }
  
  // Redirect to players page as the main dashboard
  redirect('/players');
}