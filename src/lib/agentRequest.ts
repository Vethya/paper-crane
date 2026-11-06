/** Owns one operation, including response processing after fetch resolves. */
export class AgentRequest {
  private controller: AbortController | null = null
  begin() {
    this.cancel()
    this.controller = new AbortController()
    return this.controller.signal
  }
  isCurrent(signal: AbortSignal) {
    return this.controller?.signal === signal && !signal.aborted
  }
  cancel() {
    this.controller?.abort()
    this.controller = null
  }
}
