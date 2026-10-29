'use client'

import { AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContainer } from '@/components/ui/PageHeader'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <PageContainer width="narrow">
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description={error.message || 'An unexpected error occurred.'}
        action={<Button onClick={() => reset()}>Try again</Button>}
      />
    </PageContainer>
  )
}
