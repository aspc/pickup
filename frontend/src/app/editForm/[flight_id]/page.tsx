'use client'

import { AlertTriangle } from 'lucide-react'
import { usePathname } from 'next/navigation'

import FlightForm from '@/components/forms/FlightForm'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'

export default function EditForm() {
  const pathname = usePathname()
  const flight_id = pathname.split('/').pop()

  if (!flight_id) {
    return (
      <PageContainer width="narrow">
        <EmptyState icon={AlertTriangle} title="Error: Flight ID not found" />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="prose">
      <PageHeader
        eyebrow="Your flights"
        title="Edit flight request"
        description="Update your flight details and preferences."
      />
      <FlightForm
        mode="edit"
        flightId={flight_id}
        submitButtonText="Update"
        successRedirectRoute="/questionnaires"
      />
    </PageContainer>
  )
}
