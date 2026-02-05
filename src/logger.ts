let logger: any = console
let debugEnabled = false

export function initLogger(l: any, debug: boolean) {
  logger = l ?? console
  debugEnabled = debug
}

export const log = {
  info: (msg: string, ...args: any[]) => logger.info?.(msg, ...args),
  warn: (msg: string, ...args: any[]) => logger.warn?.(msg, ...args),
  error: (msg: string, ...args: any[]) => logger.error?.(msg, ...args),
  debug: (msg: string, ...args: any[]) => {
    if (debugEnabled) logger.info?.(msg, ...args)
  },
}
