// Validate env vars when the server starts, not on the first request.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./env')
  }
}
