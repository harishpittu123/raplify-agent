# WebSocket Single Instance Architecture

## Overview

Updated the Chrome extension to ensure only **ONE** WebSocket connection instance is created and maintained, preventing multiple simultaneous connections from the same component.

## Problem

Previously, `useWebSocket()` hook was being called in multiple components:

- `App.tsx` (root level)
- `FileExplorer.tsx`
- `Toolbar.tsx`

This could lead to:

- Multiple WebSocket client instances being created
- Redundant connections consuming resources
- Potential message handling conflicts
- Difficult to debug connection state

## Solution

Implemented a **single-instance pattern** with context-based access:

### 1. **Single Connection Point: App.tsx**

```tsx
// Only ONE place where useWebSocket() is called
function App() {
  const webSocketState = useWebSocket(); // Create connection once

  return (
    <WebSocketProvider value={webSocketState}>
      <AppContent />
    </WebSocketProvider>
  );
}
```

### 2. **Context-Based Access: Other Components**

Replaced `useWebSocket()` calls with context-based hooks that **don't create new connections**:

#### FileExplorer.tsx

```tsx
// Before (created new connection)
const { sendMessage, connected } = useWebSocket();

// After (accesses existing connection via context)
const { sendMessage } = useWebSocketSend();
const { connected } = useWebSocketStatus();
```

#### Toolbar.tsx

```tsx
// Before (created new connection)
const { connected, connectionState, refreshConnection } = useWebSocket();

// After (accesses existing connection via context)
const { connected, connectionState, refreshConnection } = useWebSocketStatus();
```

## Hook Architecture

### useWebSocketSend() - For Sending Messages

```typescript
const { sendMessage, connected, socket } = useWebSocketSend();

// Usage:
sendMessage("MESSAGE_TYPE", {
  /* payload */
});
```

### useWebSocketStatus() - For Connection State

```typescript
const { connected, connectionState, refreshConnection } = useWebSocketStatus();

// Usage:
if (connected) {
  // Connected
}
if (refreshConnection) {
  refreshConnection(); // Retry connection
}
```

### useWebSocketListener() - For Message Subscription

```typescript
useWebSocketListener("MESSAGE_TYPE", (data) => {
  console.log("Received:", data);
});
```

## Benefits

✅ **Single Connection**: Only one WebSocket instance exists  
✅ **Memory Efficient**: No redundant connections  
✅ **Centralized Management**: Connection lifecycle managed in one place  
✅ **Easier Debugging**: Single source of truth for connection state  
✅ **Clean Separation**: Data flow clearly separated (context → hooks → components)  
✅ **Scalable**: Easy to add more components without connection management concerns

## File Changes

### Modified Files

1. **chrome/src/components/FileExplorer.tsx**

   - Replaced `useWebSocket()` with `useWebSocketSend()` and `useWebSocketStatus()`
   - Updated `sendMessage()` call to use correct two-argument signature

2. **chrome/src/components/Toolbar.tsx**

   - Replaced `useWebSocket()` with `useWebSocketStatus()`
   - All connection state comes from context

3. **chrome/src/context/WebSocketContext.tsx**
   - Exported `WebSocketContextType` interface for external usage

### Unchanged Files

- **chrome/src/App.tsx** - Still calls `useWebSocket()` for initial connection
- **chrome/src/hooks/useWebSocket.ts** - Still manages connection lifecycle
- **chrome/src/hooks/useWebSocketListener.ts** - Provides context-based hooks
- **chrome/src/utils/webSocketMessageService.ts** - Pub/sub message system
- **chrome/src/context/WebSocketContext.tsx** - Provides context to app

## Testing

All changes verified:

- ✓ Chrome extension builds without errors
- ✓ TypeScript compilation successful
- ✓ No redundant WebSocket connections
- ✓ Context hooks properly access shared connection state

## Migration Guide for New Components

To use WebSocket in a new component:

```tsx
import {
  useWebSocketSend,
  useWebSocketStatus,
} from "../hooks/useWebSocketListener";

export function MyComponent() {
  // Get message sending capability
  const { sendMessage, connected } = useWebSocketSend();

  // Get connection state
  const { connected: isConnected, connectionState } = useWebSocketStatus();

  // Listen to specific message types
  useWebSocketListener("MY_MESSAGE_TYPE", (data) => {
    console.log("Received:", data);
  });

  return (
    <div>
      Status: {isConnected ? "Connected" : "Disconnected"}
      <button
        onClick={() =>
          sendMessage("ACTION", {
            /* payload */
          })
        }
      >
        Send Message
      </button>
    </div>
  );
}
```

**Important**: Never call `useWebSocket()` in components - it's only for App.tsx initialization!
