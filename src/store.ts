import Database from "better-sqlite3"
import crypto from "node:crypto"

export type MemoryRow = {
  id: string
  content: string
  meta: string
  kind: string
  created_at: string
}

export class LocalStore {
  db: Database.Database
  constructor(path: string) {
    this.db = new Database(path)
    this.init()
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        meta TEXT,
        kind TEXT DEFAULT 'memory',
        created_at TEXT
      );
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(content, id, kind);
    `)
  }

  private hashId(content: string) {
    return crypto.createHash("sha1").update(content).digest("hex")
  }

  addMemory(content: string, meta: Record<string, unknown> = {}, kind = "memory") {
    const id = this.hashId(content)
    const createdAt = new Date().toISOString()
    const metaJson = JSON.stringify(meta)

    const insert = this.db.prepare(
      "INSERT OR IGNORE INTO memories (id, content, meta, kind, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    insert.run(id, content, metaJson, kind, createdAt)

    const fts = this.db.prepare(
      "INSERT OR IGNORE INTO memories_fts (content, id, kind) VALUES (?, ?, ?)"
    )
    fts.run(content, id, kind)

    return id
  }

  search(query: string, limit = 10) {
    const stmt = this.db.prepare(
      "SELECT m.id, m.content, m.meta, m.kind, m.created_at, bm25(memories_fts) as score FROM memories_fts JOIN memories m ON m.id = memories_fts.id WHERE memories_fts MATCH ? ORDER BY score LIMIT ?"
    )
    return stmt.all(query, limit)
  }

  getProfile(limit = 20) {
    const stmt = this.db.prepare(
      "SELECT id, content, meta, kind, created_at FROM memories WHERE kind = 'profile' ORDER BY created_at DESC LIMIT ?"
    )
    return stmt.all(limit)
  }

  forget(query: string) {
    const ids = this.search(query, 100).map((r: any) => r.id)
    if (ids.length === 0) return 0
    const del = this.db.prepare(`DELETE FROM memories WHERE id IN (${ids.map(() => "?").join(",")})`)
    del.run(...ids)
    const delFts = this.db.prepare(`DELETE FROM memories_fts WHERE id IN (${ids.map(() => "?").join(",")})`)
    delFts.run(...ids)
    return ids.length
  }
}
