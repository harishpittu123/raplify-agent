# File Explorer WebSocket Integration - Implementation Guide

## Overview

This document provides a step-by-step guide to the file explorer WebSocket integration that allows the Chrome-based IDE to request and display files from the VSCode extension's workspace.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Chrome IDE (Port 5175)                     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              FileExplorer Component                  │   │
│  │  - Displays file hierarchy                           │   │
│  │  - Sends "getWorkspaceFiles" command                │   │
│  │  - Listens for "workspaceFilesResponse"             │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                       │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │            useWebSocket Hook                         │   │
│  │  - Manages WebSocket connection                     │   │
│  │  - Sends/receives messages                          │   │
│  │  - Auto-reconnection logic                          │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                       │
│                WebSocket (Port 3001)                         │
│                       │                                       │
│                       ▼                                       │
└─────────────────────────────────────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │   ReduxMirrorBridge         │
        │   (WSS Server on :3001)     │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   VsCodeExtension            │
        │ - onVsCodeMessage handler    │
        │ - Routes to FileExplorerMgr  │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  FileExplorerManager         │
        │ - getWorkspaceFileHierarchy()│
        │ - getFileContent()           │
        └──────────────┬───────────────┘
                       │
                       ▼
                   File System
```

## File Structure

### Created Files

```
extensions/vscode/src/util/
└── FileExplorerManager.ts          (NEW)

chrome/src/
├── hooks/
│   └── useWebSocket.ts             (NEW)
├── components/
│   ├── FileExplorer.tsx            (UPDATED)
│   ├── RightPanel.tsx              (NO CHANGE)
│   ├── Editor.tsx
│   ├── Toolbar.tsx
│   └── Layout.tsx
├── styles/
│   ├── globals.css
│   ├── editor.css
│   ├── panels.css
│   └── toolbar.css
├── App.tsx
├── main.tsx
└── types.d.ts

chrome/
├── WEBSOCKET_INTEGRATION.md        (NEW)
├── index.html
├── gui.html
├── vite.config.ts
└── package.json
```

## Implementation Details

### 1. FileExplorerManager.ts (VSCode Extension)

**Purpose:** Manages all file system operations for the workspace.

**Key Methods:**

```typescript
// Get entire workspace file hierarchy
static async getWorkspaceFileHierarchy(): Promise<FileItem[]>

// Get specific file content
static async getFileContent(relativePath: string): Promise<string>

// Check if file/folder should be ignored
private static shouldIgnore(name: string): boolean
```

**Ignored Patterns:**

- Files/folders starting with `.` (hidden)
- `node_modules`, `.git`, `dist`, `build`
- Configurable in `IGNORED_PATTERNS` array

**Return Structure:**

```typescript
interface FileItem {
  name: string; // "src", "App.tsx"
  path: string; // "src", "src/App.tsx"
  type: "file" | "folder";
  children?: FileItem[]; // For folders only
}
```

### 2. VsCodeExtension.ts Updates

**Import Addition:**

```typescript
import { FileExplorerManager } from "../util/FileExplorerManager";
```

**Message Handler Update:**

```typescript
reduxMirrorBridge.onVsCodeMessage((mirrorMessage: MirrorVsCodeMessage) => {
  // Handle file explorer requests
  if (mirrorMessage.action === "getWorkspaceFiles") {
    void this.handleGetWorkspaceFiles(reduxMirrorBridge);
    return;
  }

  if (mirrorMessage.action === "getFileContent") {
    void this.handleGetFileContent(
      reduxMirrorBridge,
      mirrorMessage.payload as { path: string },
    );
    return;
  }

  // ... existing message handling
});
```

**New Handler Methods:**

```typescript
// Sends workspace files to all connected clients
private async handleGetWorkspaceFiles(
  reduxMirrorBridge: ReduxMirrorBridge
)

// Sends specific file content to all connected clients
private async handleGetFileContent(
  reduxMirrorBridge: ReduxMirrorBridge,
  payload: { path: string }
)
```

### 3. useWebSocket.ts (Chrome Hook)

**Purpose:** Manages WebSocket connection to VSCode extension.

**Features:**

- Auto-connection on mount
- Auto-reconnection on disconnect (3-second intervals)
- Message queuing for when disconnected
- Message broadcasting via CustomEvent

**Usage:**

```typescript
const { connected, sendMessage, socket } = useWebSocket();

// Send a command
sendMessage({
  type: "REDUX_MIRROR_VSCODE_EVENT",
  payload: {
    action: "getWorkspaceFiles",
    payload: {},
  },
});

// Listen for responses
window.addEventListener("websocket-message", (event: CustomEvent) => {
  const data = event.detail;
  if (data.type === "workspaceFilesResponse") {
    // Handle response
  }
});
```

**Connection Details:**

- Port: 3001 (configurable)
- Path: `/ws`
- Protocol: ws/wss based on current protocol

### 4. FileExplorer.tsx (Chrome Component)

**Features:**

- Displays file hierarchy with expand/collapse
- Shows connection status
- Reload button to refresh files
- File selection highlighting
- Loading states

**State Management:**

```typescript
const [files, setFiles] = useState<FileItem[]>([]); // File hierarchy
const [loading, setLoading] = useState(false); // Loading state
const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set()); // Expanded folders
const [selectedFile, setSelectedFile] = useState<string | null>(null); // Active file
```

**Message Flow:**

1. User clicks "Reload" button
2. Component sends `getWorkspaceFiles` command via websocket
3. VSCode extension receives command
4. FileExplorerManager reads file system
5. Response is broadcast back to Chrome
6. Component receives `workspaceFilesResponse`
7. Files are displayed in hierarchical view

## Message Protocol

### Getting Workspace Files

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
        "children": [
          {
            "name": "App.tsx",
            "path": "src/App.tsx",
            "type": "file"
          }
        ]
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

**Error Response:**

```json
{
  "type": "workspaceFilesResponse",
  "payload": {
    "success": false,
    "error": "No workspace folder is open"
  }
}
```

### Getting File Content

**Request:**

```json
{
  "type": "REDUX_MIRROR_VSCODE_EVENT",
  "payload": {
    "action": "getFileContent",
    "payload": {
      "path": "src/App.tsx"
    }
  }
}
```

**Response:**

```json
{
  "type": "fileContentResponse",
  "payload": {
    "success": true,
    "path": "src/App.tsx",
    "content": "import React from 'react';\n..."
  }
}
```

## Running the System

### Prerequisites

1. VSCode extension running with ReduxMirrorBridge started
2. Chrome dev server running

### Steps

1. **Start VSCode Extension:**

   ```bash
   cd /Users/harishpittu/Documents/Pittu/raplify-agent
   npm run dev  # or specific vscode extension build
   ```

2. **Start Chrome Dev Server:**

   ```bash
   cd /Users/harishpittu/Documents/Pittu/raplify-agent/chrome
   npm run dev
   ```

3. **Access the IDE:**
   - Open `http://localhost:5175/` (or whatever port Vite assigns)
   - FileExplorer will automatically connect to VSCode extension
   - Click "Reload" to load workspace files

## Debugging

### Check WebSocket Connection

```javascript
// In Chrome DevTools Console
const hook = window.__fileExplorerWs;
console.log(hook ? "Connected" : "Not connected");
hook?.send(JSON.stringify({ test: "message" }));
```

### Monitor Messages

```javascript
// In Chrome DevTools Console
window.addEventListener("websocket-message", (event) => {
  console.log("Received:", event.detail);
});
```

### VSCode Extension Logs

Check VSCode extension output for:

- "Error getting workspace files:"
- "Error getting file content:"
- FileExplorerManager.ts debug logs

## Performance Notes

- Maximum recursion depth: 15 levels
- Excluded directories: node_modules, .git, dist, build
- File tree is rendered incrementally (expand on demand)
- Initial load scans entire workspace once
- Subsequent reloads are fresh scans

## Security Considerations

- File access is limited to workspace root
- Hidden files (starting with `.`) are excluded
- No absolute file paths are exposed to client
- All paths are relative to workspace root
- File content is served through VSCode extension layer

## Future Enhancements

- [ ] Watch file system changes in real-time
- [ ] Gitignore support
- [ ] File search functionality
- [ ] Create/delete files via UI
- [ ] Rename files via UI
- [ ] Show file size and modified date
- [ ] Preview file content in right panel
- [ ] Syntax highlighting for code files
