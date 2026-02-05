import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import { parseConfig } from "./src/config.ts"
import { initLogger, log } from "./src/logger.ts"
import { LocalStore } from "./src/store.ts"
import { buildCaptureHandler } from "./src/hooks/capture.ts"
import { buildRecallHandler } from "./src/hooks/recall.ts"
import { registerCommands } from "./src/commands/slash.ts"
import { registerStoreTool } from "./src/tools/store.ts"
import { registerSearchTool } from "./src/tools/search.ts"
import { registerForgetTool } from "./src/tools/forget.ts"
import { registerProfileTool } from "./src/tools/profile.ts"

export default {
  id: "openclaw-local-supermemory",
  name: "OpenClaw Local Supermemory",
  description: "Local memory with auto-capture/recall",
  kind: "memory" as const,
  register(api: OpenClawPluginApi) {
    const cfg = parseConfig(api.pluginConfig)
    initLogger(api.logger, cfg.debug)

    const store = new LocalStore(cfg.dbPath)

    let sessionKey: string | undefined
    const getSessionKey = () => sessionKey

    registerSearchTool(api, store, cfg)
    registerStoreTool(api, store, cfg)
    registerForgetTool(api, store, cfg)
    registerProfileTool(api, store, cfg)

    if (cfg.autoRecall) {
      const recallHandler = buildRecallHandler(store, cfg)
      api.on("before_agent_start", (event: Record<string, unknown>, ctx: Record<string, unknown>) => {
        if (ctx.sessionKey) sessionKey = ctx.sessionKey as string
        return recallHandler(event)
      })
    }

    if (cfg.autoCapture) {
      api.on("agent_end", buildCaptureHandler(store, cfg, getSessionKey))
    }

    registerCommands(api, store, cfg)

    api.registerService({
      id: "openclaw-local-supermemory",
      start: () => log.info("local-supermemory: started"),
      stop: () => log.info("local-supermemory: stopped"),
    })
  },
}
