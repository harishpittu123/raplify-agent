import { useEffect, useState } from "react";
import {
  useWebSocketSend,
  useWebSocketStatus,
} from "../hooks/useWebSocketListener";
import "../styles/panels.css";

interface FileItem {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileItem[];
}

export function FileExplorer() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { sendMessage } = useWebSocketSend();
  const { connected } = useWebSocketStatus();

  useEffect(() => {
    if (connected) {
      loadWorkspaceFiles();
    }
  }, [connected]);

  const loadWorkspaceFiles = () => {
    setLoading(true);
    sendMessage("WORKSPACE_FILES", {
      action: "REQUEST_WORKSPACE_FILES",
      payload: {},
    });
  };

  // Listen for file response
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      if (data.type === "WORKSPACE_FILES") {
        if (data.payload && data.payload.success) {
          setFiles(data.payload.files || []);
        } else {
          console.error("Error loading files:", data.payload?.error);
        }
        setLoading(false);
      }
    };

    const ws = (window as any).__fileExplorerWs;
    if (ws) {
      ws.addEventListener("message", handleMessage);
      return () => ws.removeEventListener("message", handleMessage);
    }
  }, []);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (
    items: FileItem[],
    depth: number = 0,
  ): JSX.Element[] => {
    return items.map((item) => (
      <div key={item.path}>
        {item.type === "folder" ? (
          <div
            className="file-item"
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            onClick={() => toggleFolder(item.path)}
          >
            <span className="file-folder">
              {expandedFolders.has(item.path) ? "📂" : "📁"}
            </span>
            {item.name}
          </div>
        ) : (
          <div
            className={`file-item ${selectedFile === item.path ? "active" : ""}`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            onClick={() => setSelectedFile(item.path)}
          >
            <span className="file-folder">📄</span>
            {item.name}
          </div>
        )}
        {item.type === "folder" &&
          expandedFolders.has(item.path) &&
          item.children &&
          renderFileTree(item.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="panel">
      <div
        className="panel-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Explorer
        <button
          onClick={loadWorkspaceFiles}
          disabled={loading || !connected}
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
            padding: "4px 8px",
            fontSize: "11px",
            cursor: loading || !connected ? "not-allowed" : "pointer",
            borderRadius: "3px",
          }}
        >
          {loading ? "Loading..." : "Reload"}
        </button>
      </div>
      <div className="panel-content">
        {!connected && (
          <div style={{ padding: "16px", color: "var(--text-secondary)" }}>
            Not connected to VSCode extension
          </div>
        )}
        {connected && files.length === 0 && !loading && (
          <div style={{ padding: "16px", color: "var(--text-secondary)" }}>
            No files found. Click "Reload" to load workspace files.
          </div>
        )}
        {renderFileTree(files)}
      </div>
    </div>
  );
}
