import { AuthenticatedHomeRedirect } from '@/components/landing/AuthenticatedHomeRedirect'
import { LandingPage } from '@/components/landing/LandingPage'

export default function Home() {
  return (
    <>
      <AuthenticatedHomeRedirect />
      <LandingPage />
    </>
  )
}
