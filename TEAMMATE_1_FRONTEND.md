# Teammate 1: Frontend Architecture & UI/UX

This document provides a deep technical analysis of how the **CloudEdit Client** was engineered. It covers the component lifecycle, state management, and the intricate integration of the code editor.

---

## 1. The Development Journey: How it was built
1.  **Environment Setup**: We initialized a **Vite + React + TypeScript** project to ensure type safety and high-performance hot-reloading during development.
2.  **The Shell**: Created a responsive layout using `react-split`. This was the first hurdle: making sure the editor and sidebar could be resized without breaking the CodeMirror layout.
3.  **Editor Integration**: Integrated **CodeMirror 6**. Unlike standard text areas, we had to implement a custom `updateListener` to bridge the gap between CodeMirror's internal state and React's state.
4.  **Theming & Styling**: Implemented a dynamic theme switcher using **Tailwind CSS**. We used a palette of dark grays and vibrant accents to create a premium "developer" aesthetic.

## 2. Advanced Technical Implementation

### A. The Editor Logic (`src/components/editor/Editor.tsx`)
The editor uses a **Modular Extension Architecture**. We don't just "run" CodeMirror; we build it using layers:
- **`collaborativeHighlighting()`**: A custom extension we built that renders remote cursors. It works by listening to the `users` state from `AppContext` and injecting "WidgetDecorations" into the DOM.
- **`handleSelectionChange`**: A memoized callback that uses `view.state.selection.main`. It debounces the cursor position before sending it to the server to prevent network congestion.
- **Dynamic Language Loading**: We use `getLanguageFromFileName` to parse extensions. It uses a `Record<string, string>` map to convert `.cpp` or `.py` into the specific `LanguageName` required by the `@uiw/codemirror-extensions-langs` loader.

### B. UI Architecture (Atomic Design)
We structured the components to be reusable:
- **`src/components/common/Select.tsx`**: A reusable dropdown used in Settings and the Run panel.
- **`src/components/sidebar/sidebar-views/`**: Each sidebar panel (Files, Chat, Users, Settings) is an isolated view, swapped in/out by the `ViewContext`.
- **`react-hot-toast`**: Integrated for non-blocking notifications (e.g., "User joined", "Compilation successful").

### C. The Whiteboard Canvas (`src/components/drawing/DrawingView.tsx`)
We integrated **Tldraw**, a powerful infinite canvas library.
- **Activity State Switching**: We use an `ACTIVITY_STATE` enum (Coding/Drawing) managed in `AppContext`. When you switch to "Drawing", the editor is hidden, and the canvas is mounted.
- **Canvas Interaction**: Tldraw provides a rich API for shapes and lines. We don't just "show" an image; we render a full vector-based engine that everyone can interact with simultaneously.

### D. Chat System UI (`src/components/chat/ChatView.tsx`)
The chat is built for quick communication.
- **Auto-Scroll**: We use a `useEffect` hook that listens for new messages and calls `scrollIntoView()` on a "dummy" div at the bottom of the message list. This ensures the user always sees the latest message.
- **Notification Dot**: Managed in `ViewContext`, we show a red dot on the chat icon if a new message arrives while the user is looking at the File Explorer or Settings.

---

## 3. Viva Preparation: Advanced Q&A

**Q1: How does the project handle "Prop Drilling"?**
*   **Answer**: We avoided prop drilling by using **React Context API**. We have 5 core providers (`AppContext`, `FileContext`, `RunCodeContext`, `SettingContext`, `ViewContext`) that wrap the entire app. Any component deep in the tree can use `useFileSystem()` or `useSocket()` to access global data directly.

**Q2: What is the "Reconciliation" process in React, and how did it affect the editor?**
*   **Answer**: React compares the Virtual DOM with the real DOM to apply changes. For the editor, we had to ensure that the CodeMirror instance didn't re-mount every time someone typed. We used `useRef` to keep a persistent reference to the editor view and only dispatched "Changes" or "Effects" to it.

**Q3: Explain the `useMemo` usage in `Editor.tsx`.**
*   **Answer**: We use `useMemo` to filter the `users` list to exclude the `currentUser`. This optimization prevents the editor from re-calculating remote cursor positions every time *you* move your mouse, saving CPU cycles.

**Q4: How does the "Glassmorphism" effect work in the UI?**
*   **Answer**: We use Tailwind's `backdrop-blur` and semi-transparent background colors (e.g., `bg-dark/80`). This creates a depth effect where the editor content is slightly visible behind floating panels.

**Q5: How does the "Activity State" work in the UI?**
*   **Answer**: We use an Enum-based state in `AppContext`. The main layout (`App.tsx`) uses a conditional check: `activityState === ACTIVITY_STATE.CODING ? <Editor /> : <DrawingView />`. This allows us to switch the entire workspace focus while keeping the socket connection and user list active in the background.

**Q6: How do you handle auto-scrolling in the Chat?**
*   **Answer**: We use a `useRef` pointing to the end of the message list. Whenever the `messages` array dependency in a `useEffect` changes, we trigger `ref.current.scrollIntoView({ behavior: 'smooth' })`.

**Q7: How did you implement the "Syncing data, please wait..." toast?**
*   **Answer**: We used `toast.loading()` from `react-hot-toast`. It is triggered when a user joins a room with existing users. Once the `handleJoiningAccept` callback receives the full state from the server, we call `toast.dismiss()`.
