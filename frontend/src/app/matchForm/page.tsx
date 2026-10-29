'use client'

import FlightForm from '@/components/forms/FlightForm'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'

export default function MatchForm() {
  return (
    <PageContainer width="prose">
      <PageHeader
        eyebrow="Your flights"
        title="Create flight request"
        description="Fill out your flight details to find travel companions."
      />
      <FlightForm
        mode="create"
        submitButtonText="Request Match"
        successRedirectRoute="/questionnaires"
      />
    </PageContainer>
  )
}
