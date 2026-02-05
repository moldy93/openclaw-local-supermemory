import assert from "node:assert"
import fs from "node:fs"
import { LocalStore } from "../src/store.ts"

const db = "/Users/m/.openclaw/workspace/openclaw-local-supermemory/tmp-persist.db"
const jsonPath = db + ".json"
if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath)

process.env.LOCAL_SUPERMEMORY_STORE = "json"
const store = new LocalStore(db, true)
store.mem = []
store.saveMem()
store.addMemory("persist me", {}, "memory", undefined, 5)
store.saveMem()

const store2 = new LocalStore(db, true)
const res = store2.mem.filter(m => m.content.includes("persist me"))
assert.ok(res.length >= 1)

console.log("persist.test ok")
