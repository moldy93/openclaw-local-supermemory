export type LocalMemoryConfig = {
  dbPath: string
  autoRecall: boolean
  autoCapture: boolean
  maxRecallResults: number
  profileFrequency: number
  captureMode: "everything" | "all"
  debug: boolean
}

export const defaultConfig: LocalMemoryConfig = {
  dbPath: "/Users/m/.openclaw/workspace/memory_pipeline/data/memory.db",
  autoRecall: true,
  autoCapture: true,
  maxRecallResults: 10,
  profileFrequency: 50,
  captureMode: "all",
  debug: false,
}

export function parseConfig(cfg: Record<string, unknown> | undefined): LocalMemoryConfig {
  const c = (cfg ?? {}) as Partial<LocalMemoryConfig>
  return {
    dbPath: c.dbPath ?? defaultConfig.dbPath,
    autoRecall: c.autoRecall ?? defaultConfig.autoRecall,
    autoCapture: c.autoCapture ?? defaultConfig.autoCapture,
    maxRecallResults: c.maxRecallResults ?? defaultConfig.maxRecallResults,
    profileFrequency: c.profileFrequency ?? defaultConfig.profileFrequency,
    captureMode: c.captureMode ?? defaultConfig.captureMode,
    debug: c.debug ?? defaultConfig.debug,
  }
}
