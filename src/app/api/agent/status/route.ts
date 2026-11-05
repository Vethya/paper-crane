import { isAiEnabled } from '@/lib/aiFeatures'

// Tells the client whether to show the agent UI. The CDN caches the answer, so
// the generator page stays static and does not run a function per visit. On
// Vercel, changing the flag needs a redeploy, which clears this cache.
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json(
    { enabled: isAiEnabled() },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=60'
      }
    }
  )
}
