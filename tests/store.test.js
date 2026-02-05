import assert from "node:assert"
import { LocalStore } from "../src/store.ts"
import fs from "node:fs"

process.env.LOCAL_SUPERMEMORY_STORE = "json"
const dbPath = "/tmp/local-supermemory-test.db"
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)

const store = new LocalStore(dbPath)
const id = await store.addMemory("hello world", { a: 1 }, "memory")
assert.ok(id)
const res = await store.search("hello", 5)
assert.ok(res.length >= 1)
await store.forget("hello")
const res2 = await store.search("hello", 5)
assert.strictEqual(res2.length, 0)

console.log("store.test ok")
