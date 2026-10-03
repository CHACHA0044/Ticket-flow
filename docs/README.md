# TICKET FLOW — SCALABLE REAL-TIME EVENT TICKET BOOKING SYSTEM
### Technical Documentation & Engineering Design Foundation

**Degree:** Bachelor of Technology in Computer Science & Engineering (2026–2027)  
**Institution:** Integral University, Lucknow  
**Project Supervisor:** Mohd. Anas Khan  
**Submitted By:**  
- Pranav Dembla (Group: Ccai A | Roll No: 2300100925 / 2301888021)  
- Sachin Gautam (Group: Ccai A | Roll No: 2300101889 / 2301888023)  

---

## 1. Executive Project Overview

**Ticket Flow** is a high-throughput, real-time distributed web platform engineered to eliminate race conditions, prevent seat double-booking, and maintain low-latency responsiveness during massive flash-crowd ticket sales.

### Core Problem Statement
During high-demand ticket sales for popular concerts, sporting events, or conferences, thousands of concurrent requests compete for identical, non-fungible inventory units (specific physical seats) simultaneously. Conventional booking architectures suffer from "check-then-act" race conditions, resulting in double-booking, database lock escalation, and server crashes under traffic spikes.

### Primary Solution & Architectural Focus
Ticket Flow implements a multi-tier defense-in-depth architecture featuring:
1. Sub-millisecond atomic in-memory distributed locking via **Redis** (`SET NX PX` and Lua-based atomic release).
2. Database-level **Optimistic Concurrency Control (OCC)** and ACID multi-document transactions in **MongoDB**.
3. Real-time live seat map broadcasting via **Socket.io** backed by `@socket.io/redis-adapter` for multi-node distribution.
4. An ingress **Virtual Waiting Room** (traffic-shaping FIFO queue) to protect backend services from saturation.
5. Asynchronous background processing (**RabbitMQ / Redis Streams**) to offload PDF ticket generation and email notifications from the critical HTTP reservation path.
6. Horizontal containerized scaling across multiple **Node.js/Express** replicas load-balanced by **Nginx**.

---

## 2. Master Documentation Directory Structure

All technical documentation, requirements, research analyses, architectural diagrams, UML models, and database designs are organized as follows:

```
docs/
├── README.md                           # Master Project Index & Status Report (This File)
├── srs/
│   └── SRS.md                          # Comprehensive Software Requirements Specification (IEEE 830-style)
├── research/
│   ├── research-gap.md                 # Technical Problem Statement, Research Gap & Research Questions
│   └── literature-review.md            # Structured Literature Notes & Research Article Publication Plan
├── architecture/
│   └── system-architecture.md          # Multi-Tier System Architecture & Sequence Diagrams (Mermaid)
├── uml/
│   └── uml-diagrams.md                 # Use Case, Class, Concurrency Sequence & Activity Diagrams
├── database/
│   └── database-design.md              # MongoDB ER Diagram, Collection Schemas, Indexes & OCC Strategy
└── development/
    ├── setup.md                        # Technology Stack Evaluation & Semester Responsibility Mapping
    └── local-development.md            # Local Environment Setup, Docker Cluster & Load Testing Guide
```

---

## 3. Semester Scope & Milestone Matrix

| Dimension | Semester VII Scope (Current Phase) | Semester VIII Scope (Upcoming Phase) |
| :--- | :--- | :--- |
| **Core Focus** | Concurrency Safety & Baseline Reservation Engine | Real-Time Scaling, Caching & Traffic Shaping |
| **Concurrency & Locks**| • MongoDB OCC (Versioned updates)<br>• Redis In-Memory Distributed Locking<br>• Lock auto-expiry TTL management | • Production Redlock consensus (if multi-cluster)<br>• Dynamic lock lease extension |
| **Benchmarking** | • k6 / Artillery scripts testing simultaneous seat collisions<br>• Empirical comparison: OCC vs. Redis Locking | • End-to-end multi-instance load testing (1,000–5,000 VUs)<br>• Stress testing under Nginx load balancing |
| **Real-Time Map** | • Static seat map polling via REST API | • Live WebSocket broadcasting via Socket.io<br>• `@socket.io/redis-adapter` cross-node sync |
| **Traffic Shaping** | • Direct API handling with rate limiting | • Virtual Waiting Room (FIFO Redis Sorted Sets)<br>• Token-based controlled admission |
| **Asynchronous Queue**| • Synchronous post-booking execution | • RabbitMQ / Redis Streams background workers<br>• PDF ticket barcode rendering & SMTP dispatch |
| **Deployment** | • Single Node.js server + Local Docker Mongo/Redis | • Horizontally scaled multi-container Docker cluster<br>• Nginx layer-7 reverse proxy & load balancer |
| **Academic Target** | • SRS, UML, ERD, Prototype & Research Article Draft | • Complete Working Application, Load Test Report & Viva |

---

## 4. Summary of Key Architectural Specifications

### 4.1 System Architecture
- **Web Client:** Next.js 19 (React, TypeScript, Tailwind CSS) providing responsive interactive seating grids.
- **Reverse Proxy / LB:** Nginx routing requests across $N$ stateless Node.js/Express containers.
- **In-Memory Store:** Redis 7.2 coordinating distributed mutual exclusion locks, caching seat maps, and acting as the WebSocket pub/sub message bus.
- **Persistence Store:** MongoDB 7.0 providing ACID transactions and compound unique indexes.
- *Detailed Architecture Diagram:* [`docs/architecture/system-architecture.md`](file:///d:/rep/ticketflow/docs/architecture/system-architecture.md)

### 4.2 Concurrency Defense-in-Depth Model
```
[ Incoming Request ]
         ↓
1. Redis Atomic Distributed Lock (SET NX PX) ---> Rejects 99% of collisions in RAM (<1 ms)
         ↓ (Only Winner Passes)
2. MongoDB Atomic Conditional Update (OCC)   ---> Guards persistent record with version check
         ↓
3. MongoDB Compound Unique Index             ---> Guarantees physical seat integrity in storage
         ↓
4. Multi-Document ACID Transaction           ---> Atomically confirms Booking + Seats + Payment
```

### 4.3 UML Models
- **Use Case Model:** Defines User, Admin, System Worker, and Payment Service boundaries.
- **Class Model:** Defines User, Event, Venue, Seat, SeatLock, Booking, BookingItem, Payment, QueueEntry, and Notification.
- **Concurrency Sequence Diagram:** Visualizes two users simultaneously competing for the identical seat, demonstrating sub-millisecond mutual exclusion and clean `409 Conflict` feedback.
- **Activity Diagram:** Comprehensive workflow including hold timeouts, cancellation reverts, payment fallbacks, and async queues.
- *Detailed UML Documentation:* [`docs/uml/uml-diagrams.md`](file:///d:/rep/ticketflow/docs/uml/uml-diagrams.md)

### 4.4 Database Design
- **10 Core Collections:** `users`, `venues`, `events`, `seats`, `bookings`, `bookingItems`, `seatLocks`, `payments`, `queueEntries`, `notifications`.
- **High-Performance Indexes:** Compound unique indexes on `{ eventId: 1, section: 1, row: 1, number: 1 }` and partial TTL indexes on `{ lockExpiresAt: 1 }`.
- *Detailed Database Documentation:* [`docs/database/database-design.md`](file:///d:/rep/ticketflow/docs/database/database-design.md)

---

## 5. Current Progress & Project Status

According to the **15-Day Progress Record (PCS26127)**:
- **P1 (Fortnight 1):** Literature Survey & Synopsis Preparation — **Completed (5%)**
- **P2 (Fortnight 2):** Research Gap & Problem Statement Finalization — **Completed (10%)**
- **P3 (Fortnight 3):** SRS & Requirement Analysis — **Completed (15%)**
- **P4 (Fortnight 4):** System Architecture & UML Design — **Completed (20%)**
- **P5 (Fortnight 5):** Database Design & Data Models — **Completed (25%)**
- **P6 (Fortnight 6):** Technical Documentation Foundation & Initial Prototype Setup — **Completed (30%)**

---

## 6. Verification and Quick Navigation Links

- **Software Requirements Specification:** [`docs/srs/SRS.md`](file:///d:/rep/ticketflow/docs/srs/SRS.md)
- **Problem Statement & Research Gap:** [`docs/research/research-gap.md`](file:///d:/rep/ticketflow/docs/research/research-gap.md)
- **Literature Review & Publication Plan:** [`docs/research/literature-review.md`](file:///d:/rep/ticketflow/docs/research/literature-review.md)
- **System Architecture Specification:** [`docs/architecture/system-architecture.md`](file:///d:/rep/ticketflow/docs/architecture/system-architecture.md)
- **UML Diagrams (Use Case, Class, Sequence, Activity):** [`docs/uml/uml-diagrams.md`](file:///d:/rep/ticketflow/docs/uml/uml-diagrams.md)
- **Database Design & ER Diagrams:** [`docs/database/database-design.md`](file:///d:/rep/ticketflow/docs/database/database-design.md)
- **Technology Stack & Rationale:** [`docs/development/setup.md`](file:///d:/rep/ticketflow/docs/development/setup.md)
- **Local Development & Testing Guide:** [`docs/development/local-development.md`](file:///d:/rep/ticketflow/docs/development/local-development.md)
