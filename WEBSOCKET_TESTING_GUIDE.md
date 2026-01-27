# File Explorer WebSocket Integration - Testing & Usage Examples

## Quick Start Testing

### 1. Verify Extension Handler is Registered

In VSCode Extension output:

```
[FileExplorerManager] Workspace files handler registered
[FileExplorerManager] File content handler registered
```

### 2. Test WebSocket Connection

Open Chrome DevTools Console and run:

```javascript
// Check if websocket exists
console.log(window.__fileExplorerWs);

// Expected output: WebSocket {url: "ws://localhost:3001/ws", ...}
```

### 3. Test File Explorer Request

```javascript
// Send request for workspace files
window.__fileExplorerWs.send(
  JSON.stringify({
    type: "REDUX_MIRROR_VSCODE_EVENT",
    payload: {
      action: "getWorkspaceFiles",
      payload: {},
    },
  }),
);

// Listen for response
window.addEventListener("websocket-message", (event) => {
  console.log("Response:", event.detail);
});
```

Expected response:

```json
{
  "type": "workspaceFilesResponse",
  "payload": {
    "success": true,
    "files": [
      {
        "name": "src",
        "path": "src",
        "type": "folder",
        "children": [...]
      }
    ]
  }
}
```

## Manual Testing Scenarios

### Scenario 1: Load Files on Startup

**Steps:**

1. Open Chrome IDE
2. Wait for "Not connected" message to change to connected
3. Files should automatically load
4. Explorer should show file hierarchy

**Expected Behavior:**

- Files list populates within 2-5 seconds
- Folders show with expand/collapse arrows
- Files show with document icons
- All hidden files are filtered out

### Scenario 2: Click Reload Button

**Steps:**

1. Make changes to workspace (add/delete files)
2. Click "Reload" button in Explorer header
3. Wait for "Loading..." text to finish

**Expected Behavior:**

- Loading state shows while fetching
- File list updates with new structure
- No errors in browser console

### Scenario 3: Expand Folder

**Steps:**

1. Click folder icon next to a folder name
2. Observe children appear

**Expected Behavior:**

- Children of folder expand smoothly
- Folder icon changes from 📁 to 📂
- All child items are properly indented

### Scenario 4: File Selection

**Steps:**

1. Click a file name
2. Observe the file highlighting

**Expected Behavior:**

- Selected file gets blue highlight (accent color)
- Previously selected file loses highlight
- Selection state persists until another file is clicked

### Scenario 5: Connection Loss

**Steps:**

1. Stop VSCode extension
2. Observe Chrome UI

**Expected Behavior:**

- "Not connected to VSCode extension" message appears
- Reload button becomes disabled
- Auto-reconnection attempts every 3 seconds
- When VSCode extension restarts, connection re-establishes

## Advanced Testing

### Test Large Workspace

Create test scenario with deep nesting:

```
workspace/
├── level1/
│   ├── level2/
│   │   ├── level3/
│   │   │   └── file.ts
│   └── file.ts
├── node_modules/     (should be excluded)
├── .git/             (should be excluded)
└── dist/             (should be excluded)
```

**Test:** Ensure only levels 1-3 appear (max depth 15), and excluded folders are gone.

### Test Error Handling

**Scenario 1: No Workspace Open**

```javascript
// Close all workspace folders in VSCode
// Try to reload files in Chrome
```

Expected: "No workspace folder is open" error message

**Scenario 2: File Gets Deleted**

```javascript
// Delete a file while watching
// Reload files
```

Expected: File no longer appears in list

**Scenario 3: Permission Denied**

```javascript
// Create read-only file/folder (on Unix: chmod 000)
// Reload files
```

Expected: Error is caught, other files still load

## Code Examples

### Example 1: Manual WebSocket Message

```typescript
// In Chrome DevTools Console
const message = {
  type: "REDUX_MIRROR_VSCODE_EVENT",
  payload: {
    action: "getWorkspaceFiles",
    payload: {},
  },
};

window.__fileExplorerWs?.send(JSON.stringify(message));
```

### Example 2: Listen for All File Events

```typescript
// In Chrome DevTools Console
window.addEventListener("websocket-message", (event: CustomEvent) => {
  const { type, payload } = event.detail;

  switch (type) {
    case "workspaceFilesResponse":
      console.log("Files loaded:", payload.files);
      break;
    case "fileContentResponse":
      console.log(`Content of ${payload.path}:`, payload.content);
      break;
    default:
      console.log("Other message:", type);
  }
});
```

### Example 3: Request File Content

```typescript
// Request content of a specific file
window.__fileExplorerWs?.send(
  JSON.stringify({
    type: "REDUX_MIRROR_VSCODE_EVENT",
    payload: {
      action: "getFileContent",
      payload: {
        path: "src/App.tsx",
      },
    },
  }),
);
```

## Performance Testing

### Measure Initial Load Time

```javascript
// In Chrome DevTools Console
console.time("Load Files");

window.__fileExplorerWs?.send(
  JSON.stringify({
    type: "REDUX_MIRROR_VSCODE_EVENT",
    payload: { action: "getWorkspaceFiles", payload: {} },
  }),
);

window.addEventListener(
  "websocket-message",
  (event) => {
    if (event.detail.type === "workspaceFilesResponse") {
      console.timeEnd("Load Files");
    }
  },
  { once: true },
);
```

### Measure Memory Usage

```javascript
// Check performance
performance.memory &&
  console.log(
    "Heap used:",
    (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
    "MB",
  );
```

## Debug Logging

### Enable Debug Logs in useWebSocket

Modify `chrome/src/hooks/useWebSocket.ts`:

```typescript
const handleMessage = (event: MessageEvent) => {
  try {
    const data = JSON.parse(event.data);
    console.log("[WebSocket Debug]", data); // Add this line
    window.dispatchEvent(
      new CustomEvent("websocket-message", { detail: data }),
    );
  } catch (error) {
    console.error("Failed to parse websocket message:", error);
  }
};
```

### Enable Debug Logs in FileExplorerManager

Modify `extensions/vscode/src/util/FileExplorerManager.ts`:

```typescript
static async getWorkspaceFileHierarchy(): Promise<FileItem[]> {
  console.log('[FileExplorerManager] Getting workspace file hierarchy');

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    console.log('[FileExplorerManager] No workspace folders found');
    return [];
  }

  // ... rest of code
  console.log('[FileExplorerManager] Found', results.length, 'root items');
  return results;
}
```

## Troubleshooting

### Issue: "Not connected to VSCode extension"

**Causes:**

1. VSCode extension not running
2. ReduxMirrorBridge not started
3. Port 3001 is in use
4. Network issues

**Solutions:**

```bash
# Check if port 3001 is in use
lsof -i :3001

# Restart VSCode extension
# Restart Chrome dev server
```

### Issue: Files don't load after clicking Reload

**Check:**

1. Browser console for WebSocket errors
2. VSCode extension output for FileExplorerManager errors
3. Network tab in DevTools to see WebSocket messages

```javascript
// In browser console
window.__fileExplorerWs.readyState; // Should be 1 (OPEN)
```

### Issue: Folders don't expand

**Check:**

1. Click expand button (small arrow/folder icon)
2. Check browser console for JavaScript errors
3. Verify folder has children in the data

```javascript
// In browser console
// Check if folder has children
console.log(files.find((f) => f.type === "folder"));
```

### Issue: Very slow file loading

**Optimizations:**

1. Check for large node_modules or dist folders (should be excluded)
2. Reduce file system load by checking `IGNORED_PATTERNS`
3. Adjust max recursion depth in FileExplorerManager

```typescript
// In FileExplorerManager.ts, line 31
const maxDepth = 10; // Reduce from 15 if needed
```

## Browser DevTools Tips

### Monitor All WebSocket Messages

1. Open DevTools → Network tab
2. Filter for "WS"
3. Click on the WebSocket connection
4. View Messages tab

### Inspect React Component State

1. Install React Developer Tools browser extension
2. Open DevTools → Components tab
3. Select FileExplorer component
4. Check `files` state in right panel

## Integration Testing

### Test with Real VSCode Project

1. Open an existing VSCode project
2. Launch the Chrome IDE
3. Verify all files appear correctly
4. Test with project that has:
   - Nested folders
   - Many files
   - Node_modules
   - Hidden files

### Test Connection Resilience

1. Open Chrome IDE
2. Files should load
3. Restart VSCode extension
4. Chrome should reconnect automatically
5. Files should reload

## Performance Baseline

For a typical project (node, react, typescript):

| Metric                              | Value        |
| ----------------------------------- | ------------ |
| Initial load time                   | 1-3 seconds  |
| File count (excluding node_modules) | 50-200 items |
| Memory usage                        | 5-15 MB      |
| Reconnection time                   | <1 second    |
| Folder expand animation             | <100ms       |

Adjust expectations based on your project size.
