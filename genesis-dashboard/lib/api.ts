import { Agent, Event } from '@/types/agent';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Universal request helper that prefixes API_BASE, handles JSON,
 * and throws descriptive errors on non-200 responses.
 */
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    let errorMessage = 'An error occurred while fetching data';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = response.statusText;
    }
    throw new Error(`API Error: ${response.status} - ${errorMessage}`);
  }
  
  return response.json();
}

/**
 * Maps the backend Agent model to the frontend Agent interface.
 */
function mapAgent(backendAgent: any): Agent {
  return {
    id: backendAgent.id,
    name: backendAgent.name,
    personality: backendAgent.personality,
    goal: backendAgent.goal,
    isAlive: backendAgent.alive,
    status: backendAgent.alive ? 'working' : 'offline',
    adaBalance: backendAgent.balance,
    stats: {
      health: backendAgent.alive ? 100 : 0,
      energy: backendAgent.alive ? 100 : 0,
      experience: 0,
      level: 1
    },
    createdAt: new Date(backendAgent.bornAt).toISOString(),
    updatedAt: new Date().toISOString(),
    diedAt: backendAgent.diedAt ? new Date(backendAgent.diedAt).toISOString() : null
  };
}

/**
 * Maps the backend Event model to the frontend Event interface.
 */
function mapEvent(backendEvent: any): Event {
  let frontendType: Event['type'] = 'system';
  if (backendEvent.type === 'birth') frontendType = 'spawn';
  else if (backendEvent.type === 'job_completed') frontendType = 'task_complete';
  else if (backendEvent.type === 'expense') frontendType = 'tick';
  else if (backendEvent.type === 'death') frontendType = 'error';

  return {
    id: backendEvent.id,
    agentId: backendEvent.agentId,
    type: frontendType,
    message: backendEvent.description,
    timestamp: new Date(backendEvent.timestamp).toISOString(),
    amount: backendEvent.amount,
    txHash: backendEvent.txHash || undefined
  };
}

export async function fetchAgents(): Promise<Agent[]> {
  const data = await request<any[]>('/api/agents');
  return data.map(mapAgent);
}

export async function fetchAgent(id: string): Promise<Agent> {
  const data = await request<any>(`/api/agents/${id}`);
  return mapAgent(data);
}

export async function fetchEvents(): Promise<Event[]> {
  const data = await request<any[]>('/api/events');
  return data.map(mapEvent);
}

export async function spawnAgent(data?: Record<string, unknown>): Promise<Agent> {
  const body = {
    name: data?.name,
    personality: data?.personality,
    goal: data?.goal
  };
  
  const result = await request<any>('/api/agents', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  
  return mapAgent(result);
}

export async function runTick(): Promise<{ tick: number; processed: number; survivors: number; deaths: number; events: any[] }> {
  return request<any>('/api/tick', {
    method: 'POST'
  });
}
