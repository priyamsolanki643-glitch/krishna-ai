# Omni-Nexus / The Council - Backend Architecture & Context

## Project Context
You are tasked with building the backend API for "The Council," a next-generation AI pair-thinking application. The frontend is built on Next.js, React, and Tailwind CSS. The app features a "Council" of AI agents that debate and verify answers before presenting them to the user.

## Core Tech Stack
- **Runtime**: Bun (ultra-fast JS runtime)
- **API Framework**: Hono (lightweight, edge-ready API framework)
- **AI Orchestration**: LangChain & CrewAI (for multi-agent debate and reasoning)
- **Database**: PostgreSQL (with pgvector for embeddings and memory)
- **ORM**: Prisma or Drizzle
- **Caching/Queues**: Redis

## The "Council" Architecture (Multi-Agent System)
Instead of a single LLM wrapper, the backend routes queries through a multi-agent pipeline using CrewAI/LangGraph:
1. **The Supervisor**: Analyzes the incoming user query and routes it to the appropriate specialized agent.
2. **The Primary Agent**: Generates the initial reasoning, code, or answer (uses deep reasoning models like Claude 3.7 Sonnet, DeepSeek R1, or o3-mini).
3. **The Critic/Reviewer**: Actively tries to break, debug, or find logical flaws in the Primary Agent's solution to eliminate hallucinations.
4. **The Architect**: Finalizes the verified output and formats it for the frontend.

## Streaming & Real-Time Communication
The frontend requires a zero-latency feel. The API must stream responses using **Server-Sent Events (SSE)**.
The stream needs to separate different types of data:
- `event: thinking` -> For internal agent reasoning streams (`<think>` blocks).
- `event: tool_start` / `tool_end` -> For live updates when agents search the web or execute code.
- `event: message` -> For the final verified markdown response.

## Database Schema Highlights
- **Users**: Auth (JWT / API Key), multi-tenant isolation.
- **Sessions & Folders**: Users can organize chats into folders. Sessions store the full conversation history.
- **Messages**: Store roles (USER, ASSISTANT, TOOL), content, reasoning/thinking blocks, and token usage.
- **Memory**: Long-term semantic memory stored using `pgvector` so agents can retrieve user preferences and past context via RAG.

## Security & Resilience
- Token-bucket rate limiting via Redis.
- Fallback logic for LLM providers (e.g., if Anthropic hits a 429 Rate Limit, seamlessly fallback to OpenAI or Gemini).

## Your Mission
Read the context above. Initialize a `Bun + Hono` project. Set up the `CrewAI / Langchain` multi-agent pipeline with SSE streaming endpoints. Ensure the code is strictly typed (TypeScript), production-ready, and capable of streaming real-time thoughts to a frontend client.
