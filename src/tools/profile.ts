import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import type { LocalMemoryConfig } from "../config.ts"
import { LocalStore } from "../store.ts"

export function registerProfileTool(api: OpenClawPluginApi, store: LocalStore, _cfg: LocalMemoryConfig) {
  api.registerTool({
    name: "local_memory_profile",
    description: "View the local user profile (persistent facts)",
    parameters: { type: "object", properties: {} },
    async execute() {
      const rows = store.getProfile(50)
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] }
    },
  })
}
