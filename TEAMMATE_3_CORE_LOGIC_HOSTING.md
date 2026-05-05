# Teammate 3: Core Logic, Execution & Deployment

This document explores the **Core Logic Layer** and **Cloud Infrastructure** of CloudEdit. It details the complex algorithms that manage the virtual file system and the process of executing code safely in the cloud.

---

## 1. The Development Journey: How it was built
1.  **Modeling the Tree**: We defined the `FileSystemItem` interface. The first challenge was handling recursion—how to represent a folder that can contain infinite other folders.
2.  **Logic Implementation**: Wrote the `FileContext`. This involved writing high-order functions to traverse the tree (Search, Rename, Delete, Update).
3.  **Code Execution**: Integrated **Judge0 API**. We initially used a simple API, but switched to Judge0 because it supports **Base64** payloads, which are essential for sending complex code snippets.
4.  **Production Pipeline**: Configured the **Unified Hosting** build. We had to write a root `package.json` that acts as a "Task Runner" to build both the React client and the TypeScript server in the correct order.

## 2. Advanced Technical Implementation

### A. The Recursive File Engine (`src/context/FileContext.tsx`)
Most operations in our file explorer use **Recursion**:
- **`updateFileContent`**: This function takes a `fileId` and a `newContent` string. It starts at the root folder and maps through children. If a child is a directory, the function **calls itself** on that directory. This continues until it finds the file with the matching ID.
- **Immutability with Spread**: To satisfy React's state rules, we never mutate the tree. Instead, we return a new object: `{ ...directory, children: directory.children.map(...) }`.

### B. Project Export Logic
We integrated `JSZip` and `file-saver` to allow users to download their work:
- **How it works**: A recursive function `downloadRecursive` traverses our virtual tree. For every "file" it finds, it adds it to a `JSZip` instance. For every "directory," it creates a folder in the zip. Finally, it generates a `.zip` blob and triggers a browser download.

### C. Drawing Data Serialization
The Whiteboard data is not just a list of pixels.
- **The Snapshot**: We use Tldraw's `StoreSnapshot<TLRecord>` type. This is a JSON representation of every shape, its color, position, and metadata.
- **Why JSON?**: By converting the canvas to JSON, we can easily transmit it over WebSockets and reconstruct the exact same canvas on another user's screen.

### D. The Judge0 Execution Pipeline
- **Base64 Encoding**: We use `btoa(unescape(encodeURIComponent(code)))`. This ensures that even if the user types emojis or special symbols, the code is transmitted safely as a standard string.
- **Decoding**: The server response (Output/Error) is often Base64 encoded by Judge0. We use a corresponding decode function to show the human-readable text in the terminal.

---

## 3. Viva Preparation: Advanced Q&A

**Q1: What is the Time Complexity of finding a file in your system?**
*   **Answer**: In the worst case, it is **O(N)**, where N is the total number of files and folders in the project. Since we have to visit every node in the tree until we find the target, it is a standard Depth-First Search (DFS).

**Q2: How does your code execution handle infinite loops in user code?**
*   **Answer**: We don't have to handle it on our server! We use **Judge0**, which has a built-in **Time Limit (TTL)**. If a user writes `while(true)`, the Judge0 container will automatically kill the process after a few seconds and return a "Time Limit Exceeded" error to our frontend.

**Q3: Explain the "Unified Build" process for Render.**
*   **Answer**: We have a root-level `package.json`. When Render runs `npm run build`, it executes two sub-commands: `npm run build --prefix client` (which generates the `dist` folder) and `npm run build --prefix server` (which compiles TypeScript into JavaScript). Our server then serves the `client/dist` folder as static files.

**Q4: How did you implement "Auto-Saving"?**
*   **Answer**: We don't have a "Save" button. Instead, we use a `useEffect` in the `Editor.tsx` that triggers an `updateFileContent` call. This local state change is then instantly broadcasted to the server, so every keystroke is effectively "Saved" across all connected clients.

**Q5: What is the benefit of the `wait=true` parameter in the Judge0 API?**
*   **Answer**: By default, code execution is asynchronous (you send code, then poll for results). By setting `wait=true`, we tell Judge0 to keep the connection open until the code finishes and return the output in the same response. This simplifies our frontend logic and feels faster to the user.

**Q6: How does the ZIP download handle nested folders?**
*   **Answer**: It uses a recursive walker. For every item, it checks the path. If it's `folder/subfolder/file.py`, the `JSZip` library automatically creates the internal directory structure in the zip file.

**Q7: What are the security risks of allowing users to run code, and how did you mitigate them?**
*   **Answer**: The main risk is **Remote Code Execution (RCE)** on our server. We mitigated this by using a **Third-Party Sandboxed API (Judge0)**. The code never touches our actual server; it is executed in an isolated cloud container provided by Judge0, which has no access to our files or environment.
