import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import PraccsReviewClient from './PraccsReviewClient'

export default async function ManagerPraccsReviewPage({
  params,
}: {
  params: { id: string }
}) {
  const { user, teamId } = await requireManagerTeamAccess()
  const matchId = params.id

  return (
    <PraccsReviewClient
      teamId={teamId}
      matchId={matchId}
      userId={user.user_id}
      userName={user.username}
      userRole="manager"
    />
  )
}
