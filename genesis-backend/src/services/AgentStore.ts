import { v4 as uuidv4 } from 'uuid';
import { Agent } from '../models/Agent';
import { Event } from '../models/Event';

export class AgentStore {
  private agents: Agent[] = [];
  private events: Event[] = [];

  createAgent(agentData: Omit<Agent, 'id' | 'bornAt' | 'alive' | 'history' | 'diedAt'>): Agent {
    const id = uuidv4();
    const bornAt = Date.now();
    
    const newAgent: Agent = {
      ...agentData,
      id,
      bornAt,
      alive: true,
      history: [],
      diedAt: null
    };

    this.agents.push(newAgent);

    const birthEvent: Event = {
      id: uuidv4(),
      type: "birth",
      agentId: id,
      amount: 0,
      description: "Agent was born.",
      txHash: null,
      timestamp: bornAt
    };

    this.addEvent(id, birthEvent);

    return newAgent;
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.find(a => a.id === id);
  }

  getAllAgents(): Agent[] {
    return this.agents;
  }

  updateBalance(id: string, newBalance: number): void {
    const agent = this.getAgent(id);
    if (agent) {
      agent.balance = newBalance;
    }
  }

  addEvent(agentId: string, event: Event): void {
    const agent = this.getAgent(agentId);
    if (agent) {
      this.events.push(event);
      agent.history.push(event);
    }
  }

  killAgent(id: string): void {
    const agent = this.getAgent(id);
    if (!agent || !agent.alive) return;

    agent.alive = false;
    agent.diedAt = Date.now();

    const deathEvent: Event = {
      id: uuidv4(),
      type: "death",
      agentId: id,
      amount: 0,
      description: "Agent ran out of funds.",
      txHash: null,
      timestamp: agent.diedAt
    };

    this.addEvent(id, deathEvent);
  }

  getAllEvents(): Event[] {
    // Return newest events first
    return [...this.events].sort((a, b) => b.timestamp - a.timestamp);
  }
}

// Export a singleton instance for global use if needed
export const agentStore = new AgentStore();
