import assert from "node:assert"
import { LocalStore } from "../src/store.ts"

const store = new LocalStore(":memory:")
store.addMemory("dup", {}, "memory", undefined, 5)
store.addMemory("dup", {}, "memory", undefined, 5)
const res = store.search("dup", 10)
assert.ok(res.length <= 1)

// allow after window (simulate by using smaller window)
store.addMemory("dup", {}, "memory", undefined, 1)
const res2 = store.search("dup", 10)
assert.ok(res2.length >= 1)

console.log("dedup.test ok")
