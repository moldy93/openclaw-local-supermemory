import crypto from "node:crypto"

export type MemoryRow = {
  id: string
  content: string
  meta: string
  kind: string
  created_at: string
}

type DbLike = {
  exec: (sql: string) => void
  prepare: (sql: string) => any
}

export class LocalStore {
  db: DbLike
  inMemory: boolean = false
  mem: MemoryRow[] = []

  constructor(path: string) {
    try {
      const Database = require("better-sqlite3")
      this.db = new Database(path)
      this.init()
    } catch (err) {
      this.inMemory = true
      this.db = {
        exec: () => {},
        prepare: () => ({
          run: () => {},
          all: () => [],
        }),
      }
    }
  }

  init() {
    if (this.inMemory) return
    this.db.exec(`
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

  addMemory(content: string, meta: Record<string, unknown> = {}, kind = "memory", vec?: number[], dedupWindow = 5) {
    const createdAt = new Date().toISOString()
    const metaJson = JSON.stringify(meta)

    if (this.inMemory) {
      const id = this.hashId(content)
      if (!this.mem.find((m) => m.id === id)) {
        this.mem.push({ id, content, meta: metaJson, kind, created_at: createdAt })
      }
      return id
    }

    // dedup: skip if similar content already stored recently (same kind)
    const recent = this.db.prepare(
      "SELECT id, content FROM memories WHERE kind = ? ORDER BY created_at DESC LIMIT ?"
    ).all(kind, dedupWindow)
    if (recent.some((r: any) => r.content === content)) {
      return this.hashId(content)
    }

    // allow duplicates over time by salting id with timestamp
    const id = this.hashId(content, createdAt)

    const insert = this.db.prepare(
      "INSERT OR IGNORE INTO memories (id, content, meta, kind, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    insert.run(id, content, metaJson, kind, createdAt)

    if (vec && vec.length > 0) {
      const insVec = this.db.prepare("INSERT OR REPLACE INTO memory_vecs (id, vec_json) VALUES (?, ?)")
      insVec.run(id, JSON.stringify(vec))
    }

    return id
  }

  search(query: string, limit = 10) {
    if (this.inMemory) {
      return this.mem.filter((m) => m.content.includes(query)).slice(0, limit)
    }
    const stmt = this.db.prepare(
      "SELECT m.id, m.content, m.meta, m.kind, m.created_at, bm25(memories_fts) as score FROM memories_fts JOIN memories m ON m.rowid = memories_fts.rowid WHERE memories_fts MATCH ? ORDER BY score LIMIT ?"
    )
    return stmt.all(query, limit)
  }

  semanticSearch(vec: number[], limit = 10, scoreFn?: (a:number[],b:number[])=>number) {
    if (this.inMemory) return []
    const rows = this.db.prepare("SELECT id, vec_json FROM memory_vecs").all()
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
    const results = this.db.prepare(q).all(...ids)
    const byId: Record<string, any> = Object.fromEntries(results.map((r: any) => [r.id, r]))
    return top.map((t: any) => ({ ...byId[t.id], score: t.score }))
  }

  getProfile(limit = 20) {
    if (this.inMemory) {
      return this.mem.filter((m) => m.kind === "profile").slice(0, limit)
    }
    const stmt = this.db.prepare(
      "SELECT id, content, meta, kind, created_at FROM memories WHERE kind = 'profile' ORDER BY created_at DESC LIMIT ?"
    )
    return stmt.all(limit)
  }

  forget(query: string) {
    if (this.inMemory) {
      const before = this.mem.length
      this.mem = this.mem.filter((m) => !m.content.includes(query))
      return before - this.mem.length
    }
    const ids = this.search(query, 100).map((r: any) => r.id)
    if (ids.length === 0) return 0
    const del = this.db.prepare(`DELETE FROM memories WHERE id IN (${ids.map(() => "?").join(",")})`)
    del.run(...ids)
    const delVec = this.db.prepare(`DELETE FROM memory_vecs WHERE id IN (${ids.map(() => "?").join(",")})`)
    delVec.run(...ids)
    return ids.length
  }
}
