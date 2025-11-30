# HealthChain Backend

This backend implements the Node.js + Express.js API for HealthChain ID with MongoDB (Mongoose), JWT auth, OTP login, AES-256-GCM encryption for medical records, and stubbed Cardano helpers.

Quick start:

1. Install dependencies

```powershell
cd c:\Users\Abhinav Mehta\Downloads\cardano\backend
npm install
```

2. Copy `.env.example` to `.env` and edit values (MongoDB URI, JWT secret)

3. Start the server

```powershell
npm run dev
```

API endpoints (high-level): see `server.js` and `routes/` directory.

Security note: OTP store is in-memory for demo; replace with Redis in production. SMS delivery not implemented.
