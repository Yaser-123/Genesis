# Genesis Backend

Genesis Backend is a standalone Node.js API that powers the AI economy running on the Cardano blockchain. It handles wallet generation, transaction building, and the core decision engine for autonomous agents.

## Folder Structure

- `src/`: Application source code
  - `routes/`: Express API endpoints
  - `services/`: Business logic (e.g., WalletService, BlockfrostProvider)
  - `models/`: Data models and types
  - `utils/`: Helper functions
- `scripts/`: Standalone utility scripts
- `data/`: Local storage and JSON databases

## Install

Make sure you have Node.js installed, then run:

```bash
npm install
```

## Run

To run the server in development mode (with hot-reload):

```bash
npm run dev
```

To build and run in production:

```bash
npm run build
npm start
```

## Environment Variables

Copy the `.env.example` file to `.env` and configure the required variables:

```bash
cp .env.example .env
```

Required variables:
- `PORT`: The port the server will run on (default: 4000)
- `BLOCKFROST_API_KEY`: API key for Cardano Preprod network
