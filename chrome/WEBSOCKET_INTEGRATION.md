# File Explorer WebSocket Integration

This implementation connects the Chrome-based IDE interface with the VSCode extension to provide real-time file hierarchy exploration and content viewing through WebSocket communication.

## Architecture

### VSCode Extension (Backend)

**Location:** `extensions/vscode/src/util/FileExplorerManager.ts`

The `FileExplorerManager` class handles all file system operations:

- **getWorkspaceFileHierarchy()** - Recursively reads all files and folders from the workspace

  - Excludes: hidden files/folders (starting with `.`), `node_modules`, `.git`, `dist`, `build`
  - Returns hierarchical structure with file types and paths
  - Max depth: 15 levels to prevent performance issues

- **getFileContent(path)** - Reads the content of a specific file

  - Takes relative path from workspace root
  - Returns file content as string

- **Ignored Patterns:**
  - `/^\./` - Hidden files (`.git`, `.env`, etc.)
  - `/node_modules/`
  - `/\.git/`
  - `/dist/`
  - `/build/`

### Communication Flow

```
Chrome UI → WebSocket → ReduxMirrorBridge → VsCodeExtension
                            ↓
                    FileExplorerManager
                            ↓
                     File System Operations
```

### Message Types

**Request (from Chrome):**

```json
{
  "type": "REDUX_MIRROR_VSCODE_EVENT",
  "payload": {
    "action": "getWorkspaceFiles",
    "payload": {}
  }
}
```

**Response (from VSCode):**

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
      },
      {
        "name": "package.json",
        "path": "package.json",
        "type": "file"
      }
    ]
  }
}
```

## Implementation Details

### VSCode Extension Changes

1. **FileExplorerManager.ts** - New utility class for file operations
2. **VsCodeExtension.ts** - Added handlers:
   - `handleGetWorkspaceFiles()` - Processes file hierarchy requests
   - `handleGetFileContent()` - Processes file content requests
   - Updated `onVsCodeMessage()` handler to route file explorer commands

### Chrome UI Changes

1. **FileExplorer.tsx** - Updated component:

   - Uses `useWebSocket` hook to communicate with VSCode extension
   - Displays hierarchical file tree
   - Supports folder expand/collapse
   - Shows connection status
   - Reload button to refresh file list

2. **useWebSocket.ts** - New hook:

   - Establishes WebSocket connection to VSCode extension
   - Handles connection lifecycle (connect, disconnect, reconnect)
   - Provides `sendMessage()` callback for sending commands
   - Broadcasts messages to listening components

3. **RightPanel.tsx** - Unchanged
   - Continues to render the Chat GUI in an iframe

## Usage

### From Chrome UI

The FileExplorer component automatically:

1. Connects to the VSCode extension WebSocket on load
2. Requests workspace files when connected
3. Displays the file hierarchy with expand/collapse functionality
4. Shows loading states and error messages

To refresh files, click the "Reload" button in the Explorer header.

### From VSCode Extension

The handlers are automatically triggered when:

1. `getWorkspaceFiles` action is received
2. `getFileContent` action is received

Responses are broadcast to all connected clients.

## Configuration

**WebSocket Port:** 3001 (default from ReduxMirrorBridge)
**WebSocket Path:** `/ws`

Modify in:

- `chrome/src/hooks/useWebSocket.ts` (if changing port)
- `extensions/vscode/src/bridge/ReduxMirrorBridge.ts` (if changing port)

## Error Handling

- File system errors are caught and broadcast back to Chrome UI
- Connection errors trigger automatic reconnection attempts (3-second intervals)
- Invalid paths are handled gracefully with error messages
- Maximum recursion depth prevents stack overflow on circular symlinks

## Performance Considerations

- File hierarchy is limited to 15 levels deep
- Hidden files and common dependency folders are excluded
- Each level of folder expansion is rendered on-demand
- WebSocket messages are JSON serialized for transport

## Future Enhancements

- Watch file system changes in real-time
- Open files directly in the Monaco editor
- Search within files
- Gitignore pattern support
- File creation/deletion/renaming through the UI
