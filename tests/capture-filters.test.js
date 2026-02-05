import assert from "node:assert"
import { buildCaptureHandler } from "../src/hooks/capture.ts"
import { LocalStore } from "../src/store.ts"

process.env.LOCAL_SUPERMEMORY_STORE = "json"
const store = new LocalStore("/tmp/local-supermemory-filters.db")
const cfg = { autoCapture:true, autoRecall:true, maxRecallResults:10, profileFrequency:50, captureMode:"all", debug:false, dbPath:"/tmp/local-supermemory-filters.db", embeddingProvider:"hash", embeddingModel:"", ollamaBaseUrl:"", dedupWindow:5, captureFilters:["no-assistant","no-tools","no-system"] }
const handler = buildCaptureHandler(store, cfg, () => "sess")

await handler({ success:true, messages:[
  { role:"user", content:"user text" },
  { role:"assistant", content:"assistant text" },
  { role:"system", content:"sys" },
  { role:"tool", content:"tool" }
] })

const res = await store.search("user text", 5)
assert.ok(res.length >= 1)
const res2 = await store.search("assistant text", 5)
assert.ok(res2.length === 0)

console.log("capture-filters.test ok")
