export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  agents?: string[];
}

export interface Session {
  id: string;
  messages: Message[];
  createdAt: number;
  lastActivity: number;
}

const sessions = new Map<string, Session>();

export function createSession(id: string): Session {
  const session: Session = { id, messages: [], createdAt: Date.now(), lastActivity: Date.now() };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function addMessage(sessionId: string, message: Message): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.messages.push(message);
  session.lastActivity = Date.now();
  if (session.messages.length > 20) session.messages = session.messages.slice(-20);
}

export function getSessionContext(sessionId: string, maxMessages = 5): string {
  const session = sessions.get(sessionId);
  if (!session || session.messages.length === 0) return "";
  return session.messages
    .slice(-maxMessages)
    .map(m => `${m.role === "user" ? "User" : "Council"}: ${m.content.slice(0, 150)}`)
    .join("\n");
}

// Auto-cleanup sessions older than 2 hours
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, session] of sessions) {
    if (session.lastActivity < cutoff) sessions.delete(id);
  }
}, 30 * 60 * 1000);
