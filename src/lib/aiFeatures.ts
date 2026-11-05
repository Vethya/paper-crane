// AI is off unless the server sets AI_FEATURES_ENABLED=true. Read at runtime,
// so a self-hosted build can turn it on with a restart instead of a rebuild.
export function isAiEnabled(
  source: Record<string, string | undefined> = process.env
) {
  return source.AI_FEATURES_ENABLED === 'true'
}

export function aiDisabledResponse(enabled = isAiEnabled()): Response | null {
  if (enabled) return null
  return Response.json(
    { error: 'AI features are disabled on this server' },
    { status: 404 }
  )
}
