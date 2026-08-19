export interface StreamChunk {
  type: 'text' | 'tool_start' | 'tool_end' | 'done';
  text?: string;
  data?: any;
}

export type SSEEventType =
  | 'thinking'
  | 'message'
  | 'tool_start'
  | 'tool_end'
  | 'stage_update'
  | 'team_assembled'
  | 'done'
  | 'error';

export interface ThinkingEvent {
  type: 'thinking';
  chunk: string;
}

export interface MessageEvent {
  type: 'message';
  chunk: string;
}

export interface ToolStartEvent {
  type: 'tool_start';
  toolId: string;
  name: string;
  query: string;
}

export interface ToolEndEvent {
  type: 'tool_end';
  toolId: string;
  name: string;
  status: 'success' | 'error';
  results: any;
}

export interface StageUpdateEvent {
  type: 'stage_update';
  stage: string;
  description: string;
}

export interface TeamAssembledEvent {
  type: 'team_assembled';
  agents: string[];
  strategy: string;
}

export interface DoneEvent {
  type: 'done';
  messageId: string;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  costUsd: number;
}

export interface ErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export type SSEEvent =
  | ThinkingEvent
  | MessageEvent
  | ToolStartEvent
  | ToolEndEvent
  | StageUpdateEvent
  | TeamAssembledEvent
  | DoneEvent
  | ErrorEvent;
