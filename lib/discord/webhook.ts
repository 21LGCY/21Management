/**
 * Discord Webhook Integration
 * Sends daily activity summaries to Discord channels
 */

export interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
  timestamp?: string
  footer?: {
    text: string
  }
}

export interface DiscordWebhookPayload {
  content?: string
  username?: string
  embeds?: DiscordEmbed[]
}

/**
 * Send a message to Discord via webhook
 */
async function sendDiscordWebhook(
  webhookUrl: string,
  payload: DiscordWebhookPayload
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('Discord webhook failed:', response.status, response.statusText)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending Discord webhook:', error)
    return false
  }
}

/**
 * Create a daily activity summary embed
 */
export function createDailySummaryEmbed(data: {
  date: string
  totalUsers: number
  totalLogins: number
  totalDuration: number
  userActivities: Array<{
    username: string
    role: string
    duration_minutes: number
    login_count: number
  }>
}): DiscordEmbed {
  const { date, totalUsers, totalLogins, totalDuration, userActivities } = data

  // Format date from yyyy-mm-dd to dd/mm/yyyy
  const [year, month, day] = date.split('-')
  const formattedDate = `${day}/${month}/${year}`

  // Format total duration
  const hours = Math.floor(totalDuration / 60)
  const minutes = totalDuration % 60
  const totalDurationFormatted = hours > 0 
    ? `${hours}h ${minutes}m` 
    : `${minutes}m`

  // Create fields for each user
  const userFields = userActivities.map((user) => {
    const userHours = Math.floor(user.duration_minutes / 60)
    const userMinutes = user.duration_minutes % 60
    const userDuration = userHours > 0 
      ? `${userHours}h ${userMinutes}m` 
      : `${userMinutes}m`

    const roleEmoji = {
      admin: '👑',
      manager: '⚡',
      player: '🎮',
    }[user.role.toLowerCase()] || '👤'

    return {
      name: `${roleEmoji} ${user.username}`,
      value: `⏱️ ${userDuration} | 🔐 ${user.login_count} login${user.login_count > 1 ? 's' : ''}`,
      inline: false,
    }
  })

  // Summary field at the top
  const summaryField = {
    name: '📊 Résumé Journalier',
    value: `**${totalUsers}** utilisateurs actifs${totalUsers > 1 ? 's' : ''} | **${totalLogins}** logins | **${totalDurationFormatted}** activité totale`,
    inline: false,
  }

  return {
    title: '📅 Rapport d\'activité quotidienne',
    description: `Résumé d'activité pour **${formattedDate}**`,
    color: 0x5865f2, // Discord blurple
    fields: [summaryField, ...userFields],
    timestamp: new Date().toISOString(),
    footer: {
      text: '21 Legacy Management',
    },
  }
}

/**
 * Send daily activity summary to Discord
 */
export async function sendDailySummary(data: {
  date: string
  totalUsers: number
  totalLogins: number
  totalDuration: number
  userActivities: Array<{
    username: string
    role: string
    duration_minutes: number
    login_count: number
  }>
}): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL not configured - skipping Discord summary')
    return false
  }

  const embed = createDailySummaryEmbed(data)
  
  return sendDiscordWebhook(webhookUrl, {
    username: '21 Legacy Bot',
    embeds: [embed],
  })
}
