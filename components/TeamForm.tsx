'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, Gamepad2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { GameType, GAME_CONFIGS, DEFAULT_GAME } from '@/lib/types/games'
import CustomSelect from '@/components/CustomSelect'

interface TeamFormProps {
  teamId?: string
}

export default function TeamForm({ teamId }: TeamFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const t = useTranslations('forms')
  const tCommon = useTranslations('common')
  const tGames = useTranslations('games')
  
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    logo_url: '',
    game: DEFAULT_GAME as GameType,
  })

  useEffect(() => {
    if (teamId) {
      fetchTeam()
    }
  }, [teamId])

  const fetchTeam = async () => {
    if (!teamId) return
    
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      if (teamError) throw teamError

      if (teamData) {
        setFormData({
          name: teamData.name,
          tag: teamData.tag || '',
          logo_url: teamData.logo_url || '',
          game: (teamData.game as GameType) || DEFAULT_GAME,
        })
      }
    } catch (error) {
      console.error('Error fetching team:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (teamId) {
        // Update existing team
        const { error: updateError } = await supabase
          .from('teams')
          .update({
            name: formData.name,
            tag: formData.tag || null,
            logo_url: formData.logo_url || null,
            game: formData.game,
            updated_at: new Date().toISOString(),
          })
          .eq('id', teamId)

        if (updateError) throw updateError
      } else {
        // Create new team
        if (!formData.name) {
          alert(t('teamName') + ' ' + tCommon('required').toLowerCase())
          setLoading(false)
          return
        }

        const { data: newTeam, error: createError } = await supabase
          .from('teams')
          .insert({
            name: formData.name,
            tag: formData.tag || null,
            logo_url: formData.logo_url || null,
            game: formData.game,
          })
          .select()
          .single()

        if (createError) throw createError
      }

      router.push('/dashboard/admin/teams')
      router.refresh()
    } catch (error: any) {
      console.error('Error saving team:', error)
      alert(error.message || t('errorSavingTeam'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Team Information */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">{t('teamInfo')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Team Name, Tag & Game */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('teamName')} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('enterTeamName')}
                className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('teamTag')}
              </label>
              <input
                type="text"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
                placeholder={t('enterTeamTag')}
                maxLength={5}
                className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary uppercase font-sans"
              />
              <p className="mt-1 text-xs text-gray-400">Max 5 characters</p>
            </div>

            {/* Game Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  {t('game')} *
                </div>
              </label>
              <CustomSelect
                value={formData.game}
                onChange={(value) => setFormData({ ...formData, game: value as GameType })}
                options={Object.values(GAME_CONFIGS).map(config => ({
                  value: config.id,
                  label: config.name
                }))}
              />
              <p className="mt-1 text-xs text-gray-400">
                {formData.game === 'valorant' ? 'Agents, Valorant ranks' : 'Weapons, CS2 ranks'}
              </p>
            </div>
          </div>

          {/* Right Column - Team Logo URL & Preview */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('teamLogoUrl')}
              </label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder={t('teamLogoUrlPlaceholder')}
                className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
              />
              <p className="mt-1 text-xs text-gray-400">Enter a URL to an image (PNG, JPG, SVG)</p>
            </div>

            {formData.logo_url && (
              <div className="p-3 bg-dark border border-gray-800 rounded-lg">
                <p className="text-xs text-gray-400 mb-2">Logo Preview:</p>
                <img 
                  src={formData.logo_url} 
                  alt="Team logo preview" 
                  className="w-24 h-24 object-contain bg-dark-card rounded-lg border border-gray-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-dark-card border border-gray-800 hover:border-gray-700 text-white rounded-lg transition"
        >
          {tCommon('cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              {tCommon('saving')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {teamId ? t('updateTeam') : t('createTeam')}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
