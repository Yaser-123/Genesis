import { agentStore } from './AgentStore';
import { LLMService } from './LLMService';
import { EconomyService } from './EconomyService';
import { WalletService } from './WalletService';
import { JOB_LIST } from '../constants/jobs';
import { Event } from '../models/Event';
import { v4 as uuidv4 } from 'uuid';

export class DecisionEngine {
  private static tickCounter = 0;

  static async runTick() {
    this.tickCounter++;
    console.log(`\n--- [DecisionEngine] Tick ${this.tickCounter} Started ---`);

    const faucetMnemonic = process.env.FAUCET_WALLET_MNEMONIC?.split(' ');
    if (!faucetMnemonic) {
      throw new Error('FAUCET_WALLET_MNEMONIC is not defined in .env');
    }

    const faucetAddress = process.env.FAUCET_ADDRESS;
    if (!faucetAddress) {
      throw new Error('FAUCET_ADDRESS is not defined in .env');
    }

    const agents = agentStore.getAllAgents().filter(a => a.alive);
    
    let processed = 0;
    let deaths = 0;
    const events: Event[] = [];

    for (const agent of agents) {
      processed++;
      console.log(`\nProcessing Agent: ${agent.name} (Balance: ${agent.balance} ADA)`);

      try {
        const decision = await LLMService.generateDecision(agent, JOB_LIST);
        
        let action = decision.action;
        if (action !== 'WORK' && action !== 'REST') {
            action = 'REST';
        }
        
        console.log(`Decision: ${action} | Reason: ${decision.reason}`);

        let totalIncome = 0;

        if (action === 'WORK') {
          let job = JOB_LIST.find(j => decision.job && (j.name === decision.job || j.name.includes(decision.job)));
          if (!job) {
             job = JOB_LIST.find(j => j.name === 'Data Cleanup') || JOB_LIST.reduce((prev, curr) => prev.basePay < curr.basePay ? prev : curr);
          }
          
          console.log(`Job Selected: ${job.name}`);
          
          
          const workResult = await EconomyService.executeWork(agent, job, faucetMnemonic, decision.reason);
          totalIncome = workResult.reward;
          
          agentStore.addEvent(agent.id, workResult.event);
          events.push(workResult.event);
        } else if (action === 'REST') {
          const restEvent: Event = {
            id: uuidv4(),
            type: 'rest',
            agentId: agent.id,
            amount: 0,
            description: `Agent decided to rest. Thought process: "${decision.reason || 'Needed a break'}"`,
            txHash: null,
            timestamp: Date.now()
          };
          agentStore.addEvent(agent.id, restEvent);
          events.push(restEvent);
        }

        const expenseAmount = EconomyService.generateExpense();
        console.log(`Expense Generated: ${expenseAmount} ADA`);
        
        const expenseResult = await EconomyService.executeExpense(agent, expenseAmount, faucetAddress);
        agentStore.addEvent(agent.id, expenseResult.event);
        events.push(expenseResult.event);

        const expectedBalance = agent.balance + totalIncome - expenseAmount;
        let newBalance = expectedBalance;
        
        try {
           newBalance = await WalletService.getBalance(agent.walletAddress);
        } catch (e: any) {
           console.error(`Failed to get on-chain balance: ${e.message}`);
        }

        if (expectedBalance <= 0) {
            newBalance = 0; 
        }

        agentStore.updateBalance(agent.id, newBalance);
        console.log(`Final Balance: ${newBalance} ADA`);

        if (newBalance <= 0) {
           console.log(`Agent ${agent.name} has gone bankrupt and died.`);
           agentStore.killAgent(agent.id);
           deaths++;
        }

      } catch (error: any) {
         console.error(`Error processing agent ${agent.name}: ${error.message}`);
      }
    }

    const survivors = agentStore.getAllAgents().filter(a => a.alive).length;
    console.log(`\n--- [DecisionEngine] Tick ${this.tickCounter} Finished ---`);

    return {
       tick: this.tickCounter,
       processed,
       survivors,
       deaths,
       events
    };
  }
}
