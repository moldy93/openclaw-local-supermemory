import assert from "node:assert"
import { embed, cosine } from "../src/embeddings.ts"

const cfg = { embeddingProvider:"hash", embeddingModel:"", ollamaBaseUrl:"", autoRecall:true, autoCapture:true, maxRecallResults:5, profileFrequency:1, captureMode:"all", debug:false, dbPath:":memory:" }
const a = await embed("hello world", cfg)
const b = await embed("hello world", cfg)
const c = await embed("different text", cfg)

assert.ok(cosine(a,b) > 0.99)
assert.ok(cosine(a,c) < 0.99)

console.log("embedding.test ok")
