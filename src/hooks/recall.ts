import type { LocalMemoryConfig } from "../config.ts"
import { log } from "../logger.ts"
import { LocalStore } from "../store.ts"
import { embed, cosine } from "../embeddings.ts"

function countUserTurns(messages: unknown[]): number {
  let count = 0
  for (const msg of messages as any[]) {
    if (msg && typeof msg === "object" && msg.role === "user") count++
  }
  return count
}

function formatContext(profile: string[], memories: any[], maxResults: number): string | null {
  const prof = profile.slice(0, maxResults)
  const mem = memories.slice(0, maxResults)
  if (prof.length === 0 && mem.length === 0) return null

  const sections: string[] = []
  if (prof.length > 0) sections.push("## User Profile (Persistent)\n" + prof.map(f => `- ${f}`).join("\n"))
  if (mem.length > 0) sections.push("## Relevant Memories\n" + mem.map((m: any) => `- ${m.content}`).join("\n"))

  const intro = "The following is recalled context about the user. Reference it only when relevant to the conversation."
  const disclaimer = "Use these memories naturally when relevant — but don't force them into every response."

  return `<local-memory-context>\n${intro}\n\n${sections.join("\n\n")}\n\n${disclaimer}\n</local-memory-context>`
}

export function buildRecallHandler(store: LocalStore, cfg: LocalMemoryConfig) {
  return async (event: Record<string, unknown>) => {
    const prompt = event.prompt as string | undefined
    if (!prompt || prompt.length < 5) return

    const messages = Array.isArray(event.messages) ? event.messages : []
    const turn = countUserTurns(messages)
    const includeProfile = turn <= 1 || turn % cfg.profileFrequency === 0

    try {
      const profile = includeProfile ? store.getProfile(cfg.maxRecallResults).map((r: any) => r.content) : []
      let memories = store.search(prompt, cfg.maxRecallResults)
      if (cfg.embeddingProvider === "ollama" || cfg.embeddingProvider === "hash") {
        try {
          const qvec = await embed(prompt, cfg)
          const sem = store.semanticSearch(qvec, cfg.maxRecallResults, cosine)
          if (sem && sem.length > 0) memories = sem
        } catch {
          // keep lexical fallback
        }
      }
      const ctx = formatContext(profile, memories, cfg.maxRecallResults)
      if (!ctx) return
      log.debug(`injecting context (${ctx.length} chars, turn ${turn})`)
      return { prependContext: ctx }
    } catch (err) {
      log.error("recall failed", err)
      return
    }
  }
}
