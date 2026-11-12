'use client'

import { LogIn } from 'lucide-react'
import { useState } from 'react'

import SignInModal from '@/components/SignInModal'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'

interface SignInPromptProps {
  description?: string
}

export function SignInPrompt({
  description = 'Log in to see your matches and manage your rides.',
}: SignInPromptProps) {
  const { signInWithGoogle } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <EmptyState
        icon={LogIn}
        title="Please log in"
        description={description}
        action={<Button onClick={() => setIsOpen(true)}>Sign in</Button>}
      />
      <SignInModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSignIn={signInWithGoogle}
      />
    </>
  )
}
