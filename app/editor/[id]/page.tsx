import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import EditorShell from '@/components/EditorShell'
import { TEMPLATES } from '@/lib/templates'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditorPage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id } = await params
  const template = TEMPLATES[id]

  // Redirect to dashboard for unknown template IDs (except 'new')
  if (!template) redirect('/dashboard')

  return <EditorShell id={id} />
}

export function generateStaticParams() {
  return Object.keys(TEMPLATES).map((id) => ({ id }))
}
