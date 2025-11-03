import { notFound } from 'next/navigation';
import PlayerProfile from '@/components/PlayerProfile';
import { supabase } from '@/lib/supabase';

// Disable caching for this page to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PlayerPageProps {
  params: {
    id: string;
  };
}

async function getPlayer(id: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const player = await getPlayer(params.id);

  if (!player) {
    notFound();
  }

  return <PlayerProfile player={player} />;
}