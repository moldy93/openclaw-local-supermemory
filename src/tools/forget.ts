import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import type { LocalMemoryConfig } from "../config.ts"
import { LocalStore } from "../store.ts"

export function registerForgetTool(api: OpenClawPluginApi, store: LocalStore, _cfg: LocalMemoryConfig) {
  api.registerTool({
    name: "local_memory_forget",
    description: "Delete local memories by query",
    parameters: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
    async execute(_id, params) {
      const query = (params as any).query
      const n = await store.forget(query)
      return { content: [{ type: "text", text: `Deleted ${n} memories` }] }
    },
  })
}
