# Quick Reference - File Explorer WebSocket Integration

## At a Glance

| Item                      | Value                     |
| ------------------------- | ------------------------- |
| **WebSocket Port**        | 3001                      |
| **WebSocket Path**        | /ws                       |
| **Max Directory Depth**   | 15 levels                 |
| **Connection Timeout**    | 3 seconds (reconnect)     |
| **Browser Console Check** | `window.__fileExplorerWs` |

## Starting the System

```bash
# Terminal 1: Start VSCode Extension
cd /Users/harishpittu/Documents/Pittu/raplify-agent
npm run dev

# Terminal 2: Start Chrome IDE (different directory)
cd chrome
npm run dev

# Open http://localhost:5175 in browser
```

## Key Files to Know

```
VSCode Extension:
  extensions/vscode/src/util/FileExplorerManager.ts        ← File system ops
  extensions/vscode/src/extension/VsCodeExtension.ts       ← Message routing

Chrome IDE:
  chrome/src/hooks/useWebSocket.ts                         ← WebSocket mgmt
  chrome/src/components/FileExplorer.tsx                   ← UI component
```

## Common Tasks

### Add New File Explorer Command

1. **Add method in FileExplorerManager:**

```typescript
static async myCommand(param: string): Promise<any> {
  // Implementation
  return result;
}
```

2. **Add handler in VsCodeExtension.ts:**

```typescript
if (mirrorMessage.action === "myCommand") {
  const result = await FileExplorerManager.myCommand(payload.param);
  reduxMirrorBridge.broadcast("myCommandResponse", {
    success: true,
    data: result,
  });
  return;
}
```

3. **Use in Chrome:**

```typescript
sendMessage({
  type: "REDUX_MIRROR_VSCODE_EVENT",
  payload: {
    action: "myCommand",
    payload: { param: "value" },
  },
});

// Listen for response
window.addEventListener("websocket-message", (event: CustomEvent) => {
  if (event.detail.type === "myCommandResponse") {
    console.log(event.detail.payload);
  }
});
```

### Check WebSocket Status

**In Browser Console:**

```javascript
// Check if connected
window.__fileExplorerWs?.readyState === 1 ? "Connected" : "Disconnected";

// Send test message
window.__fileExplorerWs?.send(
  JSON.stringify({
    type: "REDUX_MIRROR_VSCODE_EVENT",
    payload: {
      action: "getWorkspaceFiles",
      payload: {},
    },
  }),
);

// Listen for response
window.addEventListener("websocket-message", (e) => {
  console.log("Response:", e.detail);
});
```

### Change WebSocket Port

1. **In useWebSocket.ts:**

```typescript
const REDUX_MIRROR_WS_PORT = 3002; // Change from 3001
```

2. **In VSCode Extension (activate.ts):**

```typescript
const reduxMirrorBridge = new ReduxMirrorBridge({
  port: 3002, // Add this
});
```

### Debug File System Operations

**Add logging to FileExplorerManager.ts:**

```typescript
static async getWorkspaceFileHierarchy(): Promise<FileItem[]> {
  console.log('[FileExplorerManager] Starting hierarchy load');

  const workspaceFolders = vscode.workspace.workspaceFolders;
  console.log('[FileExplorerManager] Found', workspaceFolders?.length, 'folders');

  // ... rest of code

  console.log('[FileExplorerManager] Returning', results.length, 'items');
  return results;
}
```

### Test Large Workspace

```bash
# Create nested test structure
mkdir -p workspace/level1/level2/level3/level4/level5
touch workspace/level1/file1.txt
touch workspace/level1/level2/file2.txt
touch workspace/level1/level2/level3/file3.txt

# Open in VSCode and reload files in Chrome IDE
```

## Excluded Patterns (Filters)

Files and folders matching these patterns are NOT shown:

```
/^\./           - Hidden files (.git, .env, etc.)
/node_modules/  - Dependencies
/\.git/         - Git folder
/dist/          - Build output
/build/         - Build output
```

To add more, modify in `FileExplorerManager.ts`:

```typescript
private static IGNORED_PATTERNS = [
  /^\./,
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /\.next/,      // Add Next.js
  /\.cache/,     // Add cache
];
```

## Response Types

### workspaceFilesResponse

```typescript
{
  type: "workspaceFilesResponse",
  payload: {
    success: true,
    files: FileItem[]
  }
}
```

### fileContentResponse

```typescript
{
  type: "fileContentResponse",
  payload: {
    success: true,
    path: string,
    content: string
  }
}
```

### Error Response

```typescript
{
  type: "*Response",
  payload: {
    success: false,
    error: string
  }
}
```

## TypeScript Interfaces

```typescript
// File item in hierarchy
interface FileItem {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileItem[];
}

// WebSocket hook return
interface UseWebSocketReturn {
  connected: boolean;
  sendMessage: (msg: WebSocketMessage) => void;
  socket: WebSocket | null;
}

// VSCode message
interface MirrorVsCodeMessage {
  action: string;
  payload: unknown;
}
```

## Troubleshooting One-Liners

```javascript
// Check connection
window.__fileExplorerWs?.readyState; // 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED

// Send test
window.__fileExplorerWs?.send(
  JSON.stringify({
    type: "REDUX_MIRROR_VSCODE_EVENT",
    payload: { action: "getWorkspaceFiles", payload: {} },
  }),
);

// Monitor all messages
window.addEventListener("websocket-message", (e) => console.log(e.detail));

// Check file explorer state (React DevTools)
// Select FileExplorer component → Check "files" state

// Force reconnect
window.location.reload();
```

## Performance Tips

1. **Reduce max depth** if slow:

   ```typescript
   const maxDepth = 10; // Default is 15
   ```

2. **Add more exclusions** for large workspaces:

   ```typescript
   /\.next/,
   /\.cache/,
   /\.pytest_cache/,
   ```

3. **Check file count:**
   ```typescript
   // In FileExplorerManager
   console.log("Total files found:", items.length);
   ```

## Common Error Messages

| Message                       | Cause                        | Solution                  |
| ----------------------------- | ---------------------------- | ------------------------- |
| "Not connected"               | VSCode extension not running | Start VSCode extension    |
| "No workspace folder is open" | No folder open in VSCode     | Open a folder in VSCode   |
| "Permission denied"           | Cannot read directory        | Check file permissions    |
| WebSocket reconnecting        | Network disconnected         | Check connection, wait 3s |

## Related Files

- **Main guide:** `WEBSOCKET_FILE_EXPLORER_GUIDE.md`
- **Testing guide:** `WEBSOCKET_TESTING_GUIDE.md`
- **Architecture:** `SYSTEM_ARCHITECTURE.md`
- **Checklist:** `IMPLEMENTATION_CHECKLIST.md`
- **Summary:** `FILE_EXPLORER_SUMMARY.md`

## Code Snippets

### Send File Hierarchy Request

```typescript
const { sendMessage } = useWebSocket();

sendMessage({
  type: "REDUX_MIRROR_VSCODE_EVENT",
  payload: {
    action: "getWorkspaceFiles",
    payload: {},
  },
});
```

### Listen for File Updates

```typescript
useEffect(() => {
  const handleMessage = (event: CustomEvent) => {
    if (event.detail.type === "workspaceFilesResponse") {
      setFiles(event.detail.payload.files);
    }
  };

  window.addEventListener("websocket-message", handleMessage);
  return () => window.removeEventListener("websocket-message", handleMessage);
}, []);
```

### Render File Tree Recursively

```typescript
const renderFileTree = (items: FileItem[], depth = 0) => {
  return items.map(item => (
    <div key={item.path} style={{ marginLeft: `${depth * 20}px` }}>
      {item.type === 'folder' ? (
        <div onClick={() => toggleFolder(item.path)}>
          📁 {item.name}
        </div>
      ) : (
        <div>📄 {item.name}</div>
      )}
      {isExpanded(item.path) && item.children &&
        renderFileTree(item.children, depth + 1)}
    </div>
  ));
};
```

## References

- VSCode Extension API: https://code.visualstudio.com/api
- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- React Hooks: https://react.dev/reference/react/hooks
- TypeScript Handbook: https://www.typescriptlang.org/docs/

## Support

For detailed information, see the comprehensive guides in the root directory.
For troubleshooting, refer to `WEBSOCKET_TESTING_GUIDE.md`.
