import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import type { LocalMemoryConfig } from "../config.ts"
import { LocalStore } from "../store.ts"

export function registerStoreTool(api: OpenClawPluginApi, store: LocalStore, _cfg: LocalMemoryConfig) {
  api.registerTool({
    name: "local_memory_store",
    description: "Save information to local long-term memory",
    parameters: {
      type: "object",
      properties: { text: { type: "string" }, kind: { type: "string" } },
      required: ["text"],
    },
    async execute(_id, params) {
      const text = (params as any).text
      const kind = (params as any).kind || "memory"
      const id = await store.addMemory(text, { source: "tool" }, kind)
      return { content: [{ type: "text", text: `Stored (${kind}) id=${id}` }] }
    },
  })
}
