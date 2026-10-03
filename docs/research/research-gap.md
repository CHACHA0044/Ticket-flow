# Problem Statement, Research Gap & Objectives
## Ticket Flow — Scalable Real-Time Event Ticket Booking System

**Project Authors:** Pranav Dembla (2300100925 / 2301888021), Sachin Gautam (2300101889 / 2301888023)  
**Supervisor:** Mohd. Anas Khan  
**Department:** Computer Science & Engineering, Integral University, Lucknow  
**Academic Year:** 2026–2027  

---

## 1. Problem Statement

### 1.1 Context and Technical Dilemma
In high-demand event ticketing systems (such as major music concerts, championship athletic events, high-profile conferences, and institutional festivals), the arrival pattern of user requests does not follow a Poisson distribution or a gradual curve. Instead, it exhibits a **"flash crowd"** or **"thundering herd"** profile—where tens of thousands of concurrent users attempt to query availability, select identical premium seats, and submit reservations within a fraction of a second when ticket sales open.

### 1.2 Core Failure Modes in Conventional Architectures
Conventional, monolithic, or naive three-tier web booking architectures exhibit severe degradation and data corruption under such load:

1. **Race Conditions and Double-Booking:**
   In basic implementations, seat reservation logic follows a non-atomic "check-then-act" sequence:
   $$\text{Step 1: Read Availability} \longrightarrow \text{Step 2: Validate Unbooked} \longrightarrow \text{Step 3: Insert / Update Booking Record}$$
   When two or more worker threads execute Step 1 concurrently before any thread completes Step 3, all threads observe the seat as available and proceed to write booking records. This produces the critical failure of **double-booking** (two distinct customers receiving confirmed reservations for the identical physical seat).

2. **Database Connection Starvation and Contention:**
   When thousands of concurrent requests bypass caching and query relational or document databases directly for live seat status, database connection pools are quickly exhausted. Row-level or collection-level lock contention leads to escalating query latency, thread blockage, and eventual cascading failure of the database server.

3. **Synchronous Processing Bottlenecks:**
   Traditional systems often execute payment verification, ticket barcode rendering, email/SMS notifications, and audit logging synchronously within the critical HTTP request-response cycle. This unnecessary coupling balloons response latency from milliseconds to tens of seconds, choking server threads and causing widespread client timeouts (HTTP 504).

4. **Stale State and Poor User Experience:**
   Without real-time state synchronization, users frequently spend minutes selecting seats that have already been locked or booked by other users, resulting in friction, frustration, and high abandonment rates during checkout.

---

## 2. Research Gap

While commercial enterprise platforms (e.g., Ticketmaster, BookMyShow) employ sophisticated, proprietary distributed infrastructures, many open-source implementations, academic prototypes, and mid-tier ticketing systems suffer from a clear **systematic design gap**:

### 2.1 Lack of Comparative Concurrency Evaluation
Many basic implementations rely either exclusively on relational database ACID transactions or on basic optimistic locks without benchmarking the precise performance trade-offs under high thread contention. There is a lack of rigorous, empirical comparison between:
- **Database-Level Optimistic Concurrency Control (OCC):** Low lock acquisition overhead, but high transaction abort/retry frequency under severe contention.
- **In-Memory Distributed Mutual Exclusion (Redis Key Locking / Redlock):** Fast atomic acquisition in memory, offloading the primary database, but introducing distributed lock leasing, clock skew considerations, and lock release reliability constraints.

### 2.2 Fragmented Architectural Solutions
Existing academic literature and prototype systems often address isolated concerns—focusing solely on database indexing, purely on WebSocket communication, or in isolation on queue management. However, solving high-concurrency ticket reservations requires an **integrated multi-tier pipeline** combining:
1. Concurrency-safe atomic seat allocation (zero double-booking).
2. Distributed lock management with strict TTL auto-expiration.
3. Multi-node WebSocket state synchronization (via Redis Pub/Sub adapters).
4. Multi-tier read caching to shield the persistent database.
5. Virtual waiting-room queuing for traffic shaping and controlled ingress rate.
6. Asynchronous event-driven task execution for secondary workflows.
7. Measurable, reproducible performance benchmarking under synthetic load.

### 2.3 Research Positioning
*Ticket Flow* does not claim that existing commercial systems universally fail, but investigates and formalizes an open, reproducible, and benchmarked reference architecture tailored for scalable, real-time seat reservation. This project bridges the gap between theoretical distributed systems principles and pragmatic web-scale engineering.

---

## 3. Research Questions

To guide the technical investigation and benchmarking methodology, this project formulates five central research questions:

1. **RQ1 (Data Consistency):** How can concurrent seat booking requests be coordinated across distributed Node.js application instances to mathematically guarantee zero double-booking under extreme contention ($>1,000\text{ concurrent requests per seat}$)?
2. **RQ2 (Comparative Locking Performance):** What are the measurable performance trade-offs (throughput in RPS, p95/p99 latency, database CPU consumption, and abort rates) between Database-Level Optimistic Concurrency Control (OCC) and In-Memory Redis Distributed Locking?
3. **RQ3 (Read Scalability & Caching):** To what degree does a multi-tier Redis caching strategy (caching seat maps and event metadata) reduce persistent database load and improve client response times during flash-crowd catalog queries?
4. **RQ4 (Traffic Shaping via Queues):** How effectively does an ingress virtual waiting room (FIFO queue with controlled admission rate) prevent downstream server saturation and maintain predictable sub-second response times during extreme traffic spikes?
5. **RQ5 (Horizontal Scalability):** How linearly does system throughput scale when adding stateless backend application containers behind an Nginx reverse proxy while coordinating state over Redis and MongoDB?

---

## 4. Expected Technical Contributions

The expected deliverables and technical contributions of this project encompass:

1. **Formal Concurrency-Safe Architecture:** A fully documented, modular architecture featuring dual locking implementations (OCC in MongoDB and Distributed Key Locking in Redis) with strict TTL-based auto-release mechanisms to eliminate deadlocks and orphan holds.
2. **Empirical Benchmarking Dataset:** Quantitative experimental data gathered using k6 and Artillery under varying concurrency levels (100 to 2,000 virtual users), evaluating latency percentiles, throughput curves, and failure rates between locking paradigms.
3. **Scalable Real-Time Event Pipeline:** An integrated WebSocket layer using Socket.io and `@socket.io/redis-adapter` enabling real-time seat map state synchronization across horizontally distributed server instances within $<100\text{ ms}$.
4. **Virtual Waiting Room & Asynchronous Workflow Engine:** A resilient traffic-shaping queue mechanism combined with decoupled background workers (RabbitMQ / Redis Streams) for processing post-booking operations (receipts, notifications) without blocking the user-facing booking loop.
5. **Comprehensive Open-Source Reference Implementation:** A production-ready, Dockerized repository adhering to modern software engineering standards, serving as an educational and technical benchmark for distributed systems and full-stack engineering.
