import crypto from "node:crypto"
import type { LocalMemoryConfig } from "./config.ts"

export async function embed(text: string, cfg: LocalMemoryConfig): Promise<number[]> {
  if (cfg.embeddingProvider === "ollama") {
    const res = await fetch(`${cfg.ollamaBaseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: cfg.embeddingModel, prompt: text }),
    })
    if (!res.ok) throw new Error(`ollama embeddings failed: ${res.status}`)
    const data = await res.json() as { embedding: number[] }
    return data.embedding
  }

  // deterministic hash embedding (fallback)
  const hash = crypto.createHash("sha256").update(text).digest()
  const vec: number[] = []
  for (let i = 0; i < hash.length; i += 2) {
    const v = (hash[i] << 8) + hash[i + 1]
    vec.push(v / 65535)
  }
  return vec
}

export function cosine(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length)
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8)
}
