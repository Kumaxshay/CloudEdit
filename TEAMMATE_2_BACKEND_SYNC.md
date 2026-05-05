# Teammate 2: Real-time Sync & Backend Architecture

This document explains the **Real-time Collaboration Engine**. It details how the Node.js server maintains a "Shared Reality" between multiple users connected from different locations.

---

## 1. The Development Journey: How it was built
1.  **Server Initialization**: We built the server using **Express and TypeScript**. We chose TypeScript for the backend to share types (like `SocketEvent`) with the frontend, preventing communication errors.
2.  **Socket.io Integration**: Configured the server to handle **CORS** (Cross-Origin Resource Sharing) so that the Vite dev server could talk to the Node server.
3.  **The Room Pattern**: Implemented the "Room" logic. Instead of broadcasting every message to every user, we compartmentalized users into rooms based on a URL ID.
4.  **State Reconciliation**: Developed a "New User" protocol. When someone joins an existing room, the server "asks" the longest-standing user for the current project state and relays it to the new user.

## 2. Advanced Technical Implementation

### A. The Server Logic (`server/src/server.ts`)
The server uses a **Non-blocking I/O model**:
- **`userSocketMap`**: A key data structure. It's an array of `User` objects. We use JavaScript array methods like `.filter()` and `.find()` to manage this list in memory.
- **`io.on("connection", ...)`**: This is the entry point. For every user, a new scope is created. Inside this scope, we define listeners for specific events.
- **Broadcasting vs Emitting**: We use `socket.broadcast.to(roomId).emit(...)` to send data to everyone *except* the sender. This prevents the user's own changes from looping back to them.

### B. The Reconciliation Algorithm (State Sync)
This is the most critical part of the backend:
1.  **User A** is alone in a room with code.
2.  **User B** joins.
3.  Server emits `USER_JOINED` to User A.
4.  User A's client receives this and immediately emits `SYNC_FILE_STRUCTURE` back to the server.
5.  The server receives this and **targets** User B specifically using `io.to(socketId).emit(...)`.
6.  User B's client receives the data and updates its `FileContext`.

### C. Whiteboard State Syncing
Drawing data is complex because it involves many shapes and colors.
- **The Event**: We use `DRAWING_UPDATE`. When a user draws, their client sends a **Snapshot** of the changes to the server.
- **Full Sync on Join**: Because drawing data can be large, we don't send the entire history of every line ever drawn. Instead, when someone joins, the server emits `REQUEST_DRAWING` to an existing user, who then sends their current "Snapshot" to the newcomer.

### D. Chat Broadcast System
- **The Flow**: Client (User A) emits `SEND_MESSAGE` -> Server receives message -> Server identifies the room -> Server broadcasts `RECEIVE_MESSAGE` to everyone else in that room.
- **Efficiency**: The server doesn't store the message history. It only acts as a real-time relay. This keeps the server's memory usage low.

### E. Connection Resilience
- **Ping/Pong**: Socket.io uses a heartbeat mechanism. If a user loses internet, the server detects the "Ping Timeout" and automatically triggers the `disconnecting` logic to clean up the room list.

---

## 3. Viva Preparation: Advanced Q&A

**Q1: How do you handle the "CORS" issue between the frontend and backend?**
*   **Answer**: In the server initialization, we configure the `Server` instance from `socket.io` with a `cors` object. We set `origin: "*"` during development, which allows requests from any domain, but in production, we restrict it to our Render domain for security.

**Q2: What is the benefit of keeping the user list in memory instead of a database?**
*   **Answer**: Speed and Simplicity. Since our application is for **Real-time Collaboration**, we need sub-millisecond access to the user list. A database query would take 50-100ms, which is too slow for syncing cursors. Memory is fast enough for hundreds of concurrent users.

**Q3: How does the server know which room a message belongs to?**
*   **Answer**: We implement a helper function called `getRoomId(socketId)`. It looks up the socket ID in our `userSocketMap` and returns the associated `roomId`. This allows us to keep the frontend code simple (the client doesn't have to send the Room ID with every single message).

**Q4: Explain the `SocketEvent` enum.**
*   **Answer**: We use a shared TypeScript Enum for events (e.g., `FILE_UPDATED`, `USER_JOINED`). This ensures that if we change an event name, it changes in both the client and server code simultaneously, preventing "Silent Failures" where the server sends an event the client isn't listening for.

**Q5: How do you handle a new user seeing the whiteboard when they join?**
*   **Answer**: We use a "Pull" mechanism. When User B joins, the server sends a `REQUEST_DRAWING` event to User A. User A's client responds by sending its current drawing snapshot to the server, which then forwards it only to User B.

**Q6: Why doesn't the server store the Chat History?**
*   **Answer**: To keep the backend lightweight and secure. By not storing messages, we avoid the need for a database and ensure that private conversations are never logged permanently on our server.
