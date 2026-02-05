import fs from "node:fs";
import path from "node:path";
import { LocalStore } from "../src/store.ts";
import { buildCaptureHandler } from "../src/hooks/capture.ts";
import { defaultConfig, parseConfig } from "../src/config.ts";

function loadPluginConfig() {
  try {
    const raw = fs.readFileSync("/Users/m/.openclaw/openclaw.json", "utf-8");
    const cfg = JSON.parse(raw);
    const p = cfg?.plugins?.entries?.["openclaw-local-supermemory"]?.config;
    return parseConfig(p);
  } catch {
    return defaultConfig;
  }
}

function normalizeMessage(obj) {
  const role = obj.role || obj.speaker || obj.author || obj.type;
  const content = obj.content || obj.text || obj.message || obj.body;
  return { role, content };
}

function groupTurns(messages) {
  const turns = [];
  let current = [];
  for (const m of messages) {
    if (!m || !m.role) continue;
    if (m.role === "user" && current.length > 0) {
      turns.push(current);
      current = [];
    }
    current.push(m);
  }
  if (current.length > 0) turns.push(current);
  return turns;
}

const dir = process.argv[2] || "/Users/m/.openclaw/agents/main/sessions";
const cfg = loadPluginConfig();
const store = new LocalStore(cfg.dbPath);
const capture = buildCaptureHandler(store, cfg, () => undefined);

let totalTurns = 0;
for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith(".jsonl")) continue;
  const lines = fs.readFileSync(path.join(dir, file), "utf-8").split(/\n/).filter(Boolean);
  const msgs = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      const m = normalizeMessage(obj);
      if (m.role && m.content) msgs.push(m);
    } catch {}
  }
  const turns = groupTurns(msgs);
  for (const t of turns) {
    await capture({ success: true, messages: t });
    totalTurns++;
  }
}

console.log(JSON.stringify({ turns: totalTurns }));
