import { useCallback, useEffect, useState } from "react";
import {
  useWebSocketListener,
  useWebSocketSend,
  useWebSocketStatus,
} from "../hooks/useWebSocketListener";
import "../styles/panels.css";
import { getSetiIcon } from "../utils/setiIconLoader";

const DEPTH_INDENT = 10;
const FONT_SIZE = 14;
const ICON_SIZE = 20;

export interface FileItem {
  name: string;
  path: string;
  fullPath?: string;
  type: "file" | "folder";
  children?: FileItem[];
}

export function FileExplorer({
  onFileOpen,
}: {
  onFileOpen?: (file: {
    filePath: string;
    fileName: string;
    content: string;
  }) => void;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const { sendMessage } = useWebSocketSend();
  const { connected } = useWebSocketStatus();
  console.log("[FileExplorer] files status:", files);
  const loadWorkspaceFiles = useCallback(() => {
    setLoading(true);
    sendMessage("WORKSPACE_FILES", {
      action: "REQUEST_WORKSPACE_FILES",
      payload: {},
    });
  }, [sendMessage]);

  useEffect(() => {
    if (connected) {
      loadWorkspaceFiles();
    }
  }, [connected, loadWorkspaceFiles]);

  // Debug: Log connection status
  useEffect(() => {
    console.log("[FileExplorer] Connected status:", connected);
  }, [connected]);

  // Listen for workspace files response via message service
  useWebSocketListener("WORKSPACE_FILES", (payload) => {
    console.log("[FileExplorer] Received WORKSPACE_FILES response:", payload);
    if (payload && payload.success) {
      setFiles(payload.files || []);
      // Expand first folder by default
      if (payload.files && payload.files.length > 0) {
        const firstFolder = payload.files[0];
        if (firstFolder.type === "folder") {
          setExpandedFolders(new Set([firstFolder.path]));
        }
      }
    } else {
      console.error("Error loading files:", payload?.error);
    }
    setLoading(false);
  });

  // Listen for file content response
  useWebSocketListener("GET_FILE_CONTENT", (payload) => {
    console.log("[FileExplorer] Received GET_FILE_CONTENT response:", payload);
    if (payload && payload.success) {
      setFileContent(payload.content || "");
      if (onFileOpen && selectedFile) {
        onFileOpen({
          filePath: selectedFile,
          fileName: selectedFile.split("/").pop() || "File",
          content: payload.content || "",
        });
      }
    } else {
      console.error("Error loading file content:", payload?.error);
      setFileContent(null);
    }
    setFileLoading(false);
  });

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
    return items.map((item, index) => {
      const isExpanded = expandedFolders.has(item.path);
      const isFolder = item.type === "folder";
      const hasChildren = isFolder && item.children && item.children.length > 0;
      const isLast = index === items.length - 1;

      return (
        <div key={item.path} style={{ position: "relative" }}>
          {/* Connector lines for tree structure */}
          {depth > 0 && (
            <>
              {/* Vertical connector from parent */}
              <div
                style={{
                  position: "absolute",
                  left: `calc(${(depth - 1) * DEPTH_INDENT}px + 10px)`,
                  top: 0,
                  width: "1px",
                  height: isLast ? "11px" : "100%",
                  backgroundColor: "var(--border-color)",
                  opacity: 0.3,
                }}
              />
              {/* Horizontal connector to item */}
              <div
                style={{
                  position: "absolute",
                  left: `calc(${(depth - 1) * DEPTH_INDENT}px + 10px)`,
                  top: "11px",
                  width: "10px",
                  height: "1px",
                  backgroundColor: "var(--border-color)",
                  opacity: 0.3,
                }}
              />
            </>
          )}

          <div
            className={`file-tree-item ${isFolder ? "is-folder" : "is-file"} ${isExpanded ? "is-expanded" : ""} ${selectedFile === item.path ? "is-selected" : ""}`}
            style={{
              paddingLeft: `${depth * DEPTH_INDENT}px`,
              display: "flex",
              alignItems: "center",
              height: "24px",
              cursor: "pointer",
              userSelect: "none",
              position: "relative",
              zIndex: 1,
            }}
            onClick={() => {
              if (isFolder) {
                toggleFolder(item.path);
              } else {
                console.log(
                  "[FileExplorer] File clicked:",
                  item.name,
                  "Full path:",
                  item.fullPath,
                  "Relative path:",
                  item.path,
                );
                setSelectedFile(item.path);
                setFileLoading(true);
                const message = {
                  filePath: item.fullPath || item.path,
                };
                console.log(
                  "[FileExplorer] Sending GET_FILE_CONTENT message:",
                  JSON.stringify(message),
                );
                sendMessage("GET_FILE_CONTENT", message);
              }
            }}
          >
            {/* Expand/Collapse chevron for folders */}
            {isFolder && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              >
                <svg
                  width={ICON_SIZE - 2}
                  height={ICON_SIZE - 2}
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  style={{
                    color: "var(--text-secondary)",
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <path d="M5.64645 3.14645C5.45118 3.34171 5.45118 3.65829 5.64645 3.85355L9.79289 8L5.64645 12.1464C5.45118 12.3417 5.45118 12.6583 5.64645 12.8536C5.84171 13.0488 6.15829 13.0488 6.35355 12.8536L10.8536 8.35355C11.0488 8.15829 11.0488 7.84171 10.8536 7.64645L6.35355 3.14645C6.15829 2.95118 5.84171 2.95118 5.64645 3.14645Z" />
                </svg>
              </div>
            )}

            {/* Empty space for non-folders (alignment) */}
            {/* {!isFolder && (
              <div style={{ width: ICON_SIZE - 3, flexShrink: 0 }} />
            )} */}

            {/* VS Code Icon using Seti - only for files */}
            {!isFolder && (
              <span
                className="seti-icon"
                style={{
                  fontSize: ICON_SIZE,
                  marginRight: "6px",
                  width: ICON_SIZE,
                  textAlign: "center",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: getSetiIcon(item.name).color,
                }}
                title={item.name}
              >
                {getSetiIcon(item.name).char}
              </span>
            )}

            {/* File/Folder Name with Roboto font */}
            <span
              style={{
                fontSize: FONT_SIZE,
                fontFamily:
                  "Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontWeight: isFolder ? 500 : 400,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginLeft: isFolder ? "4px" : "0px",
                flex: 1,
                letterSpacing: "0.3px",
              }}
            >
              {item.name}
            </span>
          </div>

          {/* Render children if expanded */}
          {isFolder && isExpanded && hasChildren && (
            <div>{renderFileTree(item.children || [], depth + 1)}</div>
          )}
        </div>
      );
    });
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
      {/* File content display removed. File content will be shown in the editor panel only. */}
    </div>
  );
}
