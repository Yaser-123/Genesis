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

    const systemPrompt = `You are an autonomous AI economic agent.
Always respond ONLY as valid JSON.
Your JSON must strictly follow this structure:
{
  "action": "WORK" | "REST",
  "job": "Name of the job if you decided to work, otherwise omit",
  "reason": "String explaining why you made this decision"
}`;

    const availableJobsString = jobList.map(j => `- ${j.name} (Base Pay: ${j.basePay} ADA)`).join('\n');

    const prompt = `Agent Name: ${agent.name}
Personality: ${agent.personality}
Goal: ${agent.goal}
Current Balance: ${agent.balance} ADA

Available Jobs:
${availableJobsString}

Choose an action. Supported actions: WORK, REST.
If your balance reaches zero, you will die permanently.`;

    const requestBody = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300,
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
      console.log(`[LLMService] Response received at ${new Date(endTime).toISOString()} (Took ${endTime - startTime}ms)`);

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
        throw new Error(`Failed to parse JSON response from LLM. Raw content: ${content}. Error: ${parseError.message}`);
      }

    } catch (error: any) {
      const endTime = Date.now();
      console.log(`[LLMService] Request failed at ${new Date(endTime).toISOString()} (Took ${endTime - startTime}ms)`);
      if (error.response) {
        throw new Error(`LLM API request failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`LLM API request failed: ${error.message}`);
    }
  }
}
