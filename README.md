# OpenClaw Local Supermemory

Local, private memory plugin for OpenClaw with auto-capture + auto-recall, search tools, and slash commands.

## Features
- Auto-capture after each turn
- Auto-recall before each turn
- Local SQLite store (FTS search)
- Tools: `local_memory_store`, `local_memory_search`, `local_memory_forget`, `local_memory_profile`
- Commands: `/remember`, `/recall`, `/profile`, `/forget`

## Install (local)
```bash
openclaw plugins install /path/to/openclaw-local-supermemory
```

## Config
Add to `~/.openclaw/openclaw.json`:
```json
{
  "plugins": {
    "entries": {
      "openclaw-local-supermemory": {
        "enabled": true,
        "config": {
          "dbPath": "/Users/m/.openclaw/workspace/memory_pipeline/data/memory.db",
          "autoRecall": true,
          "autoCapture": true,
          "maxRecallResults": 10,
          "profileFrequency": 50,
          "captureMode": "all",
          "captureFilters": ["no-tools", "no-system"],
          "debug": false
        }
      }
    }
  }
}
```
Restart the Gateway after enabling.

### Capture filters
- `no-tools`: skip tool outputs (tool role or tool_calls)
- `no-system`: skip system messages
- `no-assistant`: skip assistant messages
- `user-only`: capture only user content

## Dev
```bash
cd openclaw-local-supermemory
npm install
```

## Import existing session logs
```bash
cd /Users/m/.openclaw/workspace/memory_pipeline
rm -f ./data/memory.db*
for f in ~/.openclaw/agents/main/sessions/*.jsonl; do
  python importer.py "$f" --db ./data/memory.db

done
```

## Notes
- This is a local-only alternative to cloud memory plugins.
- Graph UI is served separately by the `memory_pipeline` API server.
