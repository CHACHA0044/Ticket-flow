# Local Development & Environment Setup Guide
## Ticket Flow — Scalable Real-Time Event Ticket Booking System

**Project Authors:** Pranav Dembla (2300100925 / 2301888021), Sachin Gautam (2300101889 / 2301888023)  
**Supervisor:** Mohd. Anas Khan  
**Department:** Computer Science & Engineering, Integral University, Lucknow  
**Academic Year:** 2026–2027  

---

## 1. System Prerequisites

Before running Ticket Flow locally, ensure the following tools are installed on your workstation:

- **Node.js:** v20.x or v22.x LTS ([nodejs.org](https://nodejs.org/))
- **npm / pnpm / yarn:** npm v10+ (bundled with Node.js)
- **Docker & Docker Compose:** Docker Desktop for Windows/macOS or Docker Engine for Linux ([docker.com](https://www.docker.com/))
- **Git:** v2.40+ ([git-scm.com](https://git-scm.com/))
- **k6 (Optional for Load Testing):** v0.48+ ([k6.io](https://k6.io/))
- **MongoDB Compass / RedisInsight (Optional):** GUI tools for database and cache inspection.

---

## 2. Directory Structure Overview

The project is structured as a clean monorepo or modular full-stack repository:

```
ticketflow/
├── docs/                     # Official Project Documentation & Diagrams
│   ├── srs/                  # Software Requirements Specification (SRS.md)
│   ├── research/             # Problem Statement, Research Gap & Literature Review
│   ├── architecture/         # System Architecture & Component Specifications
│   ├── uml/                  # UML Diagrams (Use Case, Class, Sequence, Activity)
│   ├── database/             # ER Diagrams & MongoDB Schema Documentation
│   └── development/          # Setup, Rationale & Local Development Guides
├── client/                   # Next.js 19 Frontend Web Application
│   ├── src/
│   │   ├── app/              # App Router Pages (Events, Seatmap, Checkout)
│   │   ├── components/       # UI Components & Interactive Seat Visualizer
│   │   └── lib/              # Socket.io Client, API Client, State Stores
│   ├── package.json
│   └── tailwind.config.ts
├── server/                   # Node.js / Express Backend Application
│   ├── src/
│   │   ├── config/           # Database, Redis & Environment Config
│   │   ├── controllers/      # REST API Route Handlers
│   │   ├── models/           # Mongoose Database Schemas
│   │   ├── services/         # Booking, Concurrency (OCC & Redis Lock) Services
│   │   ├── sockets/          # Socket.io Gateway & Event Handlers
│   │   ├── workers/          # Background Task Consumers (RabbitMQ/Streams)
│   │   └── app.ts            # Express App & Middleware Configuration
│   ├── tests/                # Jest Unit & Integration Tests
│   └── package.json
├── docker/                   # Container Orchestration Configurations
│   ├── docker-compose.yml    # Development multi-container stack
│   ├── docker-compose.prod.yml # Horizontally scaled cluster (Nginx + 3 Node instances)
│   └── nginx/
│       └── nginx.conf        # Reverse proxy & load balancing configuration
├── tests/
│   └── load/                 # k6 & Artillery Concurrency Benchmark Scripts
├── .env.example              # Template Environment Configuration
└── README.md                 # Master Project Index
```

---

## 3. Environment Configuration

Create a `.env` file in the root directory and in the `server/` and `client/` directories based on the template below:

### Server Environment (`server/.env`)
```env
# Server Runtime
PORT=5000
NODE_ENV=development

# Database Configuration (Local Docker or MongoDB Atlas)
MONGODB_URI=mongodb://localhost:27017/ticketflow_dev

# In-Memory Cache & Distributed Lock (Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Authentication Secrets
JWT_SECRET=your_jwt_development_secret_key_minimum_32_chars
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your_refresh_token_dev_secret_key
REFRESH_TOKEN_EXPIRES_IN=7d

# Concurrency & Lock Parameters
SEAT_LOCK_TTL_SECONDS=600
LOCK_STRATEGY=REDIS_LOCK # Options: REDIS_LOCK | MONGO_OCC

# Real-Time & Queue Configuration
SOCKET_CORS_ORIGIN=http://localhost:3000
RABBITMQ_URL=amqp://localhost:5672

# Test Payment Gateway Keys (Sandbox)
STRIPE_SECRET_KEY=sk_test_placeholder_key
STRIPE_WEBHOOK_SECRET=whsec_placeholder_secret
```

### Client Environment (`client/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder_key
```

*(Note: Never commit actual secret keys or API credentials to version control. Use `.env.example` for repository templates.)*

---

## 4. Starting Infrastructure via Docker Compose

To start MongoDB, Redis, and RabbitMQ in background containers:

```bash
# From the project root:
docker-compose -f docker/docker-compose.yml up -d mongo redis rabbitmq
```

To verify container health:
```bash
docker ps
```

---

## 5. Running the Backend Server (Node.js/Express)

```bash
cd server

# Install dependencies
npm install

# Run database seed script (creates sample venue, event, and 200 seats)
npm run seed

# Start server in development mode (with hot-reloading)
npm run dev
```
The backend REST API will be accessible at: `http://localhost:5000`  
Health check endpoint: `http://localhost:5000/health`

---

## 6. Running the Frontend Application (Next.js)

```bash
cd client

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
The client application will be accessible at: `http://localhost:3000`

---

## 7. Running the Full Scaled Cluster (Semester VIII Topology)

To test the multi-instance horizontal scaling setup with Nginx load balancing:

```bash
# Start 3 Node.js API instances behind Nginx with Redis and MongoDB:
docker-compose -f docker/docker-compose.prod.yml up --build -d
```
Access the load-balanced gateway at: `http://localhost:80`

---

## 8. Running Automated Tests

### 8.1 Unit & Integration Tests (Jest)
```bash
cd server

# Run all unit test suites
npm test

# Run concurrency unit tests specifically
npm test -- tests/concurrency.test.ts

# Generate test coverage report
npm test -- --coverage
```

### 8.2 High-Concurrency Load Testing (k6)
To benchmark simultaneous booking collisions (e.g., 500 virtual users competing for the same 5 seats):

```bash
# Run the k6 concurrency collision benchmark
k6 run tests/load/concurrency-benchmark.js

# Run with varying concurrency targets
k6 run --vus 500 --duration 30s tests/load/concurrency-benchmark.js
```
The script will output:
- Total requests sent vs. processed
- Confirmation count (guaranteed strictly 5 successes)
- Conflict count (495 clean 409 responses)
- p95 and p99 latency percentiles
- Zero double-booking verification status
