import AvailabilityForm from './AvailabilityForm'

export default function AvailabilityPage({ params }: { params: { token: string } }) {
  return <AvailabilityForm token={params.token} />
}
