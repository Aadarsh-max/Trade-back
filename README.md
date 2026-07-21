Tradeflow Backend

Production-grade backend for Tradeflow, a full-stack cryptocurrency trading and investment platform designed for Indian retail investors. This server handles real-time trading operations, wallet management, payment processing, and AI-powered market insights.

Features

Authentication & Security

JWT authentication with access and refresh token rotation
Password hashing with Bcrypt
Request validation with Zod
Idempotent payment and wallet endpoints

Financial Operations

INR wallet with deposit and withdrawal support
Stripe (international) and Razorpay (India) payment integration in test mode
Market and limit order placement with custom matching engine
Portfolio holdings calculation with unrealized and realized P&L in INR
ACID-compliant transactions for all financial operations

Real-time Features

WebSocket support via Socket.io for live updates
Real-time crypto price ticker and order-fill notifications
Live order rejection and execution notifications
Redis pub/sub for broadcasting price updates to all connected clients

AI & Intelligence

AI chat assistant with portfolio-aware context via Groq API
News sentiment analysis powered by Groq (Llama 3.3 70B)
Daily AI-generated market summaries
Background job processing for async AI tasks

Infrastructure & Reliability

Persistent notification system for all trade and wallet events
Background workers via BullMQ for non-blocking operations
Horizontally scalable architecture with stateless servers
Multi-database design: PostgreSQL for financial data, MongoDB for AI history and logs
Tech Stack

Core Framework

Node.js (runtime)
Express (REST API framework)
TypeScript (recommended for type safety)

Databases

PostgreSQL (via Prisma ORM) - financial data, user accounts, portfolios
MongoDB - AI conversation history, logs, analytics
Redis (via Upstash) - session state, caching, pub/sub

Real-time & Async

Socket.io - WebSocket communication for live updates
BullMQ - background job queue and processing

External APIs & Services

Groq API (Llama 3.3 70B) - AI chat and sentiment analysis
Stripe API - international payment processing (test mode)
Razorpay API - Indian payment processing (test mode)

Utilities & Middleware

Prisma - database ORM and migrations
Zod - schema validation and type inference
JWT - token generation and verification
Bcrypt - password hashing
Winston - logging
System Design

Scalability

Stateless API servers - all session state stored in Redis
Horizontal scaling support with load balancing
Distributed job processing with BullMQ workers

Data Integrity

ACID transactions for all wallet operations and trades
Idempotency keys on payment endpoints to prevent duplicate charges
Atomic order matching and portfolio updates

Currency Handling

Market prices stored in USD
Wallet maintained in INR
Real-time conversion at execution time with live exchange rates
5-minute exchange rate cache to optimize conversions

Data Separation

PostgreSQL: user accounts, wallets, orders, trades, portfolios
MongoDB: AI conversation context, market sentiment, system logs
Redis: session tokens, price cache, real-time broadcasts

Performance

Background workers prevent long-running tasks from blocking API responses
Redis caching for frequently accessed data (exchange rates, prices)
Indexed database queries for fast portfolio lookups
Pub/sub pattern for efficient broadcast of market updates

Key Design Decisions

Why PostgreSQL for financial data?

ACID compliance ensures wallet and trade operations are never corrupted
Supports complex transactions with multiple tables
Excellent for relational queries (orders, fills, portfolio calculations)

Why Redis for session state?

Sub-millisecond latency for token lookups
Enables stateless server design (any server can handle any user)
Built-in expiry for auto-logout

Why MongoDB for AI data?

Schema flexibility for varied AI conversation formats
Efficient for time-series logging and analytics
Separate from financial data for security and scalability

Why BullMQ for background jobs?

Prevents long AI API calls from blocking user requests
Reliable job persistence across server restarts
Supports job retries and error handling

Why Socket.io for real-time?

Automatic fallback to polling if WebSocket unavailable
Built-in room management for broadcasting to specific clients
Integrates seamlessly with Express

Security Notes

This is a demo project. Payment integrations run in test mode:

Stripe test keys used (no real charges)
Razorpay test mode enabled
No real money is involved

For production deployment:

Use production API keys
Enable rate limiting
Add request signing for webhooks
Use HTTPS everywhere
Implement CORS restrictions
Add comprehensive audit logging
