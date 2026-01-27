# WebSocket Integration - Complete Implementation

## 🎉 What You Now Have

A production-ready WebSocket system that allows **any React component** to:

- 📡 **Listen** to messages from a connected WebSocket
- 📤 **Send** messages through the WebSocket
- 🔌 **Monitor** connection status and automatically reconnect
- 🛡️ **Type-safe** with full TypeScript support (optional)

## 🚀 Quick Start (5 minutes)

### Use in Any Component

```tsx
import {
  useWebSocketListener,
  useWebSocketSend,
} from "@/hooks/useWebSocketListener";

export function MyComponent() {
  const { sendMessage, connected } = useWebSocketSend();

  // Listen to messages
  useWebSocketListener("FILE_UPDATE", (data) => {
    console.log("File updated:", data);
  });

  // Send message
  const handleClick = () => {
    if (connected) {
      sendMessage("CREATE_FILE", { path: "/file.txt" });
    }
  };

  return <button onClick={handleClick}>Create File</button>;
}
```

That's it! 🎊

## 📚 Documentation

### For Different Skill Levels

| Level            | Document                                                                   | Focus                               |
| ---------------- | -------------------------------------------------------------------------- | ----------------------------------- |
| **Beginner**     | [WEBSOCKET_QUICK_REFERENCE.md](WEBSOCKET_QUICK_REFERENCE.md)               | Essential patterns & cheat sheet    |
| **Intermediate** | [WEBSOCKET_USAGE_GUIDE.md](WEBSOCKET_USAGE_GUIDE.md)                       | Complete usage examples & API       |
| **Advanced**     | [WEBSOCKET_TYPE_SAFE_GUIDE.md](WEBSOCKET_TYPE_SAFE_GUIDE.md)               | Type-safe patterns & best practices |
| **Overview**     | [WEBSOCKET_IMPLEMENTATION_SUMMARY.md](WEBSOCKET_IMPLEMENTATION_SUMMARY.md) | Architecture & file structure       |

### Pick Your Path

- **Just want to use it?** → Start with [WEBSOCKET_QUICK_REFERENCE.md](WEBSOCKET_QUICK_REFERENCE.md)
- **Need to understand how it works?** → Read [WEBSOCKET_IMPLEMENTATION_SUMMARY.md](WEBSOCKET_IMPLEMENTATION_SUMMARY.md)
- **Want real examples?** → Check [WEBSOCKET_USAGE_GUIDE.md](WEBSOCKET_USAGE_GUIDE.md)
- **Building a large app?** → Follow [WEBSOCKET_TYPE_SAFE_GUIDE.md](WEBSOCKET_TYPE_SAFE_GUIDE.md)

## 📁 File Structure

```
chrome/
├── src/
│   ├── App.tsx                                    ← Wrapped with WebSocketProvider
│   ├── context/
│   │   └── WebSocketContext.tsx                  ← Context setup
│   ├── hooks/
│   │   ├── useWebSocket.ts                       ← Connection management (updated)
│   │   └── useWebSocketListener.ts               ← Three essential hooks (NEW)
│   ├── utils/
│   │   └── webSocketMessageService.ts            ← Message pub/sub system (NEW)
│   ├── types/
│   │   └── websocket.ts                          ← TypeScript types (NEW)
│   └── components/
│       └── WebSocketExampleComponent.tsx         ← Working example (NEW)
│
├── WEBSOCKET_QUICK_REFERENCE.md                  ← Cheat sheet
├── WEBSOCKET_USAGE_GUIDE.md                      ← Complete guide
├── WEBSOCKET_TYPE_SAFE_GUIDE.md                  ← Advanced patterns
└── WEBSOCKET_IMPLEMENTATION_SUMMARY.md           ← Architecture
```

## 🎯 Three Core Hooks

### 1. **useWebSocketListener** - Listen to Messages

```tsx
useWebSocketListener("MESSAGE_TYPE", (data) => {
  // Called whenever a message of this type is received
  console.log(data);
});
```

### 2. **useWebSocketSend** - Send Messages

```tsx
const { sendMessage, connected } = useWebSocketSend();

if (connected) {
  sendMessage("ACTION_TYPE", { key: "value" });
}
```

### 3. **useWebSocketStatus** - Check Connection

```tsx
const { connected, connectionState, refreshConnection } = useWebSocketStatus();

if (!connected) {
  return <button onClick={refreshConnection}>Reconnect</button>;
}
```

## 💡 Common Use Cases

### Listening to Server Updates

```tsx
useWebSocketListener("FILE_CHANGED", (data) => {
  setFile(data.content);
});
```

### Sending User Actions

```tsx
const handleSave = () => {
  sendMessage("SAVE_FILE", {
    path: filePath,
    content: fileContent,
  });
};
```

### Real-time Synchronization

```tsx
useWebSocketListener("SYNC", (data) => {
  setState(data);
});
```

### Error Handling

```tsx
useWebSocketListener("ERROR", (data) => {
  console.error(data.message);
});
```

## 🔄 Architecture

```
Browser (Multiple Components)
    ↓
WebSocketListener Hook (any component)
    ↓
WebSocketContext
    ↓
useWebSocket Hook (manages connection)
    ↓
WebSocketMessageService (pub/sub)
    ↓
Actual WebSocket Connection
    ↓
Server/Extension
```

**Messages flow bidirectionally:**

- **Incoming:** Server → WebSocket → Service → Listeners in Components
- **Outgoing:** Component → Hook → Service → WebSocket → Server

## ✅ Features

- ✅ **Global Access** - Use from any component, no prop drilling
- ✅ **Automatic Management** - Connection, cleanup, reconnection handled
- ✅ **Type-Safe** - Full TypeScript support with enums and interfaces
- ✅ **Pub/Sub Pattern** - Clean message handling, multiple listeners supported
- ✅ **Error Recovery** - Auto-reconnect with backoff strategy
- ✅ **Status Monitoring** - Know connection state at any time
- ✅ **Backward Compatible** - Still supports custom events
- ✅ **Zero Dependencies** - Only uses React and native WebSocket API
- ✅ **Example Component** - Working demo included
- ✅ **Comprehensive Docs** - Multiple guides for different needs

## 🚦 Getting Started

### 1. Check the Example Component

The app includes a working example in [src/components/WebSocketExampleComponent.tsx](src/components/WebSocketExampleComponent.tsx).

To see it in action, import it in your Layout:

```tsx
import { WebSocketExampleComponent } from "./WebSocketExampleComponent";

export function Layout() {
  return (
    <>
      <YourComponent />
      <WebSocketExampleComponent /> {/* Add this */}
    </>
  );
}
```

### 2. Use in Your Components

```tsx
import {
  useWebSocketListener,
  useWebSocketSend,
} from "@/hooks/useWebSocketListener";

export function MyComponent() {
  // ... (see quick start above)
}
```

### 3. Reference the Docs

- For quick answers: [WEBSOCKET_QUICK_REFERENCE.md](WEBSOCKET_QUICK_REFERENCE.md)
- For detailed info: [WEBSOCKET_USAGE_GUIDE.md](WEBSOCKET_USAGE_GUIDE.md)
- For type safety: [WEBSOCKET_TYPE_SAFE_GUIDE.md](WEBSOCKET_TYPE_SAFE_GUIDE.md)

## 🐛 Troubleshooting

### WebSocket not connecting?

- Check VS Code extension is running
- Use `useWebSocketStatus()` to see the error
- Click "Refresh Connection" button to retry

### Messages not being received?

- Verify message type matches exactly (case-sensitive)
- Check `connected` status in `useWebSocketSend()`
- Check browser console for errors

### TypeScript errors?

- Import from correct path: `../hooks/useWebSocketListener`
- Use enum for message types: `WebSocketMessageType.FILE_CREATED`
- Add `: any` if needed: `(data: any) => {}`

### Need to debug?

Check [WEBSOCKET_IMPLEMENTATION_SUMMARY.md](WEBSOCKET_IMPLEMENTATION_SUMMARY.md#troubleshooting) for detailed troubleshooting.

## 📖 API Reference

### useWebSocketListener(type, callback)

Subscribe to a message type. Automatically unsubscribes on unmount.

```tsx
useWebSocketListener("MESSAGE_TYPE", (data) => {
  console.log(data);
});
```

### useWebSocketSend()

Get functions to send messages.

```tsx
const { sendMessage, connected, socket } = useWebSocketSend();
```

### useWebSocketStatus()

Get connection information.

```tsx
const { connected, connectionState, refreshConnection } = useWebSocketStatus();
```

## 🎓 Learning Resources

| Resource                                                                      | Best For                             |
| ----------------------------------------------------------------------------- | ------------------------------------ |
| [WEBSOCKET_QUICK_REFERENCE.md](WEBSOCKET_QUICK_REFERENCE.md)                  | Quick lookup, copy-paste patterns    |
| [WEBSOCKET_USAGE_GUIDE.md](WEBSOCKET_USAGE_GUIDE.md)                          | Learning all features with examples  |
| [WEBSOCKET_TYPE_SAFE_GUIDE.md](WEBSOCKET_TYPE_SAFE_GUIDE.md)                  | Advanced patterns and best practices |
| [WebSocketExampleComponent.tsx](src/components/WebSocketExampleComponent.tsx) | Working code reference               |
| [Types Reference](src/types/websocket.ts)                                     | TypeScript types and interfaces      |

## 🔧 Configuration

### Change Connection Ports

Edit [src/hooks/useWebSocket.ts](src/hooks/useWebSocket.ts):

```tsx
const INITIAL_PORT = 12100; // Starting port
const PORT_COUNT = 10; // Try 10 ports
const MAX_ATTEMPTS = 20; // Max retry attempts
const RETRY_DELAY = 10000; // 10 seconds between retries
```

### Add Custom Message Types

Edit [src/types/websocket.ts](src/types/websocket.ts):

```tsx
export enum WebSocketMessageType {
  // Add your types here
  MY_MESSAGE = "MY_MESSAGE",
}

export interface WebSocketMessagePayloads {
  [WebSocketMessageType.MY_MESSAGE]: {
    // Define payload structure
    field: string;
  };
}
```

## 📊 Message Format

All messages follow a simple JSON structure:

```typescript
{
  type: "MESSAGE_TYPE",    // String identifier
  payload: { ... }         // Any data object
}
```

## 🎁 Bonus Features

### Direct Service Access

For non-React code:

```tsx
import { webSocketMessageService } from "@/utils/webSocketMessageService";

const unsubscribe = webSocketMessageService.subscribe("TYPE", (data) => {
  console.log(data);
});
```

### Manual Connection Control

```tsx
const { refreshConnection } = useWebSocketStatus();
refreshConnection(); // Force reconnect
```

### Raw WebSocket Access

```tsx
const { socket } = useWebSocketSend();
// Use socket directly if needed
```

## 📝 Notes

- All listeners automatically clean up on component unmount
- Multiple components can listen to the same message type
- Messages are dispatched to all listeners, not just one
- Connection is established automatically on app load
- Reconnection happens automatically with backoff strategy

## ❓ FAQ

**Q: Can I use this in class components?**  
A: Hooks only work in functional components. You can use the Context directly or create a wrapper component.

**Q: What if I send a message while disconnected?**  
A: The message is silently dropped. Check `connected` before sending.

**Q: Do I need to manage subscriptions?**  
A: No! `useWebSocketListener` handles subscribe/unsubscribe automatically.

**Q: Can multiple components listen to the same message?**  
A: Yes! Each gets the message independently.

**Q: How do I send different types of messages?**  
A: Use the `type` parameter: `sendMessage("TYPE_A", {...})`, `sendMessage("TYPE_B", {...})`

## 🚀 Next Steps

1. **Try it** - Add WebSocketExampleComponent to see it working
2. **Build with it** - Use in your components
3. **Type it** - Follow WEBSOCKET_TYPE_SAFE_GUIDE.md for better TypeScript support
4. **Share it** - Help your team use WebSocket effectively

## 📞 Support

If you encounter issues:

1. Check the appropriate guide document
2. Look at WebSocketExampleComponent.tsx for working code
3. Check browser DevTools Console for errors
4. Verify VS Code extension is running

## 🎉 You're All Set!

Everything is configured and ready to use. Start integrating WebSocket in your components using the three hooks!

Questions? Check the documentation links above! 📚
