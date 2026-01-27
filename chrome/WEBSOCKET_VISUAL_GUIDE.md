# WebSocket Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          App.tsx                                │
│                 (wrapped with WebSocketProvider)                │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
         ┌──────▼──────┐   ┌─────▼─────┐   ┌────▼──────┐
         │  Component  │   │ Component │   │ Component │
         │    (Any)    │   │   (Any)   │   │   (Any)   │
         └──────┬──────┘   └─────┬─────┘   └────┬──────┘
                │                │                │
                └────────────────┼────────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │   useWebSocketListener   │ ← Listen to messages
                    │   useWebSocketSend       │ ← Send messages
                    │   useWebSocketStatus     │ ← Check status
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  WebSocketContext        │
                    │  (provides state)        │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │   useWebSocket Hook      │
                    │  (manages connection)    │
                    └────────────┬─────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
    ┌───────────▼──────────┐       ┌─────────────▼────────┐
    │  WebSocketMessage    │       │  WebSocket Connection│
    │  Service (pub/sub)   │       │  to Server/Extension │
    │                      │       │                      │
    │ - subscribe()        │       └──────────────────────┘
    │ - emit()             │
    │ - clearListeners()   │
    └──────────────────────┘
```

## Message Flow

### Receiving Messages from Server

```
Server sends JSON message
        ↓
WebSocket "message" event fired
        ↓
useWebSocket hook parses JSON
        ↓
webSocketMessageService.emit(type, payload)
        ↓
All components listening to that type are notified
        ↓
Their useWebSocketListener callbacks execute
        ↓
Components can update state, UI, etc.
```

### Sending Messages to Server

```
Component calls: sendMessage("TYPE", {data})
        ↓
useWebSocketSend hook formats message
        ↓
WebSocket.send(JSON.stringify({type, payload}))
        ↓
Server receives and processes
        ↓
Server may send response
        ↓
Response goes back through receiving flow above
```

## Hook Dependencies

```
useWebSocketListener ──┐
                       ├──→ useWebSocketContext ──→ WebSocketProvider
useWebSocketSend ──────┤
                       │
useWebSocketStatus ────┘
```

## Message Types & Flow

```
Component A                    Component B
    │                              │
    ├─ useWebSocketListener("FILE_CREATED")
    │                              │
    ├─ useWebSocketListener("FILE_UPDATED")
    │
    └─ useWebSocketSend()
        │
        └─ sendMessage("ACTION", {...})
                      ↓
            WebSocket sends to server
                      ↓
            Server processes & broadcasts
                      ↓
    ┌───────────────────┬───────────────────┐
    │                   │                   │
    ▼                   ▼                   ▼
COMPONENT A         COMPONENT B        COMPONENT C
Hears "FILE_       Hears "FILE_       Hears "FILE_
CREATED"           CREATED" +          CREATED"
                   "FILE_UPDATED"
```

## File Organization

```
src/
├── App.tsx                           ← Entry point (wrapped with provider)
│
├── context/
│   └── WebSocketContext.tsx          ← Provides: WebSocketContextType
│
├── hooks/
│   ├── useWebSocket.ts               ← Manages: Connection, integration
│   └── useWebSocketListener.ts       ← Provides: Three essential hooks
│
├── utils/
│   └── webSocketMessageService.ts    ← Implements: Pub/Sub pattern
│
├── types/
│   └── websocket.ts                  ← Defines: Message types, interfaces
│
├── components/
│   └── WebSocketExampleComponent.tsx ← Shows: Complete working example
│
└── index.websocket.ts                ← Exports: All WebSocket utilities
```

## Data Structure

### WebSocket Message Format

```typescript
{
  type: "FILE_CREATED",
  payload: {
    path: "/path/to/file",
    size: 1024,
    timestamp: 1704067200000,
    content?: "optional file content"
  }
}
```

### Connection State Structure

```typescript
{
  connected: true,
  socket: WebSocket | null,
  connectionState: {
    port: 12105,
    attempts: 0,
    error: null
  }
}
```

### Message Listener Registry

```typescript
{
  "FILE_CREATED": [callback1, callback2, callback3],
  "FILE_UPDATED": [callback4, callback5],
  "ERROR": [callback6]
}

When "FILE_CREATED" received → All 3 callbacks execute
```

## Connection Lifecycle

```
App Loads
    ↓
useWebSocket hook mounts
    ↓
Attempts connection to ports 12100-12109
    ↓
┌─────────────────────────────────────────┐
│ Connection successful?                  │
└──────┬──────────────────────────────┬───┘
       │ YES                          │ NO
       ↓                              ↓
   Connected = true              Retry after 10s
   Ready to send/receive              (up to 20 times)
       ↓                              ↓
   Components can use WebSocket   ┌─────────────┐
                                  │ Max attempts│
                                  │ reached?    │
                                  └─┬───────┬───┘
                                    │ YES   │ NO
                                    ↓       ↓
                                  Error  Retry
   ↓
Server closes connection OR network error
   ↓
Attempt reconnection
   ↓
(back to connection attempt loop)
```

## Usage Patterns

### Pattern 1: Simple Listen

```
Component renders
    ↓
useWebSocketListener called
    ↓
Subscribes to "MESSAGE_TYPE"
    ↓
When message received → Callback fires
    ↓
Component unmounts
    ↓
Automatically unsubscribed
```

### Pattern 2: Listen + Send

```
Component renders
    ↓
useWebSocketListener subscribes
useWebSocketSend initialized
    ↓
User action (click, etc.)
    ↓
Check connected status
    ↓
Call sendMessage("TYPE", data)
    ↓
Message sent to server
    ↓
Server responds
    ↓
Component receives via useWebSocketListener
    ↓
Callback fires, state updates
    ↓
UI re-renders
```

### Pattern 3: Multiple Components, Same Message Type

```
Component A               Component B               Component C
     │                         │                          │
useWebSocketListener      useWebSocketListener     useWebSocketListener
("FILE_CREATED")          ("FILE_CREATED")         ("FILE_CREATED")
     │                         │                          │
     └────────────┬────────────┴──────────────┬───────────┘
                  │                           │
           webSocketMessageService
                  │
        Subscribe "FILE_CREATED"
                  │
                  ├─ Component A callback
                  ├─ Component B callback
                  └─ Component C callback
                  │
             Server sends FILE_CREATED
                  │
        webSocketMessageService.emit()
                  │
    ┌─────────────┼─────────────┐
    │             │             │
Component A   Component B   Component C
callback 1    callback 2    callback 3
```

## Comparison: Before vs After

### Before Implementation

```
Component A                          Component B
    │                                    │
    └─ Manual WebSocket setup           └─ Duplicate WebSocket setup
    │                                    │
    └─ Manual event listeners           └─ Manual event listeners
    │                                    │
    └─ Hard to share connection         └─ Hard to coordinate
    │
    Prop drilling if sharing needed
```

### After Implementation

```
Component A                          Component B
    │                                    │
    └─ useWebSocketListener("TYPE")    └─ useWebSocketListener("TYPE")
    │                                    │
    └─ useWebSocketSend()              └─ useWebSocketSend()
    │                                    │
    └─ useWebSocketStatus()            └─ useWebSocketStatus()
    │
    All accessing same connection via context!
```

## Type System

```
TypeScript Enums          Payload Interfaces       Component Usage
─────────────────────────────────────────────────────────────────

FILE_CREATED   ──→  { path, size, timestamp }  ──→  useWebSocketListener
FILE_UPDATED   ──→  { path, content, size }   ──→  sendMessage with type
FILE_DELETED   ──→  { path, timestamp }       ──→  Full autocomplete!
...
```

## Error Handling Flow

```
WebSocket error or close
    ↓
useWebSocket detects
    ↓
Sets connected = false
Sets connectionState.error = message
    ↓
Components using useWebSocketStatus see error
    ↓
UI can display error message
    ↓
User clicks "Retry Connection"
    ↓
refreshConnection() called
    ↓
Attempts reconnect
    ↓
(back to connection attempt loop)
```

## Key Features Visualization

```
┌────────────────────────────────────────────────────────┐
│         Global WebSocket Access                        │
│  ✓ Any component, any level of nesting               │
│  ✓ No prop drilling needed                           │
│  ✓ Multiple components can listen to same type      │
└────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    ┌───▼───┐       ┌───▼───┐       ┌──▼────┐
    │Listen │       │ Send  │       │Status │
    │Message│       │Message│       │Check  │
    └───────┘       └───────┘       └───────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼─────┐  ┌─────▼──────┐  ┌────▼─────┐
   │Type Safe │  │Auto Cleanup│  │Auto Retry│
   │TypeScript│  │on Unmount  │  │Backoff   │
   └──────────┘  └────────────┘  └──────────┘
```

---

This visual guide complements the detailed documentation. Use it as a reference while reading the other guides!
