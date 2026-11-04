export const GITHUB_REPO = 'Vethya/resume-manager'
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`

const ONE_HOUR_IN_SECONDS = 60 * 60

// Returns null when the count is unavailable, for example while the repo is
// private or GitHub is rate limiting. Callers should render without a count.
export async function getGithubStarCount(): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}`,
      {
        headers: { Accept: 'application/vnd.github+json' },
        next: { revalidate: ONE_HOUR_IN_SECONDS }
      }
    )
    if (!response.ok) {
      return null
    }

    const { stargazers_count: stars } = (await response.json()) as {
      stargazers_count?: unknown
    }
    return typeof stars === 'number' ? stars : null
  } catch {
    return null
  }
}

export function formatStarCount(stars: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(stars)
}
