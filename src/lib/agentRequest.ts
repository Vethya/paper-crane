/**
 * Tracks which operation the overlay is showing. Detaching never stops the
 * request: the server finishes and saves it, and late results are ignored here.
 */
export class AgentRequest {
  private current: object | null = null
  begin() {
    this.current = {}
    return this.current
  }
  isCurrent(token: object) {
    return this.current === token
  }
  detach() {
    this.current = null
  }
}
