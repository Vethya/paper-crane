import { AuthenticatedHomeRedirect } from '@/components/landing/AuthenticatedHomeRedirect'
import { LandingPage } from '@/components/landing/LandingPage'
import { getGithubStarCount } from '@/lib/github'

export default async function Home() {
  const githubStars = await getGithubStarCount()

  return (
    <>
      <AuthenticatedHomeRedirect />
      <LandingPage githubStars={githubStars} />
    </>
  )
}
