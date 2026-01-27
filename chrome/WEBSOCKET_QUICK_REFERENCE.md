# WebSocket Quick Reference

## Three Essential Hooks

### 1. Listen to Messages

```tsx
import { useWebSocketListener } from "@/hooks/useWebSocketListener";

useWebSocketListener("MESSAGE_TYPE", (data) => {
  console.log(data);
});
```

### 2. Send Messages

```tsx
import { useWebSocketSend } from "@/hooks/useWebSocketListener";

const { sendMessage, connected } = useWebSocketSend();

if (connected) {
  sendMessage("ACTION_TYPE", { key: "value" });
}
```

### 3. Check Status

```tsx
import { useWebSocketStatus } from "@/hooks/useWebSocketListener";

const { connected, connectionState, refreshConnection } = useWebSocketStatus();
```

## Common Patterns

### Pattern 1: Listen + Send

```tsx
import {
  useWebSocketListener,
  useWebSocketSend,
} from "@/hooks/useWebSocketListener";

export function FileComponent() {
  const { sendMessage, connected } = useWebSocketSend();

  useWebSocketListener("FILE_READY", (data) => {
    console.log("File is ready:", data.path);
  });

  const createFile = () => {
    if (connected) {
      sendMessage("CREATE_FILE", { path: "/file.txt" });
    }
  };

  return <button onClick={createFile}>Create</button>;
}
```

### Pattern 2: Multiple Listeners

```tsx
useWebSocketListener("CREATE", (data) => {
  /* handle */
});
useWebSocketListener("UPDATE", (data) => {
  /* handle */
});
useWebSocketListener("DELETE", (data) => {
  /* handle */
});
useWebSocketListener("ERROR", (data) => {
  /* handle */
});
```

### Pattern 3: With State

```tsx
const [files, setFiles] = useState<string[]>([]);

useWebSocketListener("FILE_LIST", (data) => {
  setFiles(data.files);
});
```

### Pattern 4: Conditional Sending

```tsx
const { sendMessage, connected } = useWebSocketSend();

const handleClick = () => {
  if (!connected) {
    alert("Not connected");
    return;
  }
  sendMessage("ACTION", {});
};
```

## Message Format

All messages follow this format:

```typescript
{
  type: "MESSAGE_TYPE",      // Required: string identifier
  payload: { ... }           // Optional: any data object
}
```

**Sending:**

```tsx
sendMessage("FILE_CREATED", {
  path: "/path/to/file",
  size: 1024,
  timestamp: Date.now(),
});
```

**Receiving:**

```tsx
useWebSocketListener("FILE_CREATED", (data) => {
  console.log(data.path); // "/path/to/file"
  console.log(data.size); // 1024
  console.log(data.timestamp); // timestamp
});
```

## Connection States

```
DISCONNECTED
    ↓ (auto-connect on mount)
CONNECTING
    ↓ (success)
CONNECTED (connected === true)
    ↓ (error or close)
RECONNECTING
    ↓ (retry with exponential backoff)
FAILED (connectionState.error set)
    ↓ (manual refresh or auto-retry)
```

## Error Handling

```tsx
import { useWebSocketStatus } from "@/hooks/useWebSocketListener";

const { connected, connectionState, refreshConnection } = useWebSocketStatus();

if (!connected) {
  return (
    <div>
      {connectionState.error && <p>Error: {connectionState.error}</p>}
      <button onClick={refreshConnection}>Retry</button>
    </div>
  );
}
```

## Type Safety

Define message types:

```tsx
type MessagePayloads = {
  FILE_CREATED: { path: string; size: number };
  FILE_UPDATED: { path: string; content: string };
  FILE_DELETED: { path: string };
  ERROR: { message: string; code: number };
};

// Typed send
const sendTypedMessage = <T extends keyof MessagePayloads>(
  type: T,
  payload: MessagePayloads[T],
) => {
  sendMessage(type, payload);
};

// Use
sendTypedMessage("FILE_CREATED", { path: "/file.txt", size: 100 });
```

## Best Practices

✅ **DO**

- Check `connected` before sending
- Use unique, descriptive message types
- Handle errors with try-catch in listeners
- Unsubscribe manually if needed (return function from `subscribe`)
- Group related listeners in one component

❌ **DON'T**

- Send without checking `connected`
- Use vague message types like "MESSAGE" or "DATA"
- Ignore connection errors
- Create duplicate listeners (use state instead)
- Listen to same message type in multiple components (use state lifting)

## Service Direct Access (Advanced)

```tsx
import { webSocketMessageService } from "@/utils/webSocketMessageService";

// Manual subscribe
const unsubscribe = webSocketMessageService.subscribe("TYPE", (data) => {
  console.log(data);
});

// Unsubscribe when done
unsubscribe();

// Check subscriptions
const types = webSocketMessageService.getSubscribedTypes();
console.log(types); // ["FILE_CREATED", "FILE_UPDATED", ...]

// Clear specific type
webSocketMessageService.clearListeners("FILE_CREATED");

// Clear all
webSocketMessageService.clearAll();
```

## Debugging

```tsx
import { useWebSocketStatus } from "@/hooks/useWebSocketListener";

export function DebugPanel() {
  const { connected, connectionState } = useWebSocketStatus();

  return (
    <div style={{ padding: "10px", border: "1px solid #ccc" }}>
      <pre>{JSON.stringify({ connected, connectionState }, null, 2)}</pre>
    </div>
  );
}
```

## File Locations

| Purpose | File                                           |
| ------- | ---------------------------------------------- |
| Context | `src/context/WebSocketContext.tsx`             |
| Hooks   | `src/hooks/useWebSocketListener.ts`            |
| Service | `src/utils/webSocketMessageService.ts`         |
| Example | `src/components/WebSocketExampleComponent.tsx` |
| Main    | `src/App.tsx` (wrapped with provider)          |

## Import Paths

```tsx
// Hooks - all 3 from same file
import {
  useWebSocketListener,
  useWebSocketSend,
  useWebSocketStatus,
} from "../hooks/useWebSocketListener";

// Context - direct use rarely needed
import { useWebSocketContext } from "../context/WebSocketContext";

// Service - for advanced use
import { webSocketMessageService } from "../utils/webSocketMessageService";
```

## Need Help?

See [WEBSOCKET_USAGE_GUIDE.md](WEBSOCKET_USAGE_GUIDE.md) for:

- Detailed examples
- Advanced patterns
- Troubleshooting
- API reference
