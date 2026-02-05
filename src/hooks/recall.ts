import type { LocalMemoryConfig } from "../config.ts"
import { log } from "../logger.ts"
import { LocalStore } from "../store.ts"
import { embed, cosine } from "../embeddings.ts"
import { synthesizeProfile } from "../profile.ts"

function countUserTurns(messages: unknown[]): number {
  let count = 0
  for (const msg of messages as any[]) {
    if (msg && typeof msg === "object" && msg.role === "user") count++
  }
  return count
}

function formatContext(profile: string[], memories: any[], maxResults: number, scoreMode: "semantic" | "bm25"): string | null {
  const prof = profile.slice(0, maxResults)
  const ordered = scoreMode === "semantic"
    ? memories.slice().sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
    : memories
  const mem = ordered.slice(0, maxResults)
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
      const profile = includeProfile ? synthesizeProfile(store, cfg.profileMax, cfg.profileKind) : []
      let memories = store.search(prompt, cfg.maxRecallResults)
      let scoreMode: "semantic" | "bm25" = "bm25"
      if (cfg.embeddingProvider === "ollama" || cfg.embeddingProvider === "hash") {
        try {
          const qvec = await embed(prompt, cfg)
          const sem = store.semanticSearch(qvec, cfg.maxRecallResults, cosine)
          if (sem && sem.length > 0) {
            memories = sem
            scoreMode = "semantic"
          }
        } catch {
          // keep lexical fallback
        }
      }
      const ctx = formatContext(profile, memories, cfg.maxRecallResults, scoreMode)
      if (!ctx) return
      log.debug(`injecting context (${ctx.length} chars, turn ${turn})`)
      return { prependContext: ctx }
    } catch (err) {
      log.error("recall failed", err)
      return
    }
  }
}
