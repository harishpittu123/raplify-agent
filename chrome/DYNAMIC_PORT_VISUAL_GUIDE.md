# Dynamic Port Integration - Visual Guide

## System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                   VS CODE EXTENSION                            │
│                                                                │
│  ┌──────────────────────────────────────┐                     │
│  │  WebSocket Server                    │                     │
│  │  Tries: 12100 → 12101 → 12102 → ... │                     │
│  │  Settled Port: 12100 ✓               │                     │
│  └──────────────────────────────────────┘                     │
└────────────────────────────────────────────────────────────────┘
                          ↑ ↓
                     WebSocket
                       (Port 12100)
                          ↑ ↓
┌────────────────────────────────────────────────────────────────┐
│                   CHROME EXTENSION                             │
│                                                                │
│  ┌──────────────────────────────────────┐                     │
│  │ useWebSocket Hook                    │                     │
│  │ Tries ports: 12100 ✓ (Success!)     │                     │
│  │ connectionState.port = 12100         │                     │
│  └──────────────────────────────────────┘                     │
│                     ↓                                          │
│  ┌──────────────────────────────────────┐                     │
│  │ RightPanel Component                 │                     │
│  │ Gets port via useWebSocketStatus()   │                     │
│  │ Creates iframe with ?port=12100      │                     │
│  └──────────────────────────────────────┘                     │
│                     ↓                                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ <iframe src="...?port=12100&chrome=true&mirror=true" /> │ │
│  │                                                          │ │
│  │  GUI (React/Vue/Vanilla)                               │ │
│  │  ┌────────────────────────────────────────────────┐   │ │
│  │  │ useWebSocketConfig() → { port: 12100, ... }   │   │ │
│  │  │ useWebSocketConnection() → Connects to 12100  │   │ │
│  │  │ useWebSocketSend() → Sends messages           │   │ │
│  │  └────────────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Message Flow

### Initial Connection

```
Chrome Extension                     VS Code Extension
       │                                     │
       │ 1. Try port 12100                   │
       ├────────────────────────────────────>│
       │                                     │
       │ 2. Connection established          │
       │<────────────────────────────────────┤
       │                                     │
       │ 3. Send PROJECT_PATH                │
       ├────────────────────────────────────>│
       │                                     │
       │ 4. Receive CONFIRM_CONNECTION       │
       │<────────────────────────────────────┤
       │                                     │
    CONNECTED ✓                           CONNECTED ✓
    Port: 12100                           Port: 12100
       │                                     │
```

### GUI Connection

```
Chrome Extension GUI                VS Code Extension
       │                                    │
       │ RightPanel creates iframe        │
       │ URL: ?port=12100                 │
       │                                    │
    GUI Loads                              │
       │                                    │
       │ useWebSocketConfig()              │
       │ → Reads ?port=12100 from URL      │
       │                                    │
       │ useWebSocketConnection()          │
       │ → Creates WebSocket               │
       │                                    │
       │ 1. ws = new WebSocket(port:12100)─────>│
       │                                    │
       │ 2. Connection open ✓<──────────────┤
       │                                    │
       │ 3. Send GUI_CONNECTED─────────────>│
       │                                    │
    CONNECTED ✓                        Receives GUI_CONNECTED
       │                                    │
```

### Two-Way Communication

```
GUI                  Browser          Extension
│                     │                  │
│ sendMessage() ──────────────────────────>│
│ (USER_ACTION)       │                  │
│                     │                  │
│                     │ Receives & Processes
│                     │                  │
│<──────────────── (FILE_UPDATE) ────────│
│                     │                  │
│ useWebSocketListener│                  │
│ Handler called      │                  │
│                     │                  │
```

## File Update Sequence

```
Step 1: Files Modified
├── src/components/RightPanel.tsx
│   └── Now uses useWebSocketStatus()
│   └── Passes port to iframe URL
│
└── Files Created
    ├── src/hooks/useWebSocketConfig.ts
    │   ├── useWebSocketConfig() - Get port from URL
    │   ├── useWebSocketConnection() - Connect to port
    │   └── useWebSocketSend() - Send messages
    │
    └── Documentation
        ├── WEBSOCKET_PORT_INTEGRATION.md
        ├── GUI_WEBSOCKET_INTEGRATION.md
        └── DYNAMIC_PORT_INTEGRATION_COMPLETE.md
```

## State Transitions

```
DISCONNECTED
    │
    ├─ useWebSocket mounts
    │
    ├─ Tries port 12100
    │
    ├─ [Port Busy]
    │  └─ Tries port 12101
    │
    ├─ [Port Available] ✓
    │  └─ CONNECTED (port: 12101)
    │
    └─ RightPanel detects connection
       └─ Creates iframe with ?port=12101
          └─ GUI loads
             └─ useWebSocketConfig() reads 12101
                └─ useWebSocketConnection() connects
                   └─ GUI READY ✓
```

## URL Parameter Flow

```
RightPanel Component
        │
        ├─ const { connected, connectionState } = useWebSocketStatus()
        │
        ├─ Check: connected === true
        │
        ├─ Extract: port = connectionState.port (12100)
        │
        ├─ Build URL: `...?port=${port}&chrome=true&mirror=true`
        │
        ├─ Create iframe with URL
        │
        └─ GUI loads
           │
           └─ const params = new URLSearchParams(window.location.search)
              │
              └─ const port = params.get('port')  // "12100"
                 │
                 └─ Connect to ws://localhost:12100 ✓
```

## Configuration Hierarchy

```
useWebSocket Hook (Port Discovery)
├── INITIAL_PORT = 12100
├── PORT_COUNT = 10 (tries 12100-12109)
├── MAX_ATTEMPTS = 20
└── RETRY_DELAY = 10000 ms
    │
    ├─ Tries ports incrementally
    ├─ Stores successful port in connectionState
    │
    └─► RightPanel reads port
        │
        ├─ Passes as URL parameter
        │
        └─► GUI reads parameter
            │
            └─ Connects to that port
```

## Error Handling Flow

```
Port 12100 (VS Code Extension using it)
        │
        ├─ useWebSocket tries port
        │
        ├─ Connection timeout (3 sec)
        │
        ├─ Port 12100 marked as unavailable
        │
        └─ Try next port: 12101 ✓
           │
           ├─ Success!
           │
           ├─ connectionState.port = 12101
           │
           ├─ connectionState.error = null
           │
           └─► RightPanel reads port 12101
               │
               └─ Creates iframe with ?port=12101
                  │
                  └─► GUI connects to 12101 ✓
```

## Connection Status UI

```
RightPanel Connection States:

[1] WAITING FOR CONNECTION
    └─ displayMsg: "Connecting..."

[2] CONNECTED WITH PORT
    └─ displayMsg: "Connected (Port: 12101)"
    └─ Iframe created with port in URL

[3] ERROR STATE
    └─ displayMsg: "Error: {error message}"
    └─ Show refresh button

[4] RECONNECTING
    └─ displayMsg: "Reconnecting... (Attempt 1/20)"
```

## Complete Data Path Example

```
Scenario: User sends message from GUI

┌─ GUI User clicks "Send"
│
├─ const { sendMessage } = useWebSocketSend()
│
├─ sendMessage("USER_ACTION", { data: "value" })
│
├─ Hook checks: ws.readyState === WebSocket.OPEN
│
├─ Sends JSON: { "type": "USER_ACTION", "payload": { "data": "value" } }
│
├─ WebSocket transport (ws://localhost:12101)
│
├─ VS Code Extension WebSocket receives
│
├─ Extension router processes message
│
├─ Extension performs action
│
├─ Extension sends response (e.g., "ACTION_COMPLETE")
│
├─ Sends JSON: { "type": "ACTION_COMPLETE", "payload": { ... } }
│
├─ WebSocket transport back (ws://localhost:12101)
│
├─ GUI WebSocket receives
│
├─ useWebSocketConfig hook emits event
│  "websocket-message-gui"
│
└─ GUI listener handles response
   └─ Updates UI accordingly ✓
```

## Port Discovery Timeline

```
Time    Chrome Extension          VS Code Extension
T=0     ├─ Mount useWebSocket     Already running with WebSocket server
        │
T=1     ├─ Try port 12100         [BUSY - VS Code using it]
        │
T=1.5   ├─ Timeout, try 12101     [AVAILABLE] ✓
        │
T=2     ├─ Connect successful      [Connection received]
        │
T=2.1   ├─ Send PROJECT_PATH       [Received & processed]
        │
T=2.5   ├─ Receive CONFIRM         [Sent confirmation]
        │
T=2.6   ├─ connectionState.port=   ✓ Connected!
        │   12101
        │
T=3     ├─ RightPanel detects
        │   connection & creates
        │   iframe
        │
T=3.5   ├─ GUI iframe loads
        │
T=4     ├─ GUI reads ?port=12101
        │
T=4.5   ├─ GUI connects to 12101   [Connection received]
        │
T=5     └─ GUI READY ✓             All systems connected!
```

## Summary

The system automatically:

1. **Discovers** available WebSocket port on startup
2. **Connects** Chrome extension to VS Code extension
3. **Passes** port number to GUI via URL parameter
4. **Enables** GUI to connect directly to same port
5. **Maintains** bidirectional communication
6. **Handles** port conflicts automatically
7. **Cleans up** connections on close

All transparent to the user! ✅
