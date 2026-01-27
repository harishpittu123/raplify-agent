# GUI WebSocket Port Integration

## Summary

Updated the GUI to read the WebSocket port from URL parameters (just like the `mirror` flag), instead of using a hardcoded port value.

## Changes Made

### 1. Mirror Constants (`gui/src/mirror/constants.ts`)

**Added:**

```typescript
export const REDUX_MIRROR_WS_PORT_QUERY_PARAM = "port";
```

**Updated:**

```typescript
// Before
export const REDUX_MIRROR_WS_PORT = 65434;

// After
export const REDUX_MIRROR_WS_PORT = 65434; // Fallback port if not provided in URL
```

### 2. Mirror Bridge Client (`gui/src/mirror/mirrorBridgeClient.ts`)

**Imported the new constant:**

```typescript
import {
  // ...existing imports...
  REDUX_MIRROR_WS_PORT_QUERY_PARAM,
} from "./constants";
```

**Updated `buildSocketUrl()` function:**

```typescript
// Before
const buildSocketUrl = (): string => {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.hostname || "localhost";
  return `${protocol}://${host}:${REDUX_MIRROR_WS_PORT}${REDUX_MIRROR_WS_PATH}`;
};

// After
const buildSocketUrl = (): string => {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.hostname || "localhost";

  // Get port from URL parameters, fallback to constant
  const params = new URLSearchParams(window.location.search);
  const portFromUrl = params.get(REDUX_MIRROR_WS_PORT_QUERY_PARAM);
  const port = portFromUrl ? parseInt(portFromUrl, 10) : REDUX_MIRROR_WS_PORT;

  return `${protocol}://${host}:${port}${REDUX_MIRROR_WS_PATH}`;
};
```

## How It Works

### URL Parameter Reading

The GUI now reads the WebSocket port from URL parameters in the same way it reads the `mirror` flag:

```
URL: http://localhost:5173/gui.html?mirror=true&port=12100&chrome=true

mirror=true  → Mirror mode enabled
port=12100   → WebSocket port (NEW!)
chrome=true  → Chrome extension context
```

### Port Resolution

The `buildSocketUrl()` function:

1. Checks if `port` parameter is provided in URL
2. If yes, uses that port
3. If no, falls back to `REDUX_MIRROR_WS_PORT` (65434)

```typescript
const portFromUrl = params.get(REDUX_MIRROR_WS_PORT_QUERY_PARAM); // "12100" or null
const port = portFromUrl ? parseInt(portFromUrl, 10) : REDUX_MIRROR_WS_PORT; // 12100 or 65434
```

## Usage Scenarios

### Scenario 1: Port from RightPanel (Chrome Extension)

When RightPanel creates the iframe, it passes the dynamically discovered port:

```
RightPanel (Chrome Extension)
    ↓
Reads connectionState.port (12100)
    ↓
Creates iframe: http://localhost:5173/gui.html?port=12100&mirror=true&chrome=true
    ↓
GUI loads
    ↓
Reads ?port=12100 from URL
    ↓
Connects to ws://localhost:12100/mirror
```

### Scenario 2: Standalone Mirror Mode

Mirror mode can still work without the port parameter:

```
URL: http://localhost:5173/gui.html?mirror=true

No port parameter
    ↓
Falls back to REDUX_MIRROR_WS_PORT (65434)
    ↓
Connects to ws://localhost:65434/mirror
```

## Benefits

✅ **Consistent with Mirror Flag Pattern** - Uses same URL parameter approach  
✅ **Dynamic Port Support** - Works with any port discovered by Chrome extension  
✅ **Backward Compatible** - Falls back to hardcoded port if parameter not provided  
✅ **Clean Code** - No duplicated port detection logic

## Files Modified

- `gui/src/mirror/constants.ts` - Added port query param constant
- `gui/src/mirror/mirrorBridgeClient.ts` - Updated to read port from URL params

## Testing

### Test with Custom Port

1. Open GUI with custom port in URL:

```
http://localhost:5173/gui.html?mirror=true&port=12101
```

2. Check in browser console:

```javascript
const params = new URLSearchParams(window.location.search);
console.log("Port from URL:", params.get("port")); // "12101"
```

3. Verify WebSocket connection in DevTools Network tab:

```
ws://localhost:12101/mirror
```

### Test with Fallback Port

1. Open GUI without port parameter:

```
http://localhost:5173/gui.html?mirror=true
```

2. Verify WebSocket connects to default port:

```
ws://localhost:65434/mirror
```

## Related Files

- [gui/src/mirror/mirrorBridgeClient.ts](../gui/src/mirror/mirrorBridgeClient.ts) - Main WebSocket bridge
- [gui/src/mirror/constants.ts](../gui/src/mirror/constants.ts) - Configuration constants
- [chrome/src/components/RightPanel.tsx](../chrome/src/components/RightPanel.tsx) - Passes port to GUI
- [chrome/src/hooks/useWebSocketStatus.ts](../chrome/src/hooks/useWebSocketListener.ts) - Gets port from connection

## Complete Integration Flow

```
VS Code Extension
    ↓ Creates WebSocket server on available port (12100)
    ↓
Chrome Extension useWebSocket()
    ↓ Connects and gets port (12100)
    ↓
RightPanel reads port via useWebSocketStatus()
    ↓ Creates iframe: ?port=12100
    ↓
GUI mirrorBridgeClient reads port from URL params
    ↓ Builds WebSocket URL: ws://localhost:12100/mirror
    ↓
Mirror WebSocket connected!
```

## Migration Notes

For existing deployments:

- If GUI is loaded without port parameter, it will use fallback port (65434)
- RightPanel will automatically pass port when available
- No action needed for existing code
