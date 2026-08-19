export interface OmniContext {
  sessionId: string;
  modelTier?: string;
  history?: any[];
  baselineCapability?: number;
  streakDays?: number;
  activeDays?: number;
  frictionCoefficient?: number;
  procrastinationFlag?: boolean;
  momentum?: 'accelerating' | 'decelerating' | 'stalled';
  warmth?: number;
  toughLoveRatio?: number;
  hopeSignal?: number;
  selectedMentor?: MentorPersona;
  chaosInjected?: boolean;
  chaosType?: 'creative_challenge' | 'perspective_flip' | 'paradigm_shift' | 'random_insight';
  chaosContent?: string;
  passProbability?: number;
  resourceGaps?: string[];
  [key: string]: any;
}

export interface IntentAnalysis {
  intent: string;
  emotion: string;
  domain: string;
  complexity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export type AgentRole = 'planner' | 'architect' | 'critic' | 'counterfactual' | 'warroom-specialist' | 'executor';

export interface AgentResponse {
  content?: string;
  agentId?: string;
  confidence?: number;
  [key: string]: any;
}

export type MentorPersona = 'Visionary' | 'Drill Sergeant' | 'Accountability Partner' | 'Crisis Support';

export interface OmniLayerResult {
  layerIndex: number;
  layerName: string;
  status: 'success' | 'skipped' | 'failed';
  metrics?: Record<string, any>;
  findings?: string[];
  interventions?: string[];
}

export interface DebateLog {
  agentId: string;
  position: string;
  argument: string;
}

export interface CouncilSession {
  id: string;
  path: 'fast' | 'deep';
  finalAnswer: string;
  telemetry?: any;
}

export interface SSEEvent {
  type: 'stage_update' | 'team_assembled' | 'thinking' | 'message' | 'done' | 'error';
  payload: any;
}
