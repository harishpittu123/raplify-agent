# GUI WebSocket Integration Guide

## Overview

The GUI iframe receives the WebSocket port dynamically from the Chrome extension via URL parameters. This guide shows how to connect and use the WebSocket in your GUI code.

## Quick Start

### Option 1: Using the Provided Hooks (Recommended)

If your GUI is built with React, use the provided hooks from `src/hooks/useWebSocketConfig.ts`:

```tsx
import {
  useWebSocketConnection,
  useWebSocketSend,
} from "../hooks/useWebSocketConfig";

export function MyGuiComponent() {
  const { connected, error, config } = useWebSocketConnection();
  const { sendMessage } = useWebSocketSend();

  if (error) {
    return <div>WebSocket Error: {error}</div>;
  }

  if (!connected) {
    return <div>Connecting to port {config.port}...</div>;
  }

  const handleClick = () => {
    sendMessage("ACTION", { action: "do_something" });
  };

  return (
    <div>
      ✓ Connected on port {config.port}
      <button onClick={handleClick}>Send Action</button>
    </div>
  );
}
```

### Option 2: Manual WebSocket Connection

If you prefer direct control or your GUI isn't in React:

```typescript
// Get the WebSocket port from URL parameters
const params = new URLSearchParams(window.location.search);
const wsPort = params.get("port");

if (!wsPort) {
  console.error("No WebSocket port provided");
} else {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const wsUrl = `${protocol}://localhost:${wsPort}`;

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log(`Connected to WebSocket on port ${wsPort}`);

    // Send initial message
    ws.send(
      JSON.stringify({
        type: "GUI_CONNECTED",
        payload: { source: "gui" },
      }),
    );
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Received:", data);
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  ws.onclose = () => {
    console.log("WebSocket closed");
  };
}
```

## Available URL Parameters

The GUI iframe URL includes several parameters passed from the Chrome extension:

```
http://localhost:5173/gui.html?mirror=true&chrome=true&port=12100
```

| Parameter | Value         | Meaning                                       |
| --------- | ------------- | --------------------------------------------- |
| `port`    | `12100-12109` | WebSocket port (varies based on availability) |
| `chrome`  | `true/false`  | Running in Chrome extension context           |
| `mirror`  | `true/false`  | Mirror mode enabled                           |

### Accessing Parameters

```typescript
const params = new URLSearchParams(window.location.search);

const port = params.get("port"); // "12100"
const isChrome = params.get("chrome"); // "true"
const isMirror = params.get("mirror"); // "true"
```

## Detailed Hook Usage

### useWebSocketConfig()

Get WebSocket configuration from URL parameters:

```tsx
import { useWebSocketConfig } from "../hooks/useWebSocketConfig";

const config = useWebSocketConfig();
// Returns: {
//   port: 12100,
//   protocol: "ws",
//   host: "localhost",
//   url: "ws://localhost:12100",
//   isChromeExtension: true,
//   isMirrorMode: true
// }
```

### useWebSocketConnection()

Create and manage the WebSocket connection:

```tsx
import { useWebSocketConnection } from "../hooks/useWebSocketConfig";

const { ws, connected, error, config } = useWebSocketConnection();

// connected: boolean - is connected
// error: string | null - error message if any
// config: WebSocketConfig - the configuration object
// ws: WebSocket | null - raw WebSocket instance
```

### useWebSocketSend()

Send messages through the WebSocket:

```tsx
import { useWebSocketSend } from "../hooks/useWebSocketConfig";

const { sendMessage, connected, ws } = useWebSocketSend();

// Send a message
if (connected) {
  sendMessage("FILE_UPDATE", {
    path: "/file.txt",
    content: "new content",
  });
}
```

## Complete Example

### React Component

```tsx
import React, { useEffect, useState } from "react";
import {
  useWebSocketConnection,
  useWebSocketSend,
} from "../hooks/useWebSocketConfig";

export function GuiApp() {
  const { connected, error, config } = useWebSocketConnection();
  const { sendMessage } = useWebSocketSend();
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Listen for messages
    const handleMessage = (event: CustomEvent) => {
      setMessages((prev) => [...prev, event.detail]);
    };

    window.addEventListener(
      "websocket-message-gui",
      handleMessage as EventListener,
    );
    return () =>
      window.removeEventListener(
        "websocket-message-gui",
        handleMessage as EventListener,
      );
  }, []);

  if (error) {
    return (
      <div style={{ color: "red" }}>
        <h2>Connection Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div>
        <p>Connecting to port {config.port}...</p>
      </div>
    );
  }

  const handleSendMessage = () => {
    sendMessage("USER_ACTION", {
      action: "button_clicked",
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div>
      <h1>GUI Connected</h1>
      <p>WebSocket port: {config.port}</p>
      <p>Protocol: {config.protocol}</p>
      <p>Is Chrome Extension: {config.isChromeExtension ? "Yes" : "No"}</p>

      <button onClick={handleSendMessage}>Send Message to Extension</button>

      <h2>Received Messages</h2>
      <ul>
        {messages.map((msg, i) => (
          <li key={i}>
            <strong>{msg.type}</strong>: {JSON.stringify(msg.payload)}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
  <head>
    <title>GUI WebSocket</title>
  </head>
  <body>
    <div id="status">Connecting...</div>
    <button id="sendBtn">Send Message</button>
    <ul id="messages"></ul>

    <script>
      let ws = null;

      function connectWebSocket() {
        const params = new URLSearchParams(window.location.search);
        const port = params.get("port");

        if (!port) {
          document.getElementById("status").textContent =
            "Error: No port provided";
          return;
        }

        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${protocol}://localhost:${port}`;

        console.log(`Connecting to ${wsUrl}`);
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("Connected");
          document.getElementById("status").textContent =
            `✓ Connected (Port: ${port})`;

          // Send initial message
          ws.send(
            JSON.stringify({
              type: "GUI_CONNECTED",
              payload: { source: "gui" },
            }),
          );
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const messageList = document.getElementById("messages");
          const li = document.createElement("li");
          li.textContent = `${data.type}: ${JSON.stringify(data.payload)}`;
          messageList.appendChild(li);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          document.getElementById("status").textContent = "✗ Connection Error";
        };

        ws.onclose = () => {
          console.log("Disconnected");
          document.getElementById("status").textContent = "✗ Disconnected";
        };
      }

      document.getElementById("sendBtn").addEventListener("click", () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "USER_ACTION",
              payload: { action: "button_clicked" },
            }),
          );
        } else {
          alert("WebSocket not connected");
        }
      });

      // Start connection when page loads
      window.addEventListener("DOMContentLoaded", connectWebSocket);
    </script>
  </body>
</html>
```

## Message Format

All messages use this format:

```typescript
{
  type: "MESSAGE_TYPE",    // String identifier
  payload: { ... }         // Any data object
}
```

### Sending

```tsx
sendMessage("FILE_SAVE", {
  path: "/path/to/file",
  content: "file content",
  timestamp: new Date().toISOString(),
});
```

### Receiving

Messages are received through:

**Option 1: Custom Event**

```typescript
window.addEventListener("websocket-message-gui", (event: CustomEvent) => {
  const { type, payload } = event.detail;
  console.log(`Received ${type}:`, payload);
});
```

**Option 2: Direct WebSocket Handler**

```typescript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

## Common Message Types

### From GUI to Extension

| Type            | Payload                 | Meaning                     |
| --------------- | ----------------------- | --------------------------- |
| `GUI_CONNECTED` | `{ source, timestamp }` | GUI connected               |
| `USER_ACTION`   | `{ action, ... }`       | User performed action       |
| `REQUEST_DATA`  | `{ query, ... }`        | Request data from extension |
| `SAVE_FILE`     | `{ path, content }`     | Save file request           |

### From Extension to GUI

| Type             | Payload             | Meaning                  |
| ---------------- | ------------------- | ------------------------ |
| `FILE_CHANGED`   | `{ path, content }` | File was changed         |
| `PROJECT_UPDATE` | `{ files, ... }`    | Project state updated    |
| `DATA_RESPONSE`  | `{ data, ... }`     | Response to data request |
| `ERROR`          | `{ message, code }` | Error occurred           |

## Error Handling

### Connection Errors

```tsx
const { error, config } = useWebSocketConnection();

if (error) {
  console.error(`Failed to connect to port ${config.port}: ${error}`);
  // Show error UI or retry
}
```

### Message Errors

```tsx
const { sendMessage, connected } = useWebSocketSend();

if (!connected) {
  console.warn("WebSocket not connected, cannot send message");
  return;
}

try {
  sendMessage("ACTION", { data: "value" });
} catch (err) {
  console.error("Failed to send message:", err);
}
```

## Debugging

### Enable Console Logging

The hooks automatically log to console:

```
[GUI WebSocket] Attempting to connect on port 12100
[GUI WebSocket] Connected to ws://localhost:12100
[GUI WebSocket] Received message: { type: "FILE_CHANGED", payload: { ... } }
```

### Check URL Parameters

```javascript
const params = new URLSearchParams(window.location.search);
console.log("URL Parameters:");
console.log("- port:", params.get("port"));
console.log("- chrome:", params.get("chrome"));
console.log("- mirror:", params.get("mirror"));
```

### Inspect WebSocket Connection

```javascript
const config = useWebSocketConfig();
console.log("WebSocket Config:", config);
// {
//   port: 12100,
//   protocol: "ws",
//   host: "localhost",
//   url: "ws://localhost:12100",
//   isChromeExtension: true,
//   isMirrorMode: true
// }
```

## Cleanup

### React Components

Cleanup happens automatically:

```tsx
useEffect(() => {
  return () => {
    // useWebSocketConnection automatically closes connection
  };
}, []);
```

### Manual WebSocket

```typescript
// When closing
if (ws) {
  ws.close();
}
```

## Testing

### In Browser Console

```javascript
// Check if port is available
const params = new URLSearchParams(window.location.search);
console.log("Port:", params.get("port"));

// Check connection status
const event = new CustomEvent("websocket-message-gui", {
  detail: { type: "TEST", payload: { message: "test" } },
});
window.dispatchEvent(event);
```

### Manual WebSocket Test

```javascript
const ws = new WebSocket("ws://localhost:12100");
ws.onopen = () => ws.send(JSON.stringify({ type: "TEST", payload: {} }));
ws.onmessage = (e) => console.log(e.data);
```

## Files Reference

- [useWebSocketConfig Hook](../src/hooks/useWebSocketConfig.ts)
- [RightPanel (passes port)](../src/components/RightPanel.tsx)
- [Port Integration Guide](WEBSOCKET_PORT_INTEGRATION.md)
- [WebSocket Usage Guide](WEBSOCKET_USAGE_GUIDE.md)

## Troubleshooting

### GUI not connecting

1. Check browser console for errors
2. Verify port in URL: `?port=12100`
3. Check VS Code extension is running
4. Verify firewall allows port
5. Check protocol: ws:// vs wss://

### Messages not received

1. Verify WebSocket is connected
2. Check message type is correct
3. Check browser DevTools Network tab
4. Verify extension is sending messages

### Port changes

If you see different ports (12101, 12102, etc.):

- This is normal - the system finds the first available port
- Check the URL parameters in the iframe

## Next Steps

1. Integrate hooks into your GUI components
2. Define custom message types for your use case
3. Implement message handlers
4. Test WebSocket communication
5. Monitor connection status in UI
