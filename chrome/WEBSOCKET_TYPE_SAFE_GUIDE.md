# Advanced WebSocket Type-Safe Usage

This guide shows how to use WebSocket with full TypeScript type safety.

## Type Definitions

All types are defined in [src/types/websocket.ts](src/types/websocket.ts):

- `WebSocketMessageType` - Enum of all message types
- `WebSocketMessagePayloads` - Interface mapping types to payloads
- `WebSocketMessage<T>` - Typed message structure
- `ConnectionState` - Connection info
- `WebSocketContextType` - Context type

## Basic Type-Safe Usage

### 1. Define Your Message Types

Add your message types to `WebSocketMessageType` enum:

```tsx
export enum WebSocketMessageType {
  // ... existing types ...
  MY_CUSTOM_MESSAGE = "MY_CUSTOM_MESSAGE",
  MY_ACTION = "MY_ACTION",
}
```

### 2. Define Message Payloads

Add payload types to `WebSocketMessagePayloads`:

```tsx
export interface WebSocketMessagePayloads {
  // ... existing payloads ...
  [WebSocketMessageType.MY_CUSTOM_MESSAGE]: {
    userId: string;
    message: string;
    timestamp: number;
  };
  [WebSocketMessageType.MY_ACTION]: {
    action: string;
    target: string;
    params?: Record<string, unknown>;
  };
}
```

### 3. Use in Components

#### Type-Safe Listen

```tsx
import { useWebSocketListener } from "@/hooks/useWebSocketListener";
import {
  WebSocketMessageType,
  WebSocketMessagePayloads,
} from "@/types/websocket";

export function MyComponent() {
  // Payload type is inferred!
  useWebSocketListener(WebSocketMessageType.FILE_CREATED, (data) => {
    // data is typed as { path: string; size: number; timestamp: number; content?: string }
    console.log(data.path); // ✅ IDE knows this exists
    console.log(data.size); // ✅ IDE knows this exists
    // console.log(data.unknown); // ❌ IDE error: property doesn't exist
  });
}
```

#### Type-Safe Send

```tsx
import { useWebSocketSend } from "@/hooks/useWebSocketListener";
import { WebSocketMessageType } from "@/types/websocket";

export function MyComponent() {
  const { sendMessage } = useWebSocketSend();

  const handleCreate = () => {
    sendMessage(WebSocketMessageType.FILE_CREATED, {
      path: "/file.txt",
      size: 100,
      timestamp: Date.now(),
      // content is optional and typed
      content: "file content",
    });
  };
}
```

## Advanced Patterns

### Pattern 1: Create Typed Hooks

Create custom hooks for specific message types:

```tsx
// src/hooks/useFileWebSocket.ts
import { useWebSocketListener, useWebSocketSend } from "./useWebSocketListener";
import {
  WebSocketMessageType,
  WebSocketMessagePayloads,
} from "@/types/websocket";

export function useFileWebSocket() {
  const { sendMessage } = useWebSocketSend();

  // Typed listeners
  const onFileCreated = (
    callback: (
      data: WebSocketMessagePayloads[WebSocketMessageType.FILE_CREATED],
    ) => void,
  ) => {
    useWebSocketListener(WebSocketMessageType.FILE_CREATED, callback);
  };

  const onFileUpdated = (
    callback: (
      data: WebSocketMessagePayloads[WebSocketMessageType.FILE_UPDATED],
    ) => void,
  ) => {
    useWebSocketListener(WebSocketMessageType.FILE_UPDATED, callback);
  };

  // Typed senders
  const createFile = (path: string, content: string) => {
    sendMessage(WebSocketMessageType.FILE_CREATED, {
      path,
      size: content.length,
      timestamp: Date.now(),
      content,
    });
  };

  const updateFile = (path: string, content: string) => {
    sendMessage(WebSocketMessageType.FILE_UPDATED, {
      path,
      content,
      timestamp: Date.now(),
      size: content.length,
    });
  };

  return { onFileCreated, onFileUpdated, createFile, updateFile };
}
```

Usage:

```tsx
export function FileManager() {
  const { onFileCreated, onFileUpdated, createFile } = useFileWebSocket();

  onFileCreated((data) => {
    console.log(`File created: ${data.path} (${data.size} bytes)`);
  });

  return (
    <button onClick={() => createFile("/new.txt", "content")}>
      Create File
    </button>
  );
}
```

### Pattern 2: Message Type Guards

Create type guards for runtime safety:

```tsx
import {
  WebSocketMessageType,
  GenericWebSocketMessage,
  WebSocketMessage,
} from "@/types/websocket";

function isMessage<T extends WebSocketMessageType>(
  message: GenericWebSocketMessage,
  type: T,
): message is WebSocketMessage<T> {
  return message.type === type;
}

// Usage
const handleMessage = (message: GenericWebSocketMessage) => {
  if (isMessage(message, WebSocketMessageType.FILE_CREATED)) {
    // message.payload is now typed!
    console.log(message.payload.path);
  } else if (isMessage(message, WebSocketMessageType.ERROR)) {
    console.error(message.payload.message);
  }
};
```

### Pattern 3: Validation with Type Safety

```tsx
import {
  WebSocketMessageType,
  WebSocketMessagePayloads,
} from "@/types/websocket";

function validatePayload<T extends WebSocketMessageType>(
  type: T,
  payload: unknown,
): payload is WebSocketMessagePayloads[T] {
  // Implement validation logic
  if (type === WebSocketMessageType.FILE_CREATED) {
    const file = payload as any;
    return (
      typeof file.path === "string" &&
      typeof file.size === "number" &&
      typeof file.timestamp === "number"
    );
  }
  return true;
}

// Usage
useWebSocketListener(WebSocketMessageType.FILE_CREATED, (data) => {
  if (validatePayload(WebSocketMessageType.FILE_CREATED, data)) {
    // Safe to use
    console.log(data.path);
  }
});
```

### Pattern 4: Message Handler Registry

```tsx
import {
  WebSocketMessageType,
  WebSocketMessagePayloads,
} from "@/types/websocket";

type MessageHandler<T extends WebSocketMessageType> = (
  payload: WebSocketMessagePayloads[T],
) => void;

const handlers: {
  [K in WebSocketMessageType]?: MessageHandler<K>;
} = {
  [WebSocketMessageType.FILE_CREATED]: (data) => {
    console.log(`File created: ${data.path}`);
  },
  [WebSocketMessageType.FILE_UPDATED]: (data) => {
    console.log(`File updated: ${data.path}`);
  },
  [WebSocketMessageType.ERROR]: (data) => {
    console.error(`Error: ${data.message}`);
  },
};

// Use in component
export function MessageDispatcher() {
  for (const [type, handler] of Object.entries(handlers)) {
    if (handler) {
      useWebSocketListener(type as WebSocketMessageType, handler as any);
    }
  }

  return null;
}
```

## Extending Types for Your App

### Step 1: Add Custom Message Types

Edit [src/types/websocket.ts](src/types/websocket.ts):

```tsx
export enum WebSocketMessageType {
  // ... existing types ...
  NOTIFICATION = "NOTIFICATION",
  USER_ONLINE = "USER_ONLINE",
  USER_OFFLINE = "USER_OFFLINE",
}
```

### Step 2: Define Payloads

```tsx
export interface WebSocketMessagePayloads {
  // ... existing payloads ...
  [WebSocketMessageType.NOTIFICATION]: {
    id: string;
    title: string;
    message: string;
    level: "info" | "warning" | "error";
    timestamp: number;
  };
  [WebSocketMessageType.USER_ONLINE]: {
    userId: string;
    username: string;
    timestamp: number;
  };
  [WebSocketMessageType.USER_OFFLINE]: {
    userId: string;
    timestamp: number;
  };
}
```

### Step 3: Use in Your App

```tsx
import {
  useWebSocketListener,
  useWebSocketSend,
} from "@/hooks/useWebSocketListener";
import { WebSocketMessageType } from "@/types/websocket";

export function NotificationCenter() {
  const { sendMessage } = useWebSocketSend();
  const [notifications, setNotifications] = useState<any[]>([]);

  useWebSocketListener(WebSocketMessageType.NOTIFICATION, (data) => {
    setNotifications((prev) => [...prev, data]);
  });

  useWebSocketListener(WebSocketMessageType.USER_ONLINE, (data) => {
    console.log(`${data.username} is online`);
  });

  return (
    <div>
      {notifications.map((notif) => (
        <div key={notif.id} style={{ color: notif.level }}>
          {notif.title}: {notif.message}
        </div>
      ))}
    </div>
  );
}
```

## Benefits of Type-Safe WebSocket

✅ **IDE Autocomplete** - Know all available message types  
✅ **Type Checking** - Catch errors at compile time  
✅ **Documentation** - Types serve as inline documentation  
✅ **Refactoring** - Safe to rename or restructure messages  
✅ **Runtime Safety** - Add validators for extra safety  
✅ **Better Developer Experience** - Fewer runtime errors

## Debugging Type Issues

If you get type errors, remember:

1. **Message type must be from enum**

   ```tsx
   // ❌ Wrong
   sendMessage("FILE_CREATED", { ... });

   // ✅ Correct
   sendMessage(WebSocketMessageType.FILE_CREATED, { ... });
   ```

2. **Payload must match type definition**

   ```tsx
   // ❌ Missing required property
   sendMessage(WebSocketMessageType.FILE_CREATED, { path: "/file.txt" });

   // ✅ All required properties
   sendMessage(WebSocketMessageType.FILE_CREATED, {
     path: "/file.txt",
     size: 100,
     timestamp: Date.now(),
   });
   ```

3. **Import from correct location**
   ```tsx
   // ✅ Correct
   import { WebSocketMessageType } from "@/types/websocket";
   ```

## Complete Example

```tsx
import {
  useWebSocketListener,
  useWebSocketSend,
} from "@/hooks/useWebSocketListener";
import { WebSocketMessageType } from "@/types/websocket";
import { useState } from "react";

export function CompleteExample() {
  const { sendMessage, connected } = useWebSocketSend();
  const [fileList, setFileList] = useState<string[]>([]);

  // Listen to file creation - payload is fully typed
  useWebSocketListener(WebSocketMessageType.FILE_CREATED, (data) => {
    console.log(`Created: ${data.path} (${data.size} bytes)`);
    setFileList((prev) => [...prev, data.path]);
  });

  // Listen to file deletion - payload is fully typed
  useWebSocketListener(WebSocketMessageType.FILE_DELETED, (data) => {
    console.log(`Deleted: ${data.path}`);
    setFileList((prev) => prev.filter((f) => f !== data.path));
  });

  // Listen to errors - payload is fully typed
  useWebSocketListener(WebSocketMessageType.ERROR, (data) => {
    console.error(`Error [${data.code}]: ${data.message}`);
  });

  // Typed send
  const createNewFile = (path: string, content: string) => {
    if (!connected) {
      alert("Not connected");
      return;
    }

    sendMessage(WebSocketMessageType.FILE_CREATED, {
      path,
      size: content.length,
      timestamp: Date.now(),
      content, // optional
    });
  };

  return (
    <div>
      <h2>Files</h2>
      <ul>
        {fileList.map((file) => (
          <li key={file}>{file}</li>
        ))}
      </ul>
      <button onClick={() => createNewFile("/test.txt", "content")}>
        Create Test File
      </button>
    </div>
  );
}
```

## Related Files

- [WebSocket Types](src/types/websocket.ts)
- [WebSocket Hooks](src/hooks/useWebSocketListener.ts)
- [Quick Reference](WEBSOCKET_QUICK_REFERENCE.md)
- [Usage Guide](WEBSOCKET_USAGE_GUIDE.md)
