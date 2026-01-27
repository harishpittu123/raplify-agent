# WebSocket Port Configuration & GUI Integration

## Overview

The RightPanel now dynamically passes the connected WebSocket port to the GUI iframe, allowing seamless WebSocket communication between the GUI and the VS Code extension.

## How It Works

### 1. Port Discovery (VS Code Extension Side)

The WebSocket connection process:

- **Tries ports:** 12100 - 12109 (configurable via `INITIAL_PORT` and `PORT_COUNT`)
- **Waits per port:** 3 seconds for connection
- **Auto-retries:** Up to 20 times with 10-second delays
- **Incremental approach:** If port 12100 is busy, tries 12101, 12102, etc.

### 2. Port Detection (Chrome Extension)

The `useWebSocket` hook:

- Manages the WebSocket connection
- Stores the successfully connected port in `connectionState.port`
- Updates when connection is established

### 3. Port Passing to GUI

The `RightPanel` component:

- Uses `useWebSocketStatus()` to get the connected port
- Waits for connection to establish (`connected === true`)
- Passes the port to the GUI iframe URL: `?port=12100` (or whatever port was found)
- Only creates iframe once connection is ready

## Configuration

### Change Port Range

Edit `src/hooks/useWebSocket.ts`:

```typescript
const INITIAL_PORT = 12100; // Starting port
const PORT_COUNT = 10; // Number of ports to try (12100-12109)
const MAX_ATTEMPTS = 20; // Max retry attempts
const RETRY_DELAY = 10000; // 10 seconds between retries
```

To try ports 12100-12119:

```typescript
const PORT_COUNT = 20;
```

To start from a different port:

```typescript
const INITIAL_PORT = 13000;
```

## Using the Port in GUI

### In the GUI's main script

The port is passed as a URL parameter:

```
http://localhost:5173/gui.html?mirror=true&chrome=true&port=12100
```

To access it:

```typescript
// In your GUI code
const params = new URLSearchParams(window.location.search);
const wsPort = params.get("port");
console.log(`Connecting to WebSocket on port: ${wsPort}`);

// Connect to WebSocket
const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${protocol}://localhost:${wsPort}`);
```

### Complete Example

```typescript
// gui.html or your GUI's main setup file
document.addEventListener("DOMContentLoaded", () => {
  // Get WebSocket port from URL
  const params = new URLSearchParams(window.location.search);
  const wsPort = params.get("port");

  if (wsPort) {
    console.log(`[GUI] Connecting to WebSocket on port ${wsPort}`);

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://localhost:${wsPort}`);

    ws.onopen = () => {
      console.log(`[GUI] WebSocket connected on port ${wsPort}`);
      // Send any initialization messages
      ws.send(
        JSON.stringify({
          type: "GUI_CONNECTED",
          payload: { source: "gui" },
        }),
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(`[GUI] Received message:`, data);
      // Handle messages from VS Code extension
    };

    ws.onerror = (error) => {
      console.error(`[GUI] WebSocket error:`, error);
    };

    ws.onclose = () => {
      console.log(`[GUI] WebSocket closed`);
    };
  } else {
    console.warn("[GUI] No WebSocket port provided");
  }
});
```

## RightPanel Implementation Details

### Code Flow

```
RightPanel mounts
    ↓
useWebSocketStatus() gets connected state and port
    ↓
When connected === true AND port is available
    ↓
Create iframe with port in URL
    ↓
GUI loads and reads port from URL
    ↓
GUI connects to WebSocket on that port
    ↓
Communication established
```

### State Management

```typescript
const { connected, connectionState } = useWebSocketStatus();
// connected: boolean - whether WebSocket is connected
// connectionState.port: number | null - the connected port (12100, 12101, etc.)
// connectionState.attempts: number - retry attempts
// connectionState.error: string | null - error message if any
```

## Cleanup on Project Close

When the project is closed:

### 1. Chrome Extension Side

- The WebSocket connection is maintained by `useWebSocket`
- Auto-reconnect is disabled when connection closes
- Listeners are cleaned up when components unmount

### 2. VS Code Extension Side (Should implement)

When the extension's workspace is closed:

```typescript
// In your VS Code extension
const webSocketServer = /* your server instance */;

// On workspace close
vscode.workspace.onDidCloseTextDocument(() => {
  // Close WebSocket server for this port
  webSocketServer.close();
  console.log(`WebSocket server closed on port ${port}`);
});

// Or better: track workspace and close on workspace change
let currentWorkspacePort: number | null = null;

export function activateExtension(context: vscode.ExtensionContext) {
  // Start WebSocket server
  const port = findAvailablePort(12100);
  const server = createWebSocketServer(port);
  currentWorkspacePort = port;

  // Clean up on deactivation
  context.subscriptions.push({
    dispose: () => {
      if (currentWorkspacePort && server) {
        server.close();
        console.log(`Closed WebSocket on port ${currentWorkspacePort}`);
      }
    }
  });
}
```

## Data Flow Diagram

```
VS Code Extension
    ↓
WebSocket Server (port: 12100 or next available)
    ↓
Chrome Extension
    ├─ useWebSocket (gets port, stores in connectionState)
    ├─ RightPanel (reads port from useWebSocketStatus)
    └─ GUI iframe (receives port via URL parameter)
         ↓
    Connects to WebSocket on port
         ↓
    Two-way communication established
```

## Environment Setup

### Development

- VS Code extension starts WebSocket server on port 12100 (or first available)
- Chrome extension connects to it
- RightPanel passes port to GUI
- GUI connects back to same port

### Configuration Files to Check

1. **VS Code Extension:** Check where it creates WebSocket server

   - Ensure it tries ports 12100-12109
   - Log the port it settled on
   - Pass this info back to chrome extension

2. **Chrome Extension:** Already configured

   - [src/hooks/useWebSocket.ts](src/hooks/useWebSocket.ts) - port discovery
   - [src/components/RightPanel.tsx](src/components/RightPanel.tsx) - port passing

3. **GUI:** Needs to read and use the port
   - Check gui.html or main GUI entry point
   - Extract `port` from URL parameters
   - Connect to `ws://localhost:${port}`

## Testing

### Manual Testing

1. Check browser console in Chrome extension:

   ```
   [RightPanel] Connected to port 12100
   ```

2. Check GUI iframe's console:

   ```
   [GUI] Connecting to WebSocket on port 12100
   [GUI] WebSocket connected on port 12100
   ```

3. Send messages through `useWebSocketListener`:

   ```tsx
   const { sendMessage } = useWebSocketSend();
   sendMessage("TEST", { message: "Hello from Chrome" });
   ```

4. See in GUI console:
   ```
   [GUI] Received message: { type: "TEST", payload: { message: "Hello from Chrome" } }
   ```

## Troubleshooting

### GUI not showing

- Check if `connected === true` in RightPanel
- Check browser DevTools: is iframe created?
- Check iframe src URL has correct port parameter

### GUI not connecting to WebSocket

- Verify port number is passed in URL
- Check VS Code extension is running on that port
- Check firewall isn't blocking the port
- Check WebSocket protocol (ws vs wss)

### Port conflicts

- Check which processes are using ports 12100-12109
- Increase `PORT_COUNT` to try more ports
- Change `INITIAL_PORT` to start from a different port

### Connection lost

- Check `connectionState.error` in RightPanel
- Auto-reconnect will retry every 10 seconds
- Click "Retry Connection" button if available

## Files Modified

- [src/components/RightPanel.tsx](src/components/RightPanel.tsx) - Now uses dynamic port
- No changes needed to [src/hooks/useWebSocket.ts](src/hooks/useWebSocket.ts) - already tracks port

## Next Steps

1. **Update GUI code** to read `port` from URL parameters
2. **Test connection** with manual WebSocket messages
3. **Implement cleanup** in VS Code extension when workspace closes
4. **Monitor port usage** in development and production

## References

- [WebSocket Hook Implementation](src/hooks/useWebSocket.ts)
- [RightPanel Component](src/components/RightPanel.tsx)
- [WebSocket Usage Guide](WEBSOCKET_USAGE_GUIDE.md)
- [Type Definitions](src/types/websocket.ts)
