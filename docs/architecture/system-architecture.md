# System Architecture Specification
## Ticket Flow — Scalable Real-Time Event Ticket Booking System

**Project Authors:** Pranav Dembla (2300100925 / 2301888021), Sachin Gautam (2300101889 / 2301888023)  
**Supervisor:** Mohd. Anas Khan  
**Department:** Computer Science & Engineering, Integral University, Lucknow  
**Academic Year:** 2026–2027  

---

## 1. High-Level Architecture Overview

Ticket Flow is architected as a decoupled, multi-tier distributed system designed for high availability, fault tolerance, and sub-millisecond atomic concurrency control under flash-crowd conditions.

```mermaid
flowchart TB
    subgraph Client_Layer ["Client Layer (Web Application)"]
        UserBrowser["User Web Browser (Next.js / React / TypeScript / Tailwind CSS)"]
        AdminBrowser["Admin Dashboard (Next.js / Tailwind CSS)"]
    end

    subgraph Ingress_Layer ["Load Balancing & Ingress Layer"]
        NginxLB["Nginx Reverse Proxy & Load Balancer\n(Round Robin / Least Connections)"]
    end

    subgraph App_Tier ["Stateless Application Tier (Horizontally Scaled)"]
        Node1["Node.js / Express Instance 1\n(REST API + Socket.io Server)"]
        Node2["Node.js / Express Instance 2\n(REST API + Socket.io Server)"]
        NodeN["Node.js / Express Instance N\n(REST API + Socket.io Server)"]
    end

    subgraph Coordination_Layer ["In-Memory Coordination & Caching Tier (Redis)"]
        RedisLock["Distributed Lock Manager\n(Atomic SET NX PX + Lua Scripts)"]
        RedisCache["Cache Layer\n(Event Metadata + Seat Availability Hashes)"]
        RedisPubSub["Redis Pub/Sub\n(@socket.io/redis-adapter Cross-Node Sync)"]
        RedisQueue["Virtual Waiting Room Queue\n(Redis Sorted Sets / ZADD)"]
    end

    subgraph Async_Worker_Layer ["Asynchronous Processing Layer (Semester VIII)"]
        MsgBroker["Message Broker\n(RabbitMQ / Redis Streams)"]
        WorkerPool["Background Worker Pool\n(Async Ticket Generator / Email Dispatcher)"]
    end

    subgraph Persistence_Layer ["Persistent Storage Layer"]
        MongoDB[("MongoDB Database\n- Users, Events, Venues\n- Seats, Bookings, Payments\n- ACID Multi-Document Transactions")]
    end

    subgraph External_Services ["External & Sandbox Integrations"]
        PaymentGateway["Payment Gateway Sandbox\n(Stripe / Razorpay Test Mode)"]
        EmailService["Notification Dispatcher\n(SMTP / Mock Email Service)"]
    end

    UserBrowser -->|HTTPS REST Requests| NginxLB
    AdminBrowser -->|HTTPS REST Requests| NginxLB
    UserBrowser <-->|WebSocket Persistent Conn| NginxLB

    NginxLB --> Node1
    NginxLB --> Node2
    NginxLB --> NodeN

    Node1 <--> RedisLock
    Node1 <--> RedisCache
    Node1 <--> RedisPubSub
    Node1 <--> RedisQueue
    Node2 <--> RedisLock
    Node2 <--> RedisCache
    Node2 <--> RedisPubSub
    Node2 <--> RedisQueue
    NodeN <--> RedisLock
    NodeN <--> RedisCache
    NodeN <--> RedisPubSub
    NodeN <--> RedisQueue

    Node1 --> MongoDB
    Node2 --> MongoDB
    NodeN --> MongoDB

    Node1 -->|Publish Async Task| MsgBroker
    Node2 -->|Publish Async Task| MsgBroker
    NodeN -->|Publish Async Task| MsgBroker

    MsgBroker --> WorkerPool
    WorkerPool --> MongoDB
    WorkerPool --> EmailService
    Node1 <--> PaymentGateway
    Node2 <--> PaymentGateway
```

---

## 2. Semester Scope Breakdown

### 2.1 Semester VII Architecture (Core Concurrency & Baseline Engine)
The Semester VII implementation is focused on solving and evaluating the concurrency challenge:
- **Client Tier:** Initial Next.js client for user authentication, event browsing, and seat booking.
- **Application Tier:** Single to dual Node.js/Express instance executing REST endpoints.
- **Persistence Tier:** MongoDB schema holding users, events, seats, and bookings with single-document atomicity and indexing.
- **Concurrency Tier:** 
  - **Mechanism A (Baseline):** Database-level Optimistic Concurrency Control (OCC) using versioned fields and conditional MongoDB update queries.
  - **Mechanism B (Proposed):** Redis Distributed Locking using atomic `SET NX PX` and Lua-script release mechanisms.
- **Benchmarking Suite:** Automated k6 / Artillery scripts generating high-concurrency seat collision workloads to compare OCC vs. Redis Locking.

### 2.2 Semester VIII Architecture (Scalability, Real-Time & Traffic Shaping)
The Semester VIII implementation builds upon the verified concurrency core:
- **WebSocket Synchronization:** Integration of Socket.io and `@socket.io/redis-adapter` for broadcasting live seat map status across horizontally scaled nodes.
- **Multi-Tier Caching:** Redis caching for event catalog and seat state bitfields/hashes, reducing read load on MongoDB by up to 90%.
- **Virtual Waiting Room:** Fair FIFO rate-limiting queue using Redis Sorted Sets to manage flash crowds before entering the seat-selection flow.
- **Asynchronous Task Workers:** Decoupled background processing using RabbitMQ / Redis Streams for non-blocking invoice creation, email notifications, and analytics.
- **Multi-Container Cluster:** Production-grade Docker Compose architecture with Nginx load balancing and stress testing.

---

## 3. Detailed Component Interaction & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer Client
    participant Nginx as Nginx Load Balancer
    participant App as Node.js Instance
    participant Redis as Redis (Lock & Cache)
    participant Mongo as MongoDB
    participant Queue as RabbitMQ / Stream
    participant Worker as Background Worker

    User->>Nginx: POST /api/bookings/lock { eventId, seatId }
    Nginx->>App: Forward Request
    Note over App,Redis: Step 1: Acquire Distributed Lock
    App->>Redis: SET lock:event:<E>:seat:<S> <userId> NX PX 600000
    alt Lock Acquisition Failed (Already Locked)
        Redis-->>App: nil / false
        App-->>User: 409 Conflict: Seat currently held by another user
    else Lock Acquisition Succeeded
        Redis-->>App: OK
        App->>Mongo: Update Seat status='LOCKED', holdExpiresAt=now+10m
        App->>Redis: Broadcast seat_locked event (Pub/Sub)
        App-->>User: 201 Created: Seat Locked (Checkout Timer: 10m)
        
        Note over User,App: Step 2: Payment Execution (Test Mode)
        User->>App: POST /api/bookings/confirm { bookingId, paymentToken }
        App->>Mongo: Transaction Commit: status='BOOKED', paymentStatus='COMPLETED'
        App->>Redis: Release Lock (Lua Script) & Invalidate Cache
        App->>Redis: Broadcast seat_booked event (Pub/Sub)
        App->>Queue: Publish BookingConfirmedEvent { bookingId, userEmail }
        App-->>User: 200 OK: Booking Confirmed & Tickets Issued

        Note over Queue,Worker: Step 3: Asynchronous Post-Processing
        Queue->>Worker: Consume BookingConfirmedEvent
        Worker->>Worker: Generate PDF Barcode Ticket
        Worker->>Worker: Dispatch Email Notification
    end
```

---

## 4. Key Architectural Design Decisions

| ID | Decision Item | Selected Approach | Rationale & Trade-off Analysis |
| :--- | :--- | :--- | :--- |
| **AD-01** | **Primary Database** | **MongoDB (Document Store)** | Flexible hierarchical schema for complex venue/seat topologies; fast single-document atomic updates; ACID multi-document transactions support for checkout commits. |
| **AD-02** | **In-Memory Store** | **Redis v7.2** | Single-threaded in-memory engine provides sub-millisecond atomic primitives (`SET NX PX`, Lua scripting, Sorted Sets) ideal for distributed locks, caching, and WebSocket adapter coordination. |
| **AD-03** | **Application Framework** | **Node.js + Express** | Non-blocking, event-driven asynchronous I/O model handles thousands of concurrent I/O connections efficiently with lightweight memory footprints. |
| **AD-04** | **Real-Time Transport** | **Socket.io + Redis Adapter** | Robust fallback mechanisms (WebSockets with HTTP long-polling fallback), room-based abstractions, and native multi-instance pub/sub distribution via Redis. |
| **AD-05** | **Decoupled Task Queue** | **RabbitMQ / Redis Streams** | Ensures zero user latency impact for post-booking side-effects (ticket generation, email receipts, analytical indexing) while ensuring at-least-once processing delivery. |
| **AD-06** | **Containerization & Ingress** | **Docker Compose + Nginx** | Fully reproducible local orchestration simulating real-world production topology with layer-7 load balancing and static asset acceleration. |
