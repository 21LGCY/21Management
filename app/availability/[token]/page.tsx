import AvailabilityForm from './AvailabilityForm'

export default async function AvailabilityPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <AvailabilityForm token={token} />
}
