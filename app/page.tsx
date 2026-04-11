import { redirect } from 'next/navigation'

// Middleware handles auth — authenticated users go to /dashboard,
// unauthenticated users are caught by the middleware and sent to /sign-in
export default function Home() {
  redirect('/dashboard')
}
