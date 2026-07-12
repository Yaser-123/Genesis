export interface Event {
  id: string;
  type: "birth" | "job_completed" | "expense" | "death";
  agentId: string;
  amount: number;
  description: string;
  txHash: string | null;
  timestamp: number;
}
