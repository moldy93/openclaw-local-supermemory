import assert from "node:assert"
import { buildRecallHandler } from "../src/hooks/recall.ts"
import { LocalStore } from "../src/store.ts"

process.env.LOCAL_SUPERMEMORY_STORE = "json"
const store = new LocalStore("/tmp/local-supermemory-recall.db")
store.addMemory("profile fact one", {source:"cmd"}, "profile")
store.addMemory("memory about project", {source:"cmd"}, "memory")
const cfg = { autoCapture:true, autoRecall:true, maxRecallResults:5, profileFrequency:1, captureMode:"all", debug:false, dbPath:":memory:" }
const handler = buildRecallHandler(store, cfg)
const res = await handler({ prompt:"project", messages:[{role:"user", content:"hi"}] })
assert.ok(res.prependContext.includes("profile fact one"))
assert.ok(res.prependContext.includes("memory about project"))

console.log("recall.test ok")
