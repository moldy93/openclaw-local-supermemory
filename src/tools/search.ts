import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import type { LocalMemoryConfig } from "../config.ts"
import { LocalStore } from "../store.ts"

export function registerSearchTool(api: OpenClawPluginApi, store: LocalStore, _cfg: LocalMemoryConfig) {
  api.registerTool({
    name: "local_memory_search",
    description: "Search local memories by query",
    parameters: {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "number" } },
      required: ["query"],
    },
    async execute(_id, params) {
      const query = (params as any).query
      const limit = (params as any).limit ?? 10
      try {
        const results = await store.search(query, limit)
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: "Search failed (invalid query)." }] }
      }
    },
  })
}
