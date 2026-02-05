import assert from "node:assert"
import { LocalStore } from "../src/store.ts"
import fs from "node:fs"

const dbPath = "/Users/m/.openclaw/workspace/openclaw-local-supermemory/tmp-test.db"
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)

const store = new LocalStore(dbPath)
const id = store.addMemory("hello world", { a: 1 }, "memory")
assert.ok(id)
const res = store.search("hello", 5)
assert.ok(res.length >= 1)
store.forget("hello")
const res2 = store.search("hello", 5)
assert.strictEqual(res2.length, 0)

console.log("store.test ok")
