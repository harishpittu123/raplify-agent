# WebSocket Integration Guide

This guide shows how to use the WebSocket functionality from any component in your app.

## Overview

The WebSocket implementation provides three main ways to interact with the connected WebSocket:

1. **Listen to messages** from the WebSocket
2. **Send messages** through the WebSocket
3. **Check connection status**

## Setup (Already Done!)

The app is wrapped with `WebSocketProvider` in `App.tsx`, so all child components have access to the WebSocket context.

## Usage Examples

### 1. Listening to WebSocket Messages

Use the `useWebSocketListener` hook to subscribe to specific message types:

```tsx
import { useWebSocketListener } from "@/hooks/useWebSocketListener";

export function MyComponent() {
  useWebSocketListener("FILE_UPDATE", (data) => {
    console.log("File was updated:", data);
    // Handle file update here
  });

  useWebSocketListener("ERROR", (data) => {
    console.error("Error received:", data);
  });

  return <div>My Component</div>;
}
```

### 2. Sending WebSocket Messages

Use the `useWebSocketSend` hook to send messages:

```tsx
import { useWebSocketSend } from "@/hooks/useWebSocketListener";

export function MyComponent() {
  const { sendMessage, connected } = useWebSocketSend();

  const handleButtonClick = () => {
    sendMessage("FILE_OPERATION", {
      action: "create",
      path: "/path/to/file",
      content: "file contents",
    });
  };

  if (!connected) {
    return <div>WebSocket not connected</div>;
  }

  return <button onClick={handleButtonClick}>Create File</button>;
}
```

### 3. Checking Connection Status

Use the `useWebSocketStatus` hook to check connection state:

```tsx
import { useWebSocketStatus } from "@/hooks/useWebSocketListener";

export function StatusBar() {
  const { connected, connectionState, refreshConnection } =
    useWebSocketStatus();

  return (
    <div>
      {connected ? (
        <span style={{ color: "green" }}>
          ✓ Connected (Port: {connectionState.port})
        </span>
      ) : (
        <div>
          <span style={{ color: "red" }}>✗ Disconnected</span>
          {connectionState.error && <p>{connectionState.error}</p>}
          <button onClick={refreshConnection}>Retry Connection</button>
        </div>
      )}
    </div>
  );
}
```

## Advanced Usage

### Combining Multiple Listeners

```tsx
import {
  useWebSocketListener,
  useWebSocketSend,
} from "@/hooks/useWebSocketListener";

export function FileManager() {
  const { sendMessage, connected } = useWebSocketSend();

  // Listen to multiple message types
  useWebSocketListener("FILE_CREATED", (data) => {
    console.log("File created:", data.path);
  });

  useWebSocketListener("FILE_DELETED", (data) => {
    console.log("File deleted:", data.path);
  });

  useWebSocketListener("FILE_UPDATED", (data) => {
    console.log("File updated:", data.path);
  });

  const createFile = (path: string, content: string) => {
    if (connected) {
      sendMessage("CREATE_FILE", { path, content });
    }
  };

  return (
    <div>
      <button onClick={() => createFile("/test.txt", "Hello")}>
        Create Test File
      </button>
    </div>
  );
}
```

### Using with State Management

```tsx
import {
  useWebSocketListener,
  useWebSocketSend,
} from "@/hooks/useWebSocketListener";
import { useState } from "react";

export function FileList() {
  const [files, setFiles] = useState<string[]>([]);
  const { sendMessage } = useWebSocketSend();

  // Update file list when files are created
  useWebSocketListener("FILE_CREATED", (data) => {
    setFiles((prev) => [...prev, data.path]);
  });

  // Remove file from list when deleted
  useWebSocketListener("FILE_DELETED", (data) => {
    setFiles((prev) => prev.filter((f) => f !== data.path));
  });

  const refreshFiles = () => {
    sendMessage("GET_FILE_LIST", {});
  };

  return (
    <div>
      <button onClick={refreshFiles}>Refresh</button>
      <ul>
        {files.map((file) => (
          <li key={file}>{file}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Direct Service Access

For non-React code or special cases, you can use the service directly:

```tsx
import { webSocketMessageService } from "@/utils/webSocketMessageService";

// Subscribe directly
const unsubscribe = webSocketMessageService.subscribe("FILE_UPDATE", (data) => {
  console.log("File updated:", data);
});

// Emit messages (usually done internally)
webSocketMessageService.emit("FILE_UPDATE", { path: "/file.txt" });

// Unsubscribe when done
unsubscribe();
```

## API Reference

### useWebSocketListener(messageType, onMessage)

Subscribe to a specific WebSocket message type.

**Parameters:**

- `messageType` (string): The type of message to listen for
- `onMessage` (function): Callback function that receives the message payload

**Example:**

```tsx
useWebSocketListener("FILE_UPDATE", (data) => {
  console.log(data);
});
```

### useWebSocketSend()

Get access to send messages through WebSocket.

**Returns:**

- `sendMessage` (function): Send a message with type and payload
- `connected` (boolean): Current connection status
- `socket` (WebSocket | null): Raw WebSocket object

**Example:**

```tsx
const { sendMessage, connected } = useWebSocketSend();
sendMessage("ACTION_TYPE", { key: "value" });
```

### useWebSocketStatus()

Get the current connection state.

**Returns:**

- `connected` (boolean): Is WebSocket connected
- `connectionState` (object): Detailed connection state with port, attempts, error
- `refreshConnection` (function): Manually trigger reconnection

**Example:**

```tsx
const { connected, connectionState, refreshConnection } = useWebSocketStatus();
```

## Message Flow

```
Component sends message
    ↓
useWebSocketSend() → sendMessage()
    ↓
WebSocket sends to server
    ↓
Server processes and responds
    ↓
WebSocket receives response
    ↓
useWebSocket() hook emits to webSocketMessageService
    ↓
useWebSocketListener() components receive the message
```

## Best Practices

1. **Always check `connected` status** before sending messages
2. **Unsubscribe automatically** - `useWebSocketListener` handles cleanup
3. **Use specific message types** for different operations
4. **Handle errors gracefully** - add error listeners for the `ERROR` message type
5. **Avoid duplicate listeners** - each component instance creates one listener
6. **Use unique message types** to avoid conflicts across components

## Troubleshooting

### Messages not being received

1. Check if the component is using `useWebSocketListener`
2. Verify the message type matches exactly (case-sensitive)
3. Check browser console for error messages
4. Ensure the WebSocket connection is established

### Connection failures

1. Use `useWebSocketStatus()` to check the error message
2. Click "Retry Connection" button if available
3. Check VS Code extension is running on the expected port
4. Check firewall settings

### Sending messages when disconnected

- The `useWebSocketSend()` hook provides the `connected` flag
- Check this flag before calling `sendMessage`
- Messages sent when disconnected are silently dropped
