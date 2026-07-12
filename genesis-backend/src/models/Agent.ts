import { Event } from './Event';

export interface Agent {
  id: string;
  name: string;
  personality: "aggressive" | "conservative" | "creative";
  goal: string;
  walletAddress: string;
  walletMnemonic: string;
  balance: number;
  alive: boolean;
  bornAt: number;
  diedAt: number | null;
  history: Event[];
}
