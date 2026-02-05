import assert from "node:assert"
import { buildCaptureHandler } from "../src/hooks/capture.ts"
import { LocalStore } from "../src/store.ts"

const store = new LocalStore(":memory:")
const cfg = { autoCapture:true, autoRecall:true, maxRecallResults:10, profileFrequency:50, captureMode:"all", debug:false, dbPath:":memory:", embeddingProvider:"hash", embeddingModel:"", ollamaBaseUrl:"", dedupWindow:5, captureFilters:["no-assistant","no-tools","no-system"] }
const handler = buildCaptureHandler(store, cfg, () => "sess")

await handler({ success:true, messages:[
  { role:"user", content:"user text" },
  { role:"assistant", content:"assistant text" },
  { role:"system", content:"sys" },
  { role:"tool", content:"tool" }
] })

const res = store.search("user text", 5)
assert.ok(res.length >= 1)
const res2 = store.search("assistant text", 5)
assert.ok(res2.length === 0)

console.log("capture-filters.test ok")
