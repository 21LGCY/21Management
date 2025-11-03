'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Save, Trash2, User, Shield, Target, MessageSquare, Calendar, Clock, ExternalLink, Users, Globe, Trophy } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Player, ContactStatus, TeamCategory, ValorantRole, ValorantRank } from '@/types';
import { formatDate, getStatusColor, getStatusLabel, capitalizeFirst, getRankImage, getRankLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EUROPEAN_COUNTRIES } from '@/constants/countries';
import { Combobox } from '@/components/ui/combobox';
import Image from 'next/image';

interface PlayerProfileProps {
  player: Player;
}

export default function PlayerProfile({ player: initialPlayer }: PlayerProfileProps) {
  const router = useRouter();
  const [player, setPlayer] = useState(initialPlayer);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: player.username,
    team_category: player.team_category,
    role: player.role,
    contact_status: player.contact_status,
    rank: player.rank || null,
    nationality: player.nationality || '',
    notes: player.notes || '',
    links: player.links || '',
    managed_by: player.managed_by || '',
    contacted_by: player.contacted_by || '',
    last_contact: player.last_contact ? new Date(player.last_contact).toISOString().slice(0, 16) : '',
  });

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Determine last_contact based on status changes
      let lastContactValue;
      if (formData.contact_status === 'not_contacted') {
        // If status is 'not_contacted', clear the last_contact date
        lastContactValue = null;
      } else if (formData.last_contact) {
        // If user manually set a date, use it
        lastContactValue = formData.last_contact;
      } else if (formData.contact_status !== player.contact_status && player.contact_status === 'not_contacted') {
        // If changing FROM 'not_contacted' to another status, set current date
        lastContactValue = new Date().toISOString();
      } else {
        // Otherwise, keep the existing value
        lastContactValue = player.last_contact;
      }

      const updateData = {
        ...formData,
        last_contact: lastContactValue,
        managed_by: formData.managed_by || null,
        contacted_by: formData.contacted_by || null,
      };

      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', player.id)
        .select()
        .single();

      if (error) throw error;
      
      setPlayer(data);
      setIsEditing(false);
      
      // Refresh the page data from the server
      router.refresh();
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Échec de la mise à jour du joueur. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${player.username}? Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', player.id);

      if (error) throw error;
      
      router.push('/players');
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Échec de la suppression du joueur. Veuillez réessayer.');
    }
  };

  const handleInputChange = (field: string) => (
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
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/players"
              className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour aux Joueurs</span>
            </Link>
            
            <div className="flex items-center gap-3">
              {!isEditing ? (
                <>
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Éditer
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    size="sm"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        username: player.username,
                        team_category: player.team_category,
                        role: player.role,
                        contact_status: player.contact_status,
                        rank: player.rank || null,
                        nationality: player.nationality || '',
                        notes: player.notes || '',
                        links: player.links || '',
                        managed_by: player.managed_by || '',
                        contacted_by: player.contacted_by || '',
                        last_contact: player.last_contact ? new Date(player.last_contact).toISOString().slice(0, 16) : '',
                      });
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Annuler
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header Card */}
          <div className="glass-card p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {isEditing ? (
                      <Input
                        value={formData.username}
                        onChange={handleInputChange('username')}
                        className="text-2xl font-bold"
                      />
                    ) : (
                      <>
                        <h1 className="text-3xl font-bold text-white">{player.username}</h1>
                        {player.rank && (
                          <div className="w-10 h-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg flex items-center justify-center p-1">
                            <Image 
                              src={getRankImage(player.rank)} 
                              alt={getRankLabel(player.rank)}
                              width={32}
                              height={32}
                              className="w-full h-full object-contain"
                              title={getRankLabel(player.rank)}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {isEditing ? (
                      <>
                        <select
                          value={formData.team_category}
                          onChange={handleInputChange('team_category')}
                          className="select-glass rounded px-2 py-1 text-sm"
                        >
                          <option value="mens">21L</option>
                          <option value="gc">21GC</option>
                          <option value="academy">21 ACA</option>
                        </select>
                        <select
                          value={formData.role}
                          onChange={handleInputChange('role')}
                          className="select-glass rounded px-2 py-1 text-sm"
                        >
                          <option value="duelist">Duelist</option>
                          <option value="initiator">Initiator</option>
                          <option value="controller">Controller</option>
                          <option value="sentinel">Sentinel</option>
                          <option value="flex">Flex</option>
                        </select>
                        <select
                          value={formData.rank || ''}
                          onChange={handleInputChange('rank')}
                          className="select-glass rounded px-2 py-1 text-sm"
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
                        <div className="col-span-2">
                          <Combobox
                            value={formData.nationality}
                            onChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}
                            options={EUROPEAN_COUNTRIES}
                            placeholder="Sélectionner ou saisir nationalité..."
                            className="w-full"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-2 text-gray-300">
                          <Shield className="w-4 h-4" />
                          {player.team_category === 'mens' ? '21L' : 
                           player.team_category === 'gc' ? '21GC' : '21 ACA'}
                        </span>
                        <span className="flex items-center gap-2 text-gray-300">
                          <Target className="w-4 h-4" />
                          {capitalizeFirst(player.role)}
                        </span>
                        {player.nationality && (
                          <span className="flex items-center gap-2 text-gray-300">
                            <Globe className="w-4 h-4" />
                            {player.nationality}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`status-badge ${getStatusColor(player.contact_status)} mb-2`}>
                  {isEditing ? (
                    <select
                      value={formData.contact_status}
                      onChange={handleInputChange('contact_status')}
                      className="select-glass bg-transparent border-none text-sm px-2 py-1 rounded"
                    >
                      <option value="not_contacted">Non Contacté</option>
                      <option value="contacted">Contacté / En Attente</option>
                      <option value="tryout">En Tryouts</option>
                      <option value="accepted">Joueur</option>
                      <option value="subs">Remplaçant</option>
                      <option value="rejected">Refusé</option>
                      <option value="left">Quitté</option>
                    </select>
                  ) : (
                    getStatusLabel(player.contact_status)
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  Dernier contact: {player.contact_status === 'not_contacted' 
                    ? <span className="italic text-gray-500">Pas encore contacté</span>
                    : formatDate(player.last_contact)}
                </div>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="glass-card p-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
              <MessageSquare className="w-5 h-5" />
              Notes & Évaluation
            </h2>
            
            {isEditing ? (
              <textarea
                value={formData.notes}
                onChange={handleInputChange('notes')}
                placeholder="Ajoutez des notes sur les compétences VALORANT du joueur, agents joués, rang, performance, communication, etc..."
                rows={6}
                className="input-glass w-full rounded-lg px-4 py-3 resize-none"
              />
            ) : (
              <div className="text-gray-300 leading-relaxed">
                {player.notes ? (
                  <p className="whitespace-pre-wrap">{player.notes}</p>
                ) : (
                  <p className="text-gray-500 italic">Aucune note ajoutée.</p>
                )}
              </div>
            )}
          </div>

          {/* Staff Management Card */}
          <div className="glass-card p-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
              <Users className="w-5 h-5" />
              Gestion du Staff
            </h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Added By */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Ajouté par (Added by)
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
                      Contacté par (Contacted by)
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
                    value={formData.last_contact ? formData.last_contact.split('T')[0] : ''}
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
            ) : (
              <div className="space-y-4">
                {/* Managed By */}
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">
                    Ajouté par (Added by)
                  </label>
                  <div className="text-gray-300">
                    {player.managed_by ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-500/20 text-primary-300 border border-primary-500/30">
                        {player.managed_by}
                      </span>
                    ) : (
                      <p className="text-gray-500 italic">Non assigné</p>
                    )}
                  </div>
                </div>

                {/* Contacted By */}
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">
                    Contacté par (Contacted by)
                  </label>
                  <div className="text-gray-300">
                    {player.contacted_by ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary-500/20 text-secondary-300 border border-secondary-500/30">
                        {player.contacted_by}
                      </span>
                    ) : (
                      <p className="text-gray-500 italic">Non assigné</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Links Card */}
          <div className="glass-card p-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
              <ExternalLink className="w-5 h-5" />
              Liens de Profil
            </h2>
            
            {isEditing ? (
              <textarea
                value={formData.links}
                onChange={handleInputChange('links')}
                placeholder="Ajoutez les liens de profil (un par ligne)&#10;tracker.gg/valorant/profile/...&#10;twitch.tv/username&#10;twitter.com/username"
                rows={4}
                className="input-glass w-full rounded-lg px-4 py-3 resize-none"
              />
            ) : (
              <div className="space-y-2">
                {player.links && player.links.trim().length > 0 ? (
                  player.links.split('\n').filter(link => link.trim()).map((link, index) => {
                    const url = link.trim().startsWith('http') ? link.trim() : `https://${link.trim()}`;
                    const displayText = link.trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
                    
                    return (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg border border-white/[0.05] hover:border-primary-500/30 transition-all group"
                      >
                        <ExternalLink className="w-4 h-4 text-primary-400 flex-shrink-0 group-hover:text-primary-300" />
                        <span className="text-gray-300 group-hover:text-white truncate">{displayText}</span>
                      </a>
                    );
                  })
                ) : (
                  <p className="text-gray-500 italic">Aucun lien ajouté.</p>
                )}
              </div>
            )}
          </div>

          {/* Timeline Card */}
          <div className="glass-card p-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
              <Calendar className="w-5 h-5" />
              Timeline
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                <div className="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0"></div>
                <div>
                  <p className="text-white font-medium">Player Added</p>
                  <p className="text-gray-400 text-sm">{formatDate(player.created_at)}</p>
                </div>
              </div>
              
              {(player.last_contact || player.contact_status === 'not_contacted') && (
                <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                  <div className="w-3 h-3 bg-secondary-500 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Last Contact</p>
                    <p className="text-gray-400 text-sm">
                      {player.contact_status === 'not_contacted' 
                        ? <span className="italic text-gray-500">Pas encore contacté</span>
                        : formatDate(player.last_contact)}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                <div className="w-3 h-3 bg-gray-500 rounded-full flex-shrink-0"></div>
                <div>
                  <p className="text-white font-medium">Last Updated</p>
                  <p className="text-gray-400 text-sm">{formatDate(player.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}