import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import type { LocalMemoryConfig } from "../config.ts"
import { LocalStore } from "../store.ts"

export function registerCommands(api: OpenClawPluginApi, store: LocalStore, cfg: LocalMemoryConfig) {
  api.registerCommand({
    name: "remember",
    description: "Save something to local memory",
    acceptsArgs: true,
    requireAuth: true,
    handler: async (ctx: { args?: string }) => {
      const text = ctx.args?.trim()
      if (!text) return { text: "Usage: /remember <text>" }
      store.addMemory(text, { source: "openclaw_command" }, "profile")
      return { text: "Saved to profile memory." }
    },
  })

  api.registerCommand({
    name: "recall",
    description: "Search local memories",
    acceptsArgs: true,
    requireAuth: true,
    handler: async (ctx: { args?: string }) => {
      const q = ctx.args?.trim()
      if (!q) return { text: "Usage: /recall <query>" }
      const results = store.search(q, cfg.maxRecallResults)
      if (results.length === 0) return { text: `No memories found for: \"${q}\"` }
      const lines = results.map((r: any, i: number) => `${i + 1}. ${r.content}`)
      return { text: `Found ${results.length} memories:\n\n${lines.join("\n")}` }
    },
  })

  api.registerCommand({
    name: "profile",
    description: "Show local profile facts",
    acceptsArgs: false,
    requireAuth: true,
    handler: async () => {
      const rows = store.getProfile(30)
      if (rows.length === 0) return { text: "No profile facts stored yet." }
      const lines = rows.map((r: any, i: number) => `${i + 1}. ${r.content}`)
      return { text: `Profile facts:\n\n${lines.join("\n")}` }
    },
  })

  api.registerCommand({
    name: "forget",
    description: "Delete local memories by query",
    acceptsArgs: true,
    requireAuth: true,
    handler: async (ctx: { args?: string }) => {
      const q = ctx.args?.trim()
      if (!q) return { text: "Usage: /forget <query>" }
      const n = store.forget(q)
      return { text: `Deleted ${n} memories.` }
    },
  })
}
