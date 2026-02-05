import assert from "node:assert"
import { LocalStore } from "../src/store.ts"

const store = new LocalStore(":memory:")
store.addMemory("dup", {}, "memory", undefined, 5)
store.addMemory("dup", {}, "memory", undefined, 5)
const res = store.search("dup", 10)
assert.ok(res.length <= 1)

console.log("dedup.test ok")
