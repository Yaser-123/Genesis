import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health';
import agentsRouter from './routes/agents';
import eventsRouter from './routes/events';
import tickRouter from './routes/tick';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api', agentsRouter);
app.use('/api', eventsRouter);
app.use('/api', tickRouter);

export default app;
