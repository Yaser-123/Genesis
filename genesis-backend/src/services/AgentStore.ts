import { v4 as uuidv4 } from 'uuid';
import { Agent } from '../models/Agent';
import { Event } from '../models/Event';

export class AgentStore {
  private agents: Agent[] = [];
  private events: Event[] = [];
  private tickCount = 0;

  incrementTick(): void {
    this.tickCount++;
  }

  getTickCount(): number {
    return this.tickCount;
  }

  createAgent(agentData: Omit<Agent, 'id' | 'bornAt' | 'alive' | 'history' | 'diedAt' | 'totalEarned' | 'totalSpent' | 'jobsCompleted' | 'balanceHistory'>): Agent {
    const id = uuidv4();
    const bornAt = Date.now();

    const newAgent: Agent = {
      ...agentData,
      id,
      bornAt,
      alive: true,
      history: [],
      diedAt: null,
      totalEarned: 0,
      totalSpent: 0,
      jobsCompleted: 0,
      balanceHistory: [{ balance: agentData.balance, timestamp: bornAt }]
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
      agent.balance = Math.max(0, newBalance);
      agent.balanceHistory.push({ balance: agent.balance, timestamp: Date.now() });
    }
  }

  recordIncome(id: string, amount: number): void {
    const agent = this.getAgent(id);
    if (agent) {
      agent.totalEarned += amount;
      agent.jobsCompleted++;
    }
  }

  recordExpense(id: string, amount: number): void {
    const agent = this.getAgent(id);
    if (agent) {
      agent.totalSpent += amount;
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
      description: "Agent ran out of funds and was permanently terminated.",
      txHash: null,
      timestamp: agent.diedAt
    };

    this.addEvent(id, deathEvent);
  }

  getAllEvents(): Event[] {
    return [...this.events].sort((a, b) => b.timestamp - a.timestamp);
  }

  getGlobalStats() {
    const alive = this.agents.filter(a => a.alive);
    const dead = this.agents.filter(a => !a.alive);
    const totalADA = this.agents.reduce((s, a) => s + a.balance, 0);
    const totalEarned = this.agents.reduce((s, a) => s + a.totalEarned, 0);
    const totalSpent = this.agents.reduce((s, a) => s + a.totalSpent, 0);
    const totalJobs = this.agents.reduce((s, a) => s + a.jobsCompleted, 0);

    return {
      totalAgents: this.agents.length,
      aliveAgents: alive.length,
      deadAgents: dead.length,
      totalADA: Math.round(totalADA * 100) / 100,
      totalEarned,
      totalSpent,
      totalJobs,
      totalEvents: this.events.length,
      ticksRun: this.tickCount
    };
  }
}

export const agentStore = new AgentStore();
