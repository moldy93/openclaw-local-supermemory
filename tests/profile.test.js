import assert from "node:assert"
import { LocalStore } from "../src/store.ts"
import { synthesizeProfile } from "../src/profile.ts"

process.env.LOCAL_SUPERMEMORY_STORE = "json"
const store = new LocalStore("/tmp/local-supermemory-profile.db", true)
store.mem = []
store.saveMem()
store.addMemory("Fact A", {}, "profile")
store.addMemory("Fact A", {}, "profile")
store.addMemory("Fact B", {}, "profile")

const profile = synthesizeProfile(store, 10, "profile")
assert.deepStrictEqual(profile, ["Fact B", "Fact A"])

console.log("profile.test ok")
