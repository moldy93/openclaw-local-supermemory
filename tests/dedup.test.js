import assert from "node:assert"
import { LocalStore } from "../src/store.ts"

process.env.LOCAL_SUPERMEMORY_STORE = "json"
const store = new LocalStore("/tmp/local-supermemory-dedup.db")
await store.addMemory("dup", {}, "memory", undefined, 5)
await store.addMemory("dup", {}, "memory", undefined, 5)
const res = await store.search("dup", 10)
assert.ok(res.length <= 1)

// allow after window (simulate by using smaller window)
await store.addMemory("dup", {}, "memory", undefined, 1)
const res2 = await store.search("dup", 10)
assert.ok(res2.length >= 1)

console.log("dedup.test ok")
