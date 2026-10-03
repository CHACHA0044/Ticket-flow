# UML Design Diagrams
## Ticket Flow — Scalable Real-Time Event Ticket Booking System

**Project Authors:** Pranav Dembla (2300100925 / 2301888021), Sachin Gautam (2300101889 / 2301888023)  
**Supervisor:** Mohd. Anas Khan  
**Department:** Computer Science & Engineering, Integral University, Lucknow  
**Academic Year:** 2026–2027  

---

## 1. Use Case Diagram

The Use Case Diagram models the system boundaries, human actors (Customer, Admin), and external systems (Payment Gateway, Notification Worker).

```mermaid
flowchart LR
    Customer((Customer / User))
    Admin((Event Admin))
    SystemWorker((System / Queue Worker))
    PaymentService((Payment Gateway))

    subgraph TicketFlow_System ["Ticket Flow Platform Boundary"]
        UC1[Register & Login]
        UC2[Browse & Search Events]
        UC3[View Event & Pricing Details]
        UC4[View Live Interactive Seat Map]
        UC5[Enter Virtual Waiting Room]
        UC6[Select & Attempt Seat Lock]
        UC7[Complete Payment & Checkout]
        UC8[View Booking History & Tickets]
        UC9[Cancel Booking / Request Refund]

        UC10[Create & Publish Event]
        UC11[Configure Venue & Seat Topology]
        UC12[Monitor Real-Time Sales & Traffic]
        UC13[Manage Cancellations & Seat Overrides]

        UC14[Validate Seat Availability]
        UC15[Acquire Distributed Seat Lock]
        UC16[Auto-Release Expired Locks TTL]
        UC17[Broadcast Seat State via WebSockets]
        UC18[Process Async Ticket & Notifications]
    end

    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6
    Customer --> UC7
    Customer --> UC8
    Customer --> UC9

    Admin --> UC1
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13

    UC6 --> UC14
    UC6 --> UC15
    UC7 --> PaymentService
    UC7 --> UC17
    UC7 --> UC18

    SystemWorker --> UC16
    SystemWorker --> UC17
    SystemWorker --> UC18
```

---

## 2. Class Diagram

The Class Diagram defines the object-oriented structure, domain models, entity attributes, methods, and relationships.

```mermaid
classDiagram
    class User {
        +String userId
        +String name
        +String email
        +String passwordHash
        +String role
        +DateTime createdAt
        +register(data) Boolean
        +login(credentials) JWTToken
        +getBookingHistory() List~Booking~
    }

    class Event {
        +String eventId
        +String title
        +String description
        +String category
        +DateTime startTime
        +DateTime endTime
        +String status
        +String venueId
        +publish() Boolean
        +getAvailableSeats() List~Seat~
        +updateStatus(newStatus) Boolean
    }

    class Venue {
        +String venueId
        +String name
        +String location
        +Int totalCapacity
        +List~Section~ sections
        +createLayout() Boolean
    }

    class Seat {
        +String seatId
        +String eventId
        +String section
        +String row
        +Int number
        +String category
        +Float basePrice
        +String status
        +Int version
        +lock(userId, ttl) Boolean
        +releaseLock() Boolean
        +markBooked(bookingId) Boolean
    }

    class SeatLock {
        +String lockKey
        +String seatId
        +String eventId
        +String userId
        +String lockToken
        +DateTime expiresAt
        +acquire(ttlMs) Boolean
        +release(token) Boolean
        +isExpired() Boolean
    }

    class Booking {
        +String bookingId
        +String userId
        +String eventId
        +Float totalAmount
        +String bookingStatus
        +DateTime createdAt
        +DateTime expiresAt
        +createPendingBooking() Booking
        +confirmBooking(paymentId) Boolean
        +cancelBooking() Boolean
    }

    class BookingItem {
        +String itemId
        +String bookingId
        +String seatId
        +Float unitPrice
        +String ticketCode
        +generateBarcode() String
    }

    class Payment {
        +String paymentId
        +String bookingId
        +Float amount
        +String currency
        +String status
        +String gatewayRef
        +DateTime processedAt
        +processPayment(token) Boolean
        +verifySignature() Boolean
    }

    class QueueEntry {
        +String queueId
        +String eventId
        +String userId
        +Int priorityScore
        +DateTime joinedAt
        +String status
        +enqueue() Int
        +dequeue() String
        +getPosition() Int
    }

    class Notification {
        +String notificationId
        +String userId
        +String type
        +String payload
        +String deliveryStatus
        +dispatchEmail() Boolean
        +dispatchPush() Boolean
    }

    User "1" --> "0..*" Booking : places
    Event "1" --> "1" Venue : hosted_at
    Event "1" --> "1..*" Seat : contains
    Booking "1" --> "1..*" BookingItem : includes
    Seat "1" --> "0..1" BookingItem : associated_with
    Booking "1" --> "0..1" Payment : settled_by
    Seat "1" <.. SeatLock : guarded_by
    Event "1" --> "0..*" QueueEntry : queues
    Booking "1" --> "0..*" Notification : triggers
```

---

## 3. Sequence Diagrams

### 3.1 Scenario A: Concurrent Seat Booking (Race Condition Resolution)
*Two users (User A and User B) attempt to lock the exact same physical seat simultaneously.*

```mermaid
sequenceDiagram
    autonumber
    actor UserA as User A (Client)
    actor UserB as User B (Client)
    participant Nginx as Nginx Load Balancer
    participant NodeA as Node Instance 1
    participant NodeB as Node Instance 2
    participant Redis as Redis Lock Manager
    participant Mongo as MongoDB
    participant Socket as Socket.io Broadcaster

    par Simultaneous Booking Attempts
        UserA->>Nginx: POST /api/bookings/lock { seatId: "S-101", eventId: "E-1" }
        Nginx->>NodeA: Route Request to Instance 1
        UserB->>Nginx: POST /api/bookings/lock { seatId: "S-101", eventId: "E-1" }
        Nginx->>NodeB: Route Request to Instance 2
    end

    Note over NodeA,Redis: Node A attempts atomic Redis lock
    NodeA->>Redis: SET lock:E-1:S-101 "userA_token" NX PX 600000
    Note over NodeB,Redis: Node B attempts atomic Redis lock (microseconds later)
    NodeB->>Redis: SET lock:E-1:S-101 "userB_token" NX PX 600000

    Redis-->>NodeA: OK (Lock Acquired by User A)
    Redis-->>NodeB: nil (Lock Rejected for User B)

    NodeB-->>UserB: 409 Conflict: Seat already held by another user. Please choose another seat.

    Note over NodeA,Mongo: Node A proceeds with seat reservation
    NodeA->>Mongo: updateOne({ _id: "S-101", status: "AVAILABLE" }, { $set: { status: "LOCKED", lockedBy: "UserA", expiresAt: now+10m } })
    Mongo-->>NodeA: { acknowledged: true, modifiedCount: 1 }

    NodeA->>Socket: Broadcast event "seat_status_changed" { seatId: "S-101", status: "LOCKED" }
    Socket-->>UserB: Real-time UI update: Seat S-101 turns Amber (Locked)
    NodeA-->>UserA: 201 Created: { bookingId: "B-998", lockExpiresIn: 600s, status: "PENDING" }
```

---

### 3.2 Scenario B: Normal End-to-End Booking Lifecycle
*From seat selection through payment confirmation, lock release, and asynchronous ticket dispatch.*

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer Client
    participant App as Node.js API Service
    participant Redis as Redis (Lock & Cache)
    participant Mongo as MongoDB
    participant Stripe as Payment Sandbox
    participant Queue as Task Message Broker
    participant Worker as Async Worker

    User->>App: POST /api/bookings/lock { eventId, seatIds: ["S-101"] }
    App->>Redis: Acquire Distributed Lock (SET NX PX)
    Redis-->>App: OK
    App->>Mongo: Create Pending Booking & Mark Seat LOCKED
    Mongo-->>App: Booking Created (ID: B-1001)
    App-->>User: 201 Created { bookingId: "B-1001", ttl: 600s }

    Note over User,App: User Proceeds to Payment
    User->>App: POST /api/bookings/confirm { bookingId: "B-1001", paymentMethod: "test_card" }
    App->>Stripe: Charge Payment (amount: 1500, currency: "INR")
    Stripe-->>App: Payment Success { chargeId: "ch_test_9987" }

    Note over App,Mongo: Commit Transaction & Release Redis Lock
    App->>Mongo: Transaction Commit: Booking=CONFIRMED, Seat=BOOKED, Payment=SUCCESS
    Mongo-->>App: Transaction Committed
    App->>Redis: Execute Lua Script (Release Lock & Invalidate Seat Cache)
    Redis-->>App: 1 (Lock Safely Released)

    App->>Queue: Publish "BOOKING_CONFIRMED" { bookingId: "B-1001", userEmail: "user@example.com" }
    App-->>User: 200 OK { status: "CONFIRMED", ticketId: "T-88712" }

    Note over Queue,Worker: Background Asynchronous Processing
    Queue->>Worker: Consume "BOOKING_CONFIRMED"
    Worker->>Worker: Generate QR Code & PDF Ticket
    Worker->>Worker: Dispatch Confirmation Email via SMTP
```

---

## 4. Activity Diagram

The Activity Diagram illustrates the complete decision flow, concurrency guards, payment branches, timeout triggers, and system error fallbacks.

```mermaid
flowchart TD
    Start([User Initiates Booking]) --> Browse[Browse Events & View Details]
    Browse --> ViewMap[Open Live Interactive Seat Map]
    ViewMap --> SelectSeat[Select Desired Seat]
    
    SelectSeat --> CheckAvail{Is Seat Currently AVAILABLE?}
    CheckAvail -- No --> ShowUnavailable[Display Error: Seat is already booked or held]
    ShowUnavailable --> ViewMap

    CheckAvail -- Yes --> LockAttempt[Request Temporary Seat Lock]
    
    LockAttempt --> AcquireLock{Acquire Distributed Lock in Redis / OCC?}
    AcquireLock -- Failed / Already Locked --> ConflictErr[Return 409 Conflict: Seat locked by another buyer]
    ConflictErr --> ViewMap

    AcquireLock -- Success --> CreatePending[Create Pending Booking & Start 10-Min TTL Timer]
    CreatePending --> BroadcastHold[Broadcast Seat LOCKED to all users via WebSocket]
    BroadcastHold --> ShowCheckout[Display Checkout & Payment Screen]

    ShowCheckout --> WaitAction{User Action within TTL?}
    
    WaitAction -- Timeout (TTL Expired) --> HandleExpiry[Trigger Lock Expiration]
    HandleExpiry --> RevertSeat[Revert Seat to AVAILABLE in DB & Cache]
    RevertSeat --> BroadcastFree[Broadcast Seat AVAILABLE via WebSocket]
    BroadcastFree --> TimeoutScreen[Show Session Expired Notification]
    TimeoutScreen --> End([End Flow])

    WaitAction -- User Cancels --> UserCancel[User Cancels Reservation]
    UserCancel --> RevertSeat

    WaitAction -- Submits Payment --> ProcessPay[Execute Test Payment Verification]
    ProcessPay --> PaySuccess{Payment Successful?}

    PaySuccess -- No (Card Declined / Error) --> ShowPayError[Display Payment Failure Message]
    ShowPayError --> RetryPay{Retry within remaining TTL?}
    RetryPay -- Yes --> ShowCheckout
    RetryPay -- No --> RevertSeat

    PaySuccess -- Yes --> CommitBooking[Commit Database Transaction: Mark BOOKED]
    CommitBooking --> ReleaseRedisLock[Release Redis Hold Lock & Update Cache]
    ReleaseRedisLock --> BroadcastBooked[Broadcast Seat BOOKED via WebSocket]
    BroadcastBooked --> EnqueueAsync[Enqueue Ticket & Email Generation Task]
    EnqueueAsync --> ShowConfirmation[Display Confirmed Ticket & QR Code Screen]
    ShowConfirmation --> SuccessEnd([Booking Successfully Completed])
```
