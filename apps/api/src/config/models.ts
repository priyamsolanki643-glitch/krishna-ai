export const GROQ_MODELS = {
  supervisor: "openai/gpt-oss-20b",           // Ultra-fast sub-100ms structured classification
  leadReasoning: "openai/gpt-oss-120b",        // Deep reasoning & Lead draft generation
  lead: "openai/gpt-oss-120b",                // Default Lead draft generation alias
  reviewer: "openai/gpt-oss-20b",             // Fast structured evaluation
  helper: "openai/gpt-oss-20b",               // Ephemeral worker for research/narrow tasks
  coding: "qwen/qwen3.6-27b",                  // High-throughput code synthesis & AST
  math: "openai/gpt-oss-120b",                 // Complex mathematical derivations
  research: "openai/gpt-oss-120b",             // Knowledge extraction & fact retrieval
  critic: "qwen/qwen3.6-27b",                  // Independent adversarial pushback (Zero-bias clash with 120B)
  compiler: "openai/gpt-oss-120b",             // Multi-domain synthesis & merge engine
  responseArchitect: "qwen/qwen3.6-27b",       // Final editorial rewrite & markdown structure
  safety: "openai/gpt-oss-safeguard-20b"       // Lightweight guardrail pass-through
};
