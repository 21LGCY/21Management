import { Suspense } from 'react';
import Navigation from '@/components/Navigation';
import PlayersContent from '@/components/PlayersContent';

export default function PlayersPage() {
  return (
    <div className="min-h-screen bg-dark-900">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="text-center py-8">Loading Players...</div>}>
          <PlayersContent />
        </Suspense>
      </main>
    </div>
  );
}