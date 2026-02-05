const patterns: Array<[RegExp, string]> = [
  [/(sk-[A-Za-z0-9_-]{10,})/g, "[REDACTED_API_KEY]"],
  [/(gsk_[A-Za-z0-9_-]{10,})/g, "[REDACTED_API_KEY]"],
  [/(sm_[A-Za-z0-9_-]{10,})/g, "[REDACTED_API_KEY]"],
  [/(hf_[A-Za-z0-9]{10,})/g, "[REDACTED_API_KEY]"],
  [/([A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,})/g, "[REDACTED_JWT]"],
  [/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, "[REDACTED_EMAIL]"]
]

export function redact(text: string): string {
  let out = text
  for (const [re, rep] of patterns) out = out.replace(re, rep)
  return out
}
