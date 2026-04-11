import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-indigo-700 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">⚖️ कानूनी दस्तावेज़ सहायक</h1>
        <p className="text-indigo-200 mt-2 text-sm">Legal Document Assistant</p>
      </div>
      <SignIn />
    </div>
  )
}
