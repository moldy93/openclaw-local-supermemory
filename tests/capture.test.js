import assert from "node:assert"
import { buildCaptureHandler } from "../src/hooks/capture.ts"
import { LocalStore } from "../src/store.ts"

process.env.LOCAL_SUPERMEMORY_STORE = "json"
const store = new LocalStore("/tmp/local-supermemory-capture.db")
const cfg = { autoCapture:true, autoRecall:true, maxRecallResults:10, profileFrequency:50, captureMode:"all", debug:false, dbPath:":memory:" }
const handler = buildCaptureHandler(store, cfg, () => "sess")

await handler({ success:true, messages:[{ role:"user", content:"secret sk-ABCDEF1234567890" }, { role:"assistant", content:"ok" }] })
const res = store.search("[REDACTED_API_KEY]", 5)
assert.ok(res.length >= 1)

console.log("capture.test ok")
