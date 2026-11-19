import { AuthHydrator } from '@/providers/AuthProvider'
import { getAdminPagePrincipal } from '@/lib/server/auth'
import { redirect } from 'next/navigation'

import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const principal = await getAdminPagePrincipal()
  if (!principal) redirect('/')

  return (
    <AuthHydrator user={principal.user} profile={principal.profile}>
      <AdminNav />
      {children}
    </AuthHydrator>
  )
}
