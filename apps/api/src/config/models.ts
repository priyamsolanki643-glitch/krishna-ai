export const GROQ_MODELS = {
  supervisor: "llama-3.1-8b-instant",           // Ultra-fast sub-100ms structured classification
  leadReasoning: "llama-3.3-70b-versatile",    // Deep reasoning & Lead draft generation
  lead: "llama-3.3-70b-versatile",            // Default Lead draft generation alias
  reviewer: "llama-3.1-8b-instant",           // Fast structured evaluation
  helper: "llama-3.1-8b-instant",             // Ephemeral worker for research/narrow tasks
  coding: "llama-3.3-70b-versatile",          // High-throughput code synthesis
  math: "llama-3.3-70b-versatile",            // Complex mathematical derivations
  research: "llama-3.3-70b-versatile",        // Knowledge extraction & fact retrieval
  critic: "llama-3.3-70b-versatile",          // Independent adversarial pushback
  compiler: "llama-3.3-70b-versatile",        // Multi-domain synthesis & merge engine
  responseArchitect: "llama-3.3-70b-versatile",// Final editorial rewrite & markdown structure
  safety: "llama-3.1-8b-instant"              // Lightweight guardrail pass-through
};
