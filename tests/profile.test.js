import assert from "node:assert"
import { LocalStore } from "../src/store.ts"
import { synthesizeProfile } from "../src/profile.ts"

process.env.LOCAL_SUPERMEMORY_STORE = "json"
const store = new LocalStore("/tmp/local-supermemory-profile.db", true)
store.mem = []
store.saveMem()
await store.addMemory("Fact A", {}, "profile")
await store.addMemory("Fact A", {}, "profile")
await store.addMemory("Fact B", {}, "profile")

const profile = await synthesizeProfile(store, 10, "profile")
assert.deepStrictEqual(profile, ["Fact B", "Fact A"])

console.log("profile.test ok")
