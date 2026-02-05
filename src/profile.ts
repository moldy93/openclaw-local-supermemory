import { LocalStore } from "./store.ts"

export async function synthesizeProfile(store: LocalStore, maxFacts = 20, kind = "profile") {
  const rows = await store.getProfile(maxFacts, kind)
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of rows as any[]) {
    const line = String(r.content).trim()
    if (!line || seen.has(line)) continue
    seen.add(line)
    out.push(line)
  }
  return out
}
