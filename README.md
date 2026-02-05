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
          "debug": false
        }
      }
    }
  }
}
```
Restart the Gateway after enabling.

## Dev
```bash
cd openclaw-local-supermemory
npm install
```

## Notes
- This is a local-only alternative to cloud memory plugins.
- Graph UI is served separately by the `memory_pipeline` API server.
