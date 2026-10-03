# Software Requirements Specification (SRS)
## Ticket Flow — Scalable Real-Time Event Ticket Booking System

**Academic Year:** 2026–2027  
**Degree:** Bachelor of Technology in Computer Science & Engineering  
**Institution:** Integral University, Lucknow  
**Supervisor:** Mohd. Anas Khan  
**Authors:** Pranav Dembla (2300100925 / 2301888021), Sachin Gautam (2300101889 / 2301888023)  
**Document Version:** 1.0.0  
**Status:** Approved Technical Specification  

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to provide a comprehensive Software Requirements Specification (SRS) for **Ticket Flow — Scalable Real-Time Event Ticket Booking System**. This document defines the functional and non-functional requirements, system constraints, interface requirements, architectural boundaries, and acceptance criteria for both Semester VII and Semester VIII development phases.

### 1.2 Project Scope
Ticket Flow is an enterprise-grade, distributed web platform designed to solve the critical challenges of high-concurrency ticket reservations for large-scale events (concerts, sporting matches, conferences, and festivals). The system addresses data inconsistency, race conditions, double-booking phenomena, and database connection exhaustion under flash-crowd traffic surges.

- **Semester VII Focus:** Core requirement analysis, system architecture, database schema design, base booking API implementation, concurrency control mechanisms (comparing Database Optimistic Concurrency Control vs. Redis Distributed Locking), and initial concurrency benchmarking.
- **Semester VIII Focus:** Live seat map broadcasting via WebSockets (Socket.io), multi-tier Redis caching, virtual waiting-room queue system (RabbitMQ / Redis Streams), asynchronous background task workers, horizontal container scaling with Nginx load balancing, and comprehensive stress testing (k6/Artillery).
- **Out of Scope:** Live financial transaction settlements (restricted to sandbox/test payment gateways), native mobile applications (iOS/Android), automated seat recommendation ML pipelines (reserved as an optional future enhancement), and multi-region active-active database replication.

### 1.3 Intended Audience
- **Project Supervisor & Evaluation Committee:** For academic assessment, verification against syllabus milestones, and validation of engineering rigor.
- **Development Team:** As the authoritative specification for component contracts, data formats, concurrency handling, and API endpoints.
- **Quality Assurance / Testers:** For drafting automated test cases (Jest), integration test suites, and load test scripts (k6/Artillery).

### 1.4 Definitions, Acronyms, and Terminology
| Term | Definition |
| :--- | :--- |
| **Double-Booking** | A failure mode where two or more distinct users are allocated and confirmed for the exact same physical or virtual seat. |
| **OCC** | Optimistic Concurrency Control — a database concurrency strategy using version numbers or conditional updates (`findAndModify`) without prolonged locking. |
| **Pessimistic / Distributed Lock** | A mutual exclusion lock acquired across distributed workers (via Redis atomic primitives like `SET NX PX` or Redlock) to protect critical sections. |
| **TTL** | Time-To-Live — the expiration timeframe assigned to temporary seat reservations (e.g., 5 to 10 minutes) before automatic release. |
| **Flash Crowd** | An extreme surge in simultaneous incoming user requests occurring precisely at ticket release time. |
| **Waiting Room / Virtual Queue** | A traffic-shaping mechanism buffering excess user requests and admitting them sequentially at a controlled throughput rate. |
| **Idempotency** | The property of an operation whereby multiple identical requests produce the identical state without side effects. |

---

## 2. Overall Description

### 2.1 Product Perspective
Ticket Flow operates as a modern multi-tier, distributed web application. It transitions traditional monolithic, synchronous booking systems into an event-driven, horizontally scalable architecture.

```
+-------------------------------------------------------------------------+
|                              Client Layer                               |
|         (Next.js / React 19 / TypeScript / Tailwind CSS Web App)         |
+-------------------------------------------------------------------------+
                                     |
                       [ HTTPS / WSS / REST APIs ]
                                     v
+-------------------------------------------------------------------------+
|                           Load Balancer Layer                           |
|                         (Nginx Reverse Proxy)                           |
+-------------------------------------------------------------------------+
                                     |
                +--------------------+--------------------+
                |                                         |
                v                                         v
+--------------------------------+       +--------------------------------+
|      Node.js/Express App       |  ...  |      Node.js/Express App       |
|          (Instance 1)          |       |          (Instance N)          |
+--------------------------------+       +--------------------------------+
                |                                         |
    +-----------+--------------------+--------------------+-----------+
    |                                |                                |
    v                                v                                v
+----------------------+   +----------------------+   +----------------------+
|    Redis Cluster     |   |   MongoDB Primary    |   |  Message Broker /    |
| - Distributed Lock   |   | - Relational-like    |   |  Queue               |
| - Seat State Cache   |   |   Document Storage   |   | (RabbitMQ / Streams) |
| - Socket.io Adapter  |   | - Acid Transactions  |   | - Async Workers      |
+----------------------+   +----------------------+   +----------------------+
```

### 2.2 Major System Functions
1. **User Identity & Access Management:** Secure token-based authentication and role-based access control (Customers vs. Event Administrators).
2. **Event & Inventory Catalog:** Comprehensive management of venues, seating tiers, pricing rules, and schedule lifecycles.
3. **Real-Time Seat Visualizer:** Interactive dynamic seat map displaying live seat states (Available, Reserved/Locked, Booked, Held).
4. **Concurrency-Guarded Booking Engine:** High-performance reservation pipeline with strict atomic seat allocation preventing concurrent collisions.
5. **Virtual Waiting Room & Traffic Shaper:** Queuing ingress traffic during flash sales to prevent downstream database saturation.
6. **Asynchronous Booking Finalizer:** Offloading payment confirmation, ticket barcode generation, and notifications to decoupled workers.

### 2.3 User Classes and Characteristics
- **Standard Customer:** End-users browsing events, selecting seats on interactive maps, queueing for high-demand sales, and completing bookings.
- **Event Organizer / Administrator:** Privileged users who configure venues, define seat layouts, set ticket tiers/pricing, monitor real-time booking rates, and manage cancellations.
- **System Maintenance / Auditor:** Operators monitoring server health, queue backlogs, lock metrics, and benchmark telemetry.

### 2.4 Operating Environment
- **Server OS:** Linux (Ubuntu 22.04 LTS / Debian 12) or Windows container environment.
- **Runtime:** Node.js LTS (v20.x or v22.x).
- **Client Platforms:** Modern evergreen web browsers (Chrome, Firefox, Edge, Safari) supporting WebSockets, HTML5 Canvas/SVG, and ES2022+.
- **Database Engine:** MongoDB Community/Atlas v7.0+.
- **In-Memory Store:** Redis v7.2+.
- **Message Broker:** RabbitMQ v3.12+ or Redis Streams.
- **Container Infrastructure:** Docker Engine v24+ with Docker Compose v2+.

### 2.5 Constraints
- **Financial Compliance:** Payment gateway integration is strictly scoped to Sandbox/Test mode (Stripe / Razorpay API simulation); no actual credit card data is stored or processed.
- **Network Boundaries:** Local and single-cluster containerized deployment for development and academic demonstration; multi-region data replication is outside the current scope.
- **Hardware Limitations:** Optimized to run within standard development hardware (min 8 GB RAM, multi-core x86_64 CPU).

### 2.6 Assumptions and Dependencies
- Network connectivity remains stable between frontend clients and the reverse proxy.
- Redis is configured with persistence (AOF/RDB) or operates in high-availability mode to prevent volatile lock loss during runtime.
- System clocks across Node.js instances and the Redis server are synchronized via NTP to avoid lock lease time skews.

---

## 3. Functional Requirements

### 3.1 Module A: User Authentication & Profile (FR-AUTH)
- **`FR-AUTH-01` Registration:** The system shall allow users to register with full name, unique email address, password (minimum 8 characters, hashed using bcrypt with work factor $\ge 10$), and optional phone number.
- **`FR-AUTH-02` Login & Authentication:** The system shall authenticate credentials and issue stateless, signed JSON Web Tokens (JWT) containing user ID, role, and standard expiration claims.
- **`FR-AUTH-03` Role-Based Access Control:** The system shall enforce role segregation (`CUSTOMER`, `ADMIN`) across all protected endpoints.
- **`FR-AUTH-04` Token Refresh & Expiry:** The system shall support short-lived Access Tokens (15–30 minutes) and secure HTTP-Only Refresh Tokens (7 days).
- **`FR-AUTH-05` Profile & History Retrieval:** Authenticated users shall be able to view their profile metadata and complete historical booking records.

### 3.2 Module B: Event & Venue Management (FR-EVENT)
- **`FR-EVENT-01` Event Creation (Admin):** Admins shall create events specifying title, description, category, venue layout reference, start/end timestamps, ticket pricing tiers, and booking launch windows.
- **`FR-EVENT-02` Event Update & Lifecycle:** Admins shall be able to update event metadata, mark events as `DRAFT`, `PUBLISHED`, `SALES_OPEN`, `SALES_CLOSED`, or `CANCELLED`.
- **`FR-EVENT-03` Public Event Catalog:** The system shall display published events with search, category filtering, date sorting, and pagination.
- **`FR-EVENT-04` Event Detail & Pricing Inspection:** Users shall retrieve detailed event information, including venue location, seating categories (VIP, Gold, General), and pricing matrix.

### 3.3 Module C: Seat Management & State Model (FR-SEAT)
- **`FR-SEAT-01` Venue Layout Schema:** The system shall support grid-based or sectional venue seat layouts (Section, Row, Number, Category).
- **`FR-SEAT-02` Seat State Definition:** Every individual seat shall reside in exactly one of the following states:
  - `AVAILABLE`: Unoccupied, ready for reservation.
  - `LOCKED` / `HELD`: Temporarily reserved by a specific user with an active TTL timer (e.g., 5–10 minutes).
  - `BOOKED`: Permanently sold and associated with a confirmed booking.
  - `BLOCKED`: Administratively unavailable (maintenance or VIP hold).
- **`FR-SEAT-03` Live Availability Query:** Clients shall query the current availability map for a specific event with sub-50ms response times (served from Redis cache when enabled).

```
 +-------------+       User Selects Seat       +---------------+
 |             | ----------------------------> |               |
 |  AVAILABLE  |                               |    LOCKED     |
 |             | <---------------------------- | (TTL Active)  |
 +-------------+   Lock Expires / User Cancels +---------------+
        ^                                              |
        |                                              | Payment Successful
        | Booking Cancelled / Refunded                 v
 +-------------+                               +---------------+
 |             | <---------------------------- |               |
 |   BLOCKED   |                               |    BOOKED     |
 |             |                               | (Confirmed)   |
 +-------------+                               +---------------+
```

### 3.4 Module D: Core Booking Engine (FR-BOOK)
- **`FR-BOOK-01` Booking Attempt Creation:** An authenticated user can submit a reservation request for one or more seats (max 6 seats per transaction).
- **`FR-BOOK-02` Temporary Reservation (Seat Hold):** Upon successful lock acquisition, the system transitions seats to `LOCKED` state, associates them with a `bookingId` in `PENDING` state, and returns a checkout countdown timer.
- **`FR-BOOK-03` Automatic Lock Expiry:** If the user fails to complete checkout within the TTL window (e.g., 600 seconds), background workers or Redis key expiration notifications shall automatically revert seats to `AVAILABLE` and mark the pending booking `EXPIRED`.
- **`FR-BOOK-04` Payment Completion & Confirmation:** Upon receiving a successful payment webhook or test payment submission, the system transitions the booking to `CONFIRMED`, marks seats permanently as `BOOKED`, and generates unique verifiable ticket tokens.
- **`FR-BOOK-05` Booking Failure & Release:** If payment fails or is rejected by the user, the lock must be immediately released back to `AVAILABLE`.
- **`FR-BOOK-06` Booking Cancellation:** Customers or Admins may cancel bookings according to event policies, triggering seat release back to `AVAILABLE`.

### 3.5 Module E: Concurrency Control & Double-Booking Prevention (FR-CONC)
*(Core Technical Focus for Semester VII)*
- **`FR-CONC-01` Race Condition Elimination:** The system must guarantee that under $N$ simultaneous requests ($N \ge 1,000$) for the exact same seat, strictly **one** request succeeds, while all other $N-1$ requests receive a clean rejection (`409 Conflict` or queue notice) without data corruption.
- **`FR-CONC-02` Optimistic Concurrency Control (OCC) Implementation:** The system shall implement an OCC mechanism in MongoDB using conditional atomic operations (e.g., `findOneAndUpdate({ _id: seatId, status: 'AVAILABLE', version: v }, { $set: { status: 'LOCKED' }, $inc: { version: 1 } })`).
- **`FR-CONC-03` Redis Distributed Locking (Pessimistic/Key-Based):** The system shall implement distributed locking using atomic Redis commands:
  ```
  SET lock:event:<eventId>:seat:<seatId> <userId_bookingId> NX PX <lockTTL_ms>
  ```
  With release handled via an atomic Lua script verifying ownership before deletion.
- **`FR-CONC-04` Comparative Benchmarking Pipeline:** The system shall provide structured harness scripts (via k6/Artillery) to benchmark OCC vs. Redis Locking across throughput (RPS), p95/p99 latency, database CPU utilization, and error rates.

### 3.6 Module F: Real-Time Updates & Broadcasting (FR-RT)
*(Semester VIII Feature)*
- **`FR-RT-01` WebSocket Connectivity:** The backend shall establish persistent WebSocket connections (Socket.io) with client browsers on event detail pages.
- **`FR-RT-02` Room-Based Event Subscriptions:** Clients automatically join rooms corresponding to specific event IDs (`event:<eventId>`).
- **`FR-RT-03` Granular State Broadcasts:** When a seat transitions (`AVAILABLE` $\to$ `LOCKED` $\to$ `BOOKED` $\to$ `AVAILABLE`), a minimal JSON payload (`{ eventId, seatId, status, timestamp }`) is broadcast to all active room subscribers within $<100\text{ ms}$.
- **`FR-RT-04` Multi-Node Redis Pub/Sub Adapter:** To support horizontal scaling across multiple Node.js instances, Socket.io will use the `@socket.io/redis-adapter` to distribute broadcast events seamlessly across all server instances.

### 3.7 Module G: Virtual Waiting Room / Queue (FR-QUEUE)
*(Semester VIII Feature)*
- **`FR-QUEUE-01` High-Demand Traffic Detection:** When incoming request rates for a specific event exceed a configurable threshold (e.g., 500 RPS), new users are redirected to a virtual waiting room.
- **`FR-QUEUE-02` Fair Sequential Admission:** The queue maintains FIFO ordering using Redis Sorted Sets (`ZADD` with timestamps) or RabbitMQ queues.
- **`FR-QUEUE-03` Live Queue Position Polling/Push:** Queued clients receive periodic position updates and estimated wait times.
- **`FR-QUEUE-04` Controlled Admission Token:** Admitted users receive a cryptographically signed, short-lived Admission Token allowing them to access the seat selection screen.

### 3.8 Module H: Multi-Tier Caching (FR-CACHE)
*(Semester VIII Feature)*
- **`FR-CACHE-01` Event Catalog Caching:** Static event metadata and venue configurations are cached in Redis with a configurable TTL (e.g., 10 minutes) and invalidated on Admin updates.
- **`FR-CACHE-02` Dynamic Seat Availability Bitmaps/Hashes:** Event seat availability maps are cached in Redis (using Redis Hashes or Bitmaps) to serve read queries without touching MongoDB.
- **`FR-CACHE-03` Write-Through / Invalidation Strategy:** Any confirmed state change updates both Redis cache and MongoDB atomically or via cache invalidation events.

### 3.9 Module I: Administrative Monitoring & Oversight (FR-ADMIN)
- **`FR-ADMIN-01` Event Analytics Dashboard:** Admins shall view real-time metrics including total tickets sold, current locked seats, revenue generated, and active concurrent viewers.
- **`FR-ADMIN-02` Manual Seat Override:** Admins can manually release stuck locks or block seats for operational needs.
- **`FR-ADMIN-03` System Health Telemetry:** Exposed `/health` and `/metrics` endpoints reporting Node.js event loop lag, Redis latency, database connection pool status, and queue depth.

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements (NFR-PERF)
- **`NFR-PERF-01` Read Latency:** Event listings and cached seat availability maps shall return responses in $<50\text{ ms}$ at 95th percentile under normal load.
- **`NFR-PERF-02` Booking Execution Latency:** End-to-end seat lock acquisition shall complete in $<150\text{ ms}$ under concurrent load.
- **`NFR-PERF-03` Throughput:** The multi-instance cluster shall sustain $\ge 1,000$ concurrent booking requests per second without system failure or uncontrolled queue growth.

### 4.2 Scalability (NFR-SCALE)
- **`NFR-SCALE-01` Horizontal Stateless Scaling:** The Node.js application layer must remain completely stateless, allowing linear horizontal scaling from 1 to $N$ container instances behind Nginx.
- **`NFR-SCALE-02` Database Connection Management:** MongoDB and Redis connection pools must be tuned to prevent socket starvation across distributed instances.

### 4.3 Reliability & Fault Tolerance (NFR-REL)
- **`NFR-REL-01` Zero Double-Booking Guarantee:** The system must achieve a $0.00\%$ double-booking rate under all stress-test scenarios.
- **`NFR-REL-02` Deadlock Prevention:** All lock operations must include mandatory TTL expirations to prevent permanent seat deadlocks in case of client or server crashes.
- **`NFR-REL-03` Graceful Degradation:** If Redis cache fails, the system must fall back to database-level OCC, logging an alert while continuing operation at reduced throughput.

### 4.4 Consistency & ACID Compliance (NFR-CONS)
- **`NFR-CONS-01` Strong Consistency for Allocations:** Final ticket purchase and seat state updates must adhere to strict transactional consistency (MongoDB Multi-Document ACID Transactions where appropriate).
- **`NFR-CONS-02` Eventual Consistency for Telemetry:** Analytics, notification emails, and audit logs may process with eventual consistency via message queues.

### 4.5 Security Requirements (NFR-SEC)
- **`NFR-SEC-01` Transport Layer Security:** All HTTP and WebSocket communications shall run over HTTPS/WSS in production/staging.
- **`NFR-SEC-02` Password Security:** User passwords must be salted and hashed using bcrypt; plain text passwords must never be logged or persisted.
- **`NFR-SEC-03` Injection & XSS Protection:** Input validation via schemas (Zod/Joi), parameterized database queries, and sanitized output headers (Helmet middleware).
- **`NFR-SEC-04` Rate Limiting:** Rate limiting on authentication (`/api/auth/*`) and booking endpoints (`/api/bookings/*`) to prevent brute-force attacks and bot flooding.

### 4.6 Maintainability & Usability (NFR-MAINT)
- **`NFR-MAINT-01` Modular Architecture:** Strict separation of concerns (Controllers, Services, Repositories, Queue Workers).
- **`NFR-MAINT-02` Containerized Development:** The complete local development environment (Node, Mongo, Redis, Nginx, Queue) must start with a single `docker-compose up` command.
- **`NFR-MAINT-03` Usability:** The web UI must provide clear visual feedback for seat state changes, countdown timers, and intuitive error messages when seats are lost to competing buyers.

---

## 5. System Constraints & Boundary Conditions

1. **Academic Project Scope:** Development is divided strictly between Semester VII (Core Concurrency & Base Engine) and Semester VIII (Real-Time Scaling & Waiting Room).
2. **Resource Constraints:** Designed to operate locally on developer workstations (8–16 GB RAM) via Docker Compose resource limits (`cpus: "1.0"`, `memory: 512M` per Node instance).
3. **Third-Party Service Decoupling:** External dependencies (payment gateways, SMS/email senders) must be abstracted with mockable adapters to allow offline evaluation.

---

## 6. External Interface Requirements

### 6.1 User Interfaces
- **Customer Web Portal:** Responsive Single-Page Application (Next.js) supporting interactive SVG/Canvas seat maps, color-coded seat tiers, and checkout modals.
- **Admin Management Console:** Secure dashboard for inventory creation, venue designer, and real-time live-traffic monitoring.

### 6.2 Software Interfaces
- **Database Engine:** MongoDB via Mongoose ORM / native MongoDB driver.
- **Cache & Lock Store:** Redis via `ioredis` client with cluster and Pub/Sub support.
- **Message Broker:** RabbitMQ via `amqplib` or Redis Streams client.
- **Payment Sandbox:** REST APIs and Webhook endpoints matching Stripe / Razorpay standard payload schemas.

### 6.3 Communication Protocols
- **Client-Server REST:** JSON over HTTP/1.1 and HTTP/2.
- **Real-Time Layer:** Engine.IO / WebSocket protocol via Socket.io.
- **Inter-Service Coordination:** Redis Pub/Sub channels and AMQP 0-9-1.

---

## 7. Semester Breakdown & Milestone Mapping

| Phase | Milestone | Scope & Deliverables | Verification Strategy |
| :--- | :--- | :--- | :--- |
| **Semester VII** | **M1: Requirements & Design** | Complete SRS, Literature Review, UML & ER Models, Architecture Specification | Supervisor Review & PQAC Submission |
| | **M2: Base Engine & Data Layer** | MongoDB schemas, Seed Data, REST APIs for Auth, Events, and Seats | Unit Tests (Jest), Postman API Collections |
| | **M3: Concurrency Engine (OCC vs. Redis)** | MongoDB OCC conditional updates, Redis distributed lock (`SET NX PX` + Lua release), Base booking endpoint | Concurrency Unit/Integration Tests |
| | **M4: Concurrency Benchmarking** | k6 / Artillery scripts testing simultaneous booking collisions; metrics comparison report | Concurrency benchmarks under 100–1,000 concurrent threads |
| **Semester VIII** | **M5: Real-Time WebSocket Layer** | Socket.io server, Redis Pub/Sub adapter, live seat map UI integration | Multi-browser visual tests, latency telemetry |
| | **M6: Caching & Virtual Waiting Room** | Redis seat-map caching, FIFO virtual queue for flash-sale traffic shaping | Queue simulation scripts, cache hit/miss tests |
| | **M7: Scaling & Async Processing** | RabbitMQ / Redis Streams async booking workers, Nginx load-balanced Docker cluster | Cluster load testing (k6), error rate analysis |
| | **M8: Final Evaluation & Report** | End-to-end system evaluation, final project report, research paper submission, viva defense | Comprehensive test harness & project demonstration |

---

## 8. Acceptance Criteria

1. **Correctness Under Concurrency:** When 500 concurrent virtual users attempt to book the exact same single seat at $t = 0$, exactly 1 user must receive `201 Created` with a valid reservation, and 499 users must receive `409 Conflict` or graceful failure responses. No database corruption or orphan locks shall exist.
2. **Lock Expiry Resilience:** A locked seat left unpaid must automatically return to `AVAILABLE` status within $\pm 2$ seconds of TTL expiration, enabling other users to book it immediately.
3. **Response Times:** 95% of cached read requests must be served in $<50\text{ ms}$; lock acquisition requests must complete in $<150\text{ ms}$.
4. **Clean Code & Architecture:** Strict separation between business logic, data access, and transport layers, verified by automated Jest unit test suites ($>80\%$ coverage for concurrency modules).
