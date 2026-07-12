import { Router, Request, Response } from 'express';
import { DecisionEngine } from '../services/DecisionEngine';

const router = Router();

router.post('/tick', async (req: Request, res: Response) => {
  try {
    console.log('[POST /tick] Tick started');
    const result = await DecisionEngine.runTick();
    console.log('[POST /tick] Tick finished');
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
