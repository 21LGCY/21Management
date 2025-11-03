'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User, Shield, Target, MessageSquare, Calendar, Link as LinkIcon, Users, Globe, Trophy } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CreatePlayerData, ContactStatus, TeamCategory, ValorantRole, ValorantRank } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EUROPEAN_COUNTRIES } from '@/constants/countries';
import { Combobox } from '@/components/ui/combobox';
import { getRankLabel } from '@/lib/utils';

export default function AddPlayerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePlayerData>({
    username: '',
    team_category: 'mens',
    role: 'duelist',
    contact_status: 'not_contacted',
    nationality: '',
    notes: '',
    links: '',
    last_contact: '',
    managed_by: '',
    contacted_by: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine last_contact based on status
      let lastContactValue;
      if (formData.contact_status === 'not_contacted') {
        // If status is 'not_contacted', don't set a last_contact date
        lastContactValue = null;
      } else if (formData.last_contact) {
        // If user manually set a date, use it
        lastContactValue = formData.last_contact;
      } else {
        // For any other status without a manual date, set current date
        lastContactValue = new Date().toISOString();
      }

      const insertData = {
        ...formData,
        last_contact: lastContactValue,
        managed_by: formData.managed_by || null,
        contacted_by: formData.contacted_by || null,
      };

      // @ts-ignore - Supabase type inference issue
      const { error } = await supabase
        .from('players')
        .insert([insertData]);

      if (error) throw error;
      
      router.push('/players');
    } catch (error) {
      console.error('Error adding player:', error);
      alert('Échec de l\'ajout du joueur. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreatePlayerData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Navigation */}
      <nav className="glass-card border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link 
              href="/players"
              className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour aux Joueurs</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">Ajouter un Joueur</h1>
            <p className="text-gray-400">Formulaire d'ajout de joueurs</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
            {/* Username */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4" />
                Pseudo du Joueur *
              </label>
              <Input
                required
                value={formData.username}
                onChange={handleInputChange('username')}
                placeholder="Entrez le nom en jeu du joueur"
                className="w-full"
              />
            </div>

            {/* Team Category and Role Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Shield className="w-4 h-4" />
                  Équipe *
                </label>
                <select
                  required
                  value={formData.team_category}
                  onChange={handleInputChange('team_category')}
                  className="select-glass w-full rounded-lg px-3 py-2"
                >
                  <option value="mens">21L</option>
                  <option value="gc">21GC</option>
                  <option value="academy">21 ACA</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Target className="w-4 h-4" />
                  Rôle *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={handleInputChange('role')}
                  className="select-glass w-full rounded-lg px-3 py-2"
                >
                  <option value="duelist">Duelist</option>
                  <option value="initiator">Initiator</option>
                  <option value="controller">Controller</option>
                  <option value="sentinel">Sentinel</option>
                  <option value="flex">Flex</option>
                </select>
              </div>
            </div>

            {/* Rank */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Trophy className="w-4 h-4" />
                Rank VALORANT
              </label>
              <select
                value={formData.rank || ''}
                onChange={handleInputChange('rank')}
                className="select-glass w-full rounded-lg px-3 py-2"
              >
                <option value="">Non classé</option>
                <option value="ascendant_1">Ascendant 1</option>
                <option value="ascendant_2">Ascendant 2</option>
                <option value="ascendant_3">Ascendant 3</option>
                <option value="immortal_1">Immortal 1</option>
                <option value="immortal_2">Immortal 2</option>
                <option value="immortal_3">Immortal 3</option>
                <option value="radiant">Radiant</option>
              </select>
            </div>

            {/* Nationality */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Globe className="w-4 h-4" />
                Nationalité / Pays représenté
              </label>
              <Combobox
                value={formData.nationality || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}
                options={EUROPEAN_COUNTRIES}
                placeholder="Sélectionner ou saisir un pays..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Pour calculer l'éligibilité des ligues VALORANT (DACH, IBIT, etc.)
              </p>
            </div>

            {/* Contact Status */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4" />
                Statut Actuel *
              </label>
              <select
                required
                value={formData.contact_status}
                onChange={handleInputChange('contact_status')}
                className="select-glass w-full rounded-lg px-3 py-2"
              >
                <option value="not_contacted">Non Contacté</option>
                <option value="contacted">Contacté / En Attente</option>
                <option value="tryout">En Tryouts</option>
                <option value="accepted">Joueur</option>
                <option value="subs">Remplaçant</option>
                <option value="rejected">Refusé</option>
                <option value="left">Quitté</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <MessageSquare className="w-4 h-4" />
                Notes & Évaluation
              </label>
              <textarea
                value={formData.notes}
                onChange={handleInputChange('notes')}
                placeholder="Ajoutez des notes sur les compétences du joueur, agents joués, performance, communication, etc..."
                rows={4}
                className="input-glass w-full rounded-lg px-3 py-2 resize-none"
              />
              {/* <p className="text-xs text-gray-500 mt-1">
                Hésitez pas à noter toutes infos importantes (champion pool, notes etc..)
              </p> */}
            </div>

            {/* Links */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <LinkIcon className="w-4 h-4" />
                Liens
              </label>
              <textarea
                value={formData.links}
                onChange={handleInputChange('links')}
                placeholder="Ajoutez les liens de profil (1 par ligne) : tracker.gg, twitch, twitter"
                rows={3}
                className="input-glass w-full rounded-lg px-3 py-2 resize-none"
              />
              {/* <p className="text-xs text-gray-500 mt-1">
                Optionnel : Ajoutez des liens vers tracker.gg, Twitch, Twitter ou autres profils (un lien par ligne)
              </p> */}
            </div>

            {/* Staff Management Section - Horizontal Layout */}
            <div className="space-y-4 p-6 bg-white/[0.02] rounded-lg border border-white/[0.05]">
              <h3 className="flex items-center gap-2 text-base font-semibold text-white mb-3">
                <Users className="w-4 h-4" />
                Gestion du Staff
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Added By */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Ajouté par : 
                  </label>
                  <select
                    value={formData.managed_by}
                    onChange={handleInputChange('managed_by')}
                    className="select-glass w-full rounded-lg px-3 py-2"
                  >
                    <option value="">Non assigné</option>
                    <option value="Dexter">Dexter</option>
                    <option value="Zarqx">Zarqx</option>
                    <option value="Zazu">Zazu</option>
                    <option value="Honox">Honox</option>
                  </select>
                </div>

                {/* Contacted By */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Contacté par :
                  </label>
                  <select
                    value={formData.contacted_by}
                    onChange={handleInputChange('contacted_by')}
                    className="select-glass w-full rounded-lg px-3 py-2"
                  >
                    <option value="">Non assigné</option>
                    <option value="Dexter">Dexter</option>
                    <option value="Zarqx">Zarqx</option>
                    <option value="Zazu">Zazu</option>
                    <option value="Honox">Honox</option>
                  </select>
                </div>
              </div>
              
              {/* Contact Date - Always visible */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date de Contact
                </label>
                <Input
                  type="date"
                  value={typeof formData.last_contact === 'string' ? formData.last_contact.split('T')[0] : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    setFormData(prev => ({ ...prev, last_contact: dateValue ? `${dateValue}T00:00` : '' }));
                  }}
                  className="w-full"
                  style={{ 
                    colorScheme: 'dark',
                    color: 'white',
                    WebkitTextFillColor: 'white'
                  } as React.CSSProperties}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Laissez vide pour utiliser la date actuelle automatiquement
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Ajouter le Joueur
                  </>
                )}
              </Button>
              
              <Link href="/players" className="flex-1">
                <Button variant="outline" className="w-full">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}