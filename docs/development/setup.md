# Technology Stack & Architecture Rationale
## Ticket Flow — Scalable Real-Time Event Ticket Booking System

**Project Authors:** Pranav Dembla (2300100925 / 2301888021), Sachin Gautam (2300101889 / 2301888023)  
**Supervisor:** Mohd. Anas Khan  
**Department:** Computer Science & Engineering, Integral University, Lucknow  
**Academic Year:** 2026–2027  

---

## 1. Technology Selection Matrix & Semester Mapping

| Component / Layer | Technology | Primary Responsibility | Semester Scope | Justification & Rationale |
| :--- | :--- | :--- | :---: | :--- |
| **Frontend Framework** | **Next.js (React 19)** | Server-rendered pages, interactive client state, responsive UI routing | S7 & S8 | Industry-standard React framework offering hybrid SSR/SSG for SEO-friendly event listings and fast client hydration. |
| **Language** | **TypeScript** | End-to-end type safety, domain model interfaces, compiler-enforced contracts | S7 & S8 | Eliminates runtime type errors across complex booking payloads and provides strict schema consistency. |
| **Styling & UI** | **Tailwind CSS** | Utility-first responsive design, modern dark/light themes, dynamic seat grid styling | S7 & S8 | Fast styling workflow with zero runtime CSS overhead and seamless responsive layouts. |
| **Backend Runtime** | **Node.js (v20+ LTS)** | Non-blocking asynchronous I/O runtime | S7 & S8 | High-throughput asynchronous event loop well suited for handling thousands of concurrent I/O-bound booking requests. |
| **Web Framework** | **Express.js** | Modular REST API routing, middleware pipeline, JWT validation, error handling | S7 & S8 | Minimalist, unopinionated framework with vast ecosystem support and low CPU overhead. |
| **Primary Database** | **MongoDB (v7.0+)** | Persistent system of record for users, venues, events, seats, and bookings | S7 & S8 | Flexible document model for seating topologies; single-document atomic operators (`findOneAndUpdate`) and multi-document ACID transactions. |
| **In-Memory Store** | **Redis (v7.2+)** | Distributed locking, sub-millisecond seat caching, pub/sub coordination | S7 (Locking)<br>S8 (Caching/Queue) | Single-threaded atomic command execution (`SET NX PX`, Lua scripts, Redis Hashes) essential for microsecond concurrency coordination. |
| **Real-Time Layer** | **Socket.io** | Bi-directional WebSocket communication for live seat status broadcasting | S8 | Robust WebSocket engine with room abstractions, automatic reconnection, and multi-node broadcast capabilities. |
| **WebSocket Broker** | **`@socket.io/redis-adapter`** | Distributing WebSocket broadcasts across multiple scaled Node.js instances | S8 | Bridges WebSocket instances via Redis Pub/Sub, preventing state silos in clustered deployments. |
| **Message Broker** | **RabbitMQ / Redis Streams** | Asynchronous task queue for email confirmations, barcode generation, and metrics | S8 | Decouples the critical payment/booking HTTP path from slow background side-effects. |
| **Reverse Proxy & LB** | **Nginx** | Layer-7 reverse proxy, SSL termination, static caching, round-robin load balancing | S8 | High-performance reverse proxy distributing client traffic across containerized Node.js application replicas. |
| **Containerization** | **Docker & Docker Compose** | Multi-container environment orchestration (Node instances, Mongo, Redis, Nginx) | S7 (Dev)<br>S8 (Cluster) | Ensures deterministic, reproducible local and staging environments across all developer workstations. |
| **Unit & Integration Test**| **Jest & Supertest** | Automated unit testing of locking algorithms, API endpoints, and validation rules | S7 & S8 | High-speed JavaScript test runner with mock capabilities and code coverage reporting. |
| **Load & Stress Testing** | **k6 & Artillery** | Scriptable high-concurrency synthetic load generation, race condition testing | S7 (Benchmarking)<br>S8 (Scale Testing) | Modern performance testing tools capable of executing hundreds of concurrent threads to evaluate locking strategies and RPS throughput. |
| **Payment Simulation** | **Stripe / Razorpay (Test Mode)** | Webhook simulation, test card payment tokenization | S7 (Mock)<br>S8 (Integration) | Industry-standard payment APIs providing realistic checkout workflows without financial liability. |
| **Version Control** | **Git & GitHub** | Source code management, branch protection, CI/CD pipeline automation | S7 & S8 | Collaborative version control tracking fortnightly progress against academic milestones. |

---

## 2. Detailed Technical Responsibilities

### 2.1 Concurrency & Locking Layer (Semester VII Priority)
- **Redis Lock Service:** Implements the `acquireLock(seatId, userId, ttlMs)` and `releaseLock(seatId, token)` functions using atomic commands and Lua scripts.
- **Optimistic Concurrency Control Service:** Implements version-checked database updates as a comparative baseline.
- **Benchmark Suite:** Automated scripts in `tests/concurrency/` simulating $N$ concurrent users attempting to acquire the same seat, measuring latency and conflict rates.

### 2.2 Real-Time & Caching Layer (Semester VIII Priority)
- **Real-Time Seat Broadcaster:** Socket.io gateway pushing state changes to rooms keyed by `event:<eventId>`.
- **Cache-Aside & Write-Through Layer:** Interceptor populating Redis seat maps and invalidating cache on confirmed booking transactions.
- **Virtual Waiting Room:** Priority queue evaluating ingress traffic and issuing time-limited admission passes.
- **Async Queue Consumer:** Background daemon consuming booking events to render PDF tickets and dispatch mock SMTP emails.
