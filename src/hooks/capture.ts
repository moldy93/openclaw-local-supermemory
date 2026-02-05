import type { LocalMemoryConfig } from "../config.ts"
import { log } from "../logger.ts"
import { LocalStore } from "../store.ts"

function getLastTurn(messages: unknown[]): unknown[] {
  let lastUserIdx = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i] as any
    if (msg && typeof msg === "object" && msg.role === "user") {
      lastUserIdx = i
      break
    }
  }
  return lastUserIdx >= 0 ? messages.slice(lastUserIdx) : messages
}

export function buildCaptureHandler(
  store: LocalStore,
  cfg: LocalMemoryConfig,
  getSessionKey: () => string | undefined,
) {
  return async (event: Record<string, unknown>) => {
    if (!event.success || !Array.isArray(event.messages) || event.messages.length === 0) return

    const lastTurn = getLastTurn(event.messages)
    const texts: string[] = []

    for (const msg of lastTurn as any[]) {
      if (!msg || typeof msg !== "object") continue
      const role = msg.role
      if (role !== "user" && role !== "assistant") continue
      const content = msg.content
      const parts: string[] = []

      if (typeof content === "string") parts.push(content)
      else if (Array.isArray(content)) {
        for (const block of content) {
          if (block?.type === "text" && typeof block.text === "string") parts.push(block.text)
        }
      }

      if (parts.length > 0) texts.push(`[role: ${role}]\n${parts.join("\n")}\n[${role}:end]`)
    }

    const captured = cfg.captureMode === "all"
      ? texts.map(t => t.replace(/<local-memory-context>[\s\S]*?<\/local-memory-context>\s*/g, "").trim()).filter(t => t.length >= 10)
      : texts

    if (captured.length === 0) return

    const content = captured.join("\n\n")
    const sk = getSessionKey()

    log.debug(`capturing ${captured.length} texts (${content.length} chars)`)
    store.addMemory(content, { source: "openclaw", sessionKey: sk, timestamp: new Date().toISOString() }, "memory")
  }
}
