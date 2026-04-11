import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import DashboardCard from '@/components/DashboardCard'
import { TEMPLATES } from '@/lib/templates'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()
  const firstName = user?.firstName ?? 'Advocate'

  const templateCards = Object.entries(TEMPLATES).filter(([id]) => id !== 'new')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white shadow-lg no-print">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">⚖️ कानूनी दस्तावेज़ सहायक</h1>
            <p className="text-indigo-200 text-xs mt-0.5">Legal Document Assistant</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-indigo-200 hidden sm:block">
              नमस्ते, {firstName} जी
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">मेरे दस्तावेज़</h2>
          <p className="text-gray-500 text-sm mt-1">
            नीचे से टेम्प्लेट चुनें या नया दस्तावेज़ बनाएं
          </p>
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {templateCards.map(([id, tmpl]) => (
            <DashboardCard
              key={id}
              id={id}
              title={tmpl.title}
              subtitle={tmpl.subtitle}
              icon={tmpl.icon}
            />
          ))}
        </div>

        {/* New document card — full width below */}
        <DashboardCard
          id="new"
          title={TEMPLATES['new'].title}
          subtitle={TEMPLATES['new'].subtitle}
          icon={TEMPLATES['new'].icon}
          isNew
        />

        {/* Info box */}
        <div className="mt-10 rounded-xl bg-indigo-50 border border-indigo-100 p-5 text-sm text-indigo-700">
          <p className="font-semibold mb-1">💡 कैसे काम करता है?</p>
          <ul className="list-disc list-inside space-y-1 text-indigo-600">
            <li>टेम्प्लेट चुनें → दस्तावेज़ खुलेगा</li>
            <li>पीले <strong>{"{{placeholders}}"}</strong> पर क्लिक करें → भरें</li>
            <li>🎤 माइक बटन दबाएं → बोलकर टाइप करें (हिंदी)</li>
            <li>Google Drive में सहेजें या Print / PDF करें</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
