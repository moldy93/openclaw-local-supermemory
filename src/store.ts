import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)

export type MemoryRow = {
  id: string
  content: string
  meta: string
  kind: string
  created_at: string
}

type DbLike = {
  exec: (sql: string) => Promise<void>
  prepare: (sql: string) => {
    run: (...args: any[]) => Promise<any>
    all: (...args: any[]) => Promise<any[]>
  }
}

function wrapBetterSqlite(db: any): DbLike {
  return {
    exec: async (sql: string) => {
      db.exec(sql)
    },
    prepare: (sql: string) => {
      const stmt = db.prepare(sql)
      return {
        run: async (...args: any[]) => {
          stmt.run(...args)
        },
        all: async (...args: any[]) => stmt.all(...args),
      }
    },
  }
}

function wrapSqlite3(db: any): DbLike {
  return {
    exec: (sql: string) =>
      new Promise((resolve, reject) => {
        db.exec(sql, (err: any) => (err ? reject(err) : resolve()))
      }),
    prepare: (sql: string) => {
      const stmt = db.prepare(sql)
      return {
        run: (...args: any[]) =>
          new Promise((resolve, reject) => {
            stmt.run(...args, function (err: any) {
              if (err) reject(err)
              else resolve(this)
            })
          }),
        all: (...args: any[]) =>
          new Promise((resolve, reject) => {
            stmt.all(...args, (err: any, rows: any[]) => (err ? reject(err) : resolve(rows)))
          }),
      }
    },
  }
}

export class LocalStore {
  db: DbLike
  inMemory: boolean = false
  mem: MemoryRow[] = []
  memPath: string | null = null
  ready: Promise<void>

  constructor(path: string, forceJson: boolean = false) {
    if (forceJson || process.env.LOCAL_SUPERMEMORY_STORE === "json") {
      this.inMemory = true
      this.memPath = path + ".json"
      this.loadMem()
      this.db = {
        exec: async () => {},
        prepare: () => ({
          run: async () => {},
          all: async () => [],
        }),
      }
      this.ready = Promise.resolve()
      return
    }

    try {
      const Database = require("better-sqlite3")
      const db = new Database(path)
      this.db = wrapBetterSqlite(db)
      this.ready = this.init()
      return
    } catch {}

    try {
      const sqlite3 = require("sqlite3")
      const db = new sqlite3.Database(path)
      this.db = wrapSqlite3(db)
      this.ready = this.init()
      return
    } catch {}

    this.inMemory = true
    this.memPath = path + ".json"
    this.loadMem()
    this.db = {
      exec: async () => {},
      prepare: () => ({
        run: async () => {},
        all: async () => [],
      }),
    }
    this.ready = Promise.resolve()
  }

  loadMem() {
    if (!this.memPath) return
    try {
      if (fs.existsSync(this.memPath)) {
        const raw = fs.readFileSync(this.memPath, "utf-8")
        this.mem = JSON.parse(raw)
      }
    } catch {}
  }

  saveMem() {
    if (!this.memPath) return
    try {
      fs.mkdirSync(path.dirname(this.memPath), { recursive: true })
      fs.writeFileSync(this.memPath, JSON.stringify(this.mem, null, 2))
    } catch (e) {
      console.error("local-supermemory saveMem failed", e)
    }
  }

  async init() {
    if (this.inMemory) return
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        meta TEXT,
        kind TEXT DEFAULT 'memory',
        created_at TEXT
      );
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(content, id, kind);
      CREATE TABLE IF NOT EXISTS memory_vecs (
        id TEXT PRIMARY KEY,
        vec_json TEXT NOT NULL
      );
      CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
        INSERT INTO memories_fts (rowid, content, id, kind) VALUES (new.rowid, new.content, new.id, new.kind);
      END;
      CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
        DELETE FROM memories_fts WHERE rowid = old.rowid;
        DELETE FROM memory_vecs WHERE id = old.id;
      END;
    `)
  }

  private hashId(content: string, salt?: string) {
    return crypto.createHash("sha1").update(content + (salt ?? "")).digest("hex")
  }

  async addMemory(content: string, meta: Record<string, unknown> = {}, kind = "memory", vec?: number[], dedupWindow = 5) {
    await this.ready
    const createdAt = new Date().toISOString()
    const metaJson = JSON.stringify(meta)

    if (this.inMemory) {
      const recent = this.mem.filter((m) => m.kind === kind).slice(-dedupWindow)
      if (recent.some((m) => m.content === content)) {
        return this.hashId(content)
      }
      const id = this.hashId(content, createdAt)
      this.mem.push({ id, content, meta: metaJson, kind, created_at: createdAt })
      this.saveMem()
      return id
    }

    const recent = await this.db
      .prepare("SELECT id, content FROM memories WHERE kind = ? ORDER BY created_at DESC LIMIT ?")
      .all(kind, dedupWindow)
    if (recent.some((r: any) => r.content === content)) {
      return this.hashId(content)
    }

    const id = this.hashId(content, createdAt)

    const insert = this.db.prepare(
      "INSERT OR IGNORE INTO memories (id, content, meta, kind, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    await insert.run(id, content, metaJson, kind, createdAt)

    if (vec && vec.length > 0) {
      const insVec = this.db.prepare("INSERT OR REPLACE INTO memory_vecs (id, vec_json) VALUES (?, ?)")
      await insVec.run(id, JSON.stringify(vec))
    }

    return id
  }

  async search(query: string, limit = 10) {
    await this.ready
    if (this.inMemory) {
      return this.mem.filter((m) => m.content.includes(query)).slice(0, limit)
    }
    const stmt = this.db.prepare(
      "SELECT m.id, m.content, m.meta, m.kind, m.created_at, bm25(memories_fts) as score FROM memories_fts JOIN memories m ON m.rowid = memories_fts.rowid WHERE memories_fts MATCH ? ORDER BY score LIMIT ?"
    )
    return await stmt.all(query, limit)
  }

  async semanticSearch(vec: number[], limit = 10, scoreFn?: (a:number[],b:number[])=>number) {
    await this.ready
    if (this.inMemory) return []
    const rows = await this.db.prepare("SELECT id, vec_json FROM memory_vecs").all()
    const scored = rows.map((r: any) => {
      const v = JSON.parse(r.vec_json)
      const score = scoreFn ? scoreFn(vec, v) : 0
      return { id: r.id, score }
    })
    scored.sort((a: any,b: any) => b.score - a.score)
    const top = scored.slice(0, limit)
    if (top.length === 0) return []
    const ids = top.map((t: any) => t.id)
    const q = `SELECT id, content, meta, kind, created_at FROM memories WHERE id IN (${ids.map(() => "?").join(",")})`
    const results = await this.db.prepare(q).all(...ids)
    const byId: Record<string, any> = Object.fromEntries(results.map((r: any) => [r.id, r]))
    return top.map((t: any) => ({ ...byId[t.id], score: t.score }))
  }

  async getProfile(limit = 20, kind = "profile") {
    await this.ready
    if (this.inMemory) {
      return this.mem.filter((m) => m.kind === kind).slice(-limit).reverse()
    }
    const stmt = this.db.prepare(
      "SELECT id, content, meta, kind, created_at FROM memories WHERE kind = ? ORDER BY created_at DESC LIMIT ?"
    )
    return await stmt.all(kind, limit)
  }

  async forget(query: string) {
    await this.ready
    if (this.inMemory) {
      const before = this.mem.length
      this.mem = this.mem.filter((m) => !m.content.includes(query))
      this.saveMem()
      return before - this.mem.length
    }
    const ids = (await this.search(query, 100)).map((r: any) => r.id)
    if (ids.length === 0) return 0
    const del = this.db.prepare(`DELETE FROM memories WHERE id IN (${ids.map(() => "?").join(",")})`)
    await del.run(...ids)
    const delVec = this.db.prepare(`DELETE FROM memory_vecs WHERE id IN (${ids.map(() => "?").join(",")})`)
    await delVec.run(...ids)
    return ids.length
  }
}
