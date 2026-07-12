import axios from 'axios';
import { Agent } from '../models/Agent';

export interface DecisionResult {
  action: "WORK" | "REST";
  job?: string;
  reason: string;
}

export class LLMService {
  static async generateDecision(agent: Agent, jobList: any[]): Promise<DecisionResult> {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error('NVIDIA_API_KEY is not defined in the environment variables');
    }

    const endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';
    const model = 'minimaxai/minimax-m3';

    const systemPrompt = `You are an autonomous AI economic agent living on the Cardano blockchain.
Always respond ONLY as valid JSON.
Your JSON must strictly follow this structure:
{
  "action": "WORK" | "REST",
  "job": "Name of the job if you decided to work, otherwise omit",
  "reason": "String explaining why you made this decision, referencing your personality, balance, and recent history"
}`;

    const availableJobsString = jobList
      .map(j => `- ${j.name} [${j.category}] (Base Pay: ${j.basePay} ADA, Risk: ${j.risk}) — ${j.description}`)
      .join('\n');

    // Pass last 3 events as context so the LLM can reason about history
    const recentHistory = agent.history
      .slice(-3)
      .map(e => `  [${e.type}] ${e.description} (${e.amount >= 0 ? '+' : ''}${e.amount} ADA)`)
      .join('\n') || '  No previous activity.';

    const prompt = `Agent Name: ${agent.name}
Personality: ${agent.personality}
Goal: ${agent.goal}
Current Balance: ${agent.balance} ADA
Total Earned: ${agent.totalEarned} ADA
Jobs Completed: ${agent.jobsCompleted}

Recent Activity (last 3 events):
${recentHistory}

Available Jobs:
${availableJobsString}

Choose an action. Supported actions: WORK, REST.
If your balance reaches zero, you die permanently.
Consider your personality: aggressive agents take high-risk high-pay jobs, conservative agents pick safe low-risk jobs, creative agents balance between them.`;

    const requestBody = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 350,
      stream: false
    };

    const startTime = Date.now();
    console.log(`[LLMService] Request started at ${new Date(startTime).toISOString()} using model ${model}`);

    try {
      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const endTime = Date.now();
      console.log(`[LLMService] Response received (Took ${endTime - startTime}ms)`);

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from LLM provider.');
      }

      let jsonString = content.trim();

      if (jsonString.endsWith('```')) {
        jsonString = jsonString.slice(0, -3).trim();
      }
      if (jsonString.startsWith('```')) {
        const firstNewLineIdx = jsonString.indexOf('\n');
        if (firstNewLineIdx !== -1) {
          jsonString = jsonString.substring(firstNewLineIdx + 1).trim();
        } else {
          jsonString = jsonString.replace(/^```(json)?/i, '').trim();
        }
      }

      try {
        const parsed = JSON.parse(jsonString);
        return {
          action: parsed.action === 'WORK' ? 'WORK' : 'REST',
          job: parsed.job,
          reason: parsed.reason || ''
        };
      } catch (parseError: any) {
        throw new Error(`Failed to parse JSON from LLM. Raw: ${content}. Error: ${parseError.message}`);
      }

    } catch (error: any) {
      if (error.response) {
        throw new Error(`LLM API failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`LLM API failed: ${error.message}`);
    }
  }
}
