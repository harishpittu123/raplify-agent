// Monaco worker loader for Chrome extension/custom environments
// Use blob URLs for workers to support strict CSP and extension environments
// if (typeof window !== "undefined") {
//   // @ts-ignore
//   window.MonacoEnvironment = window.MonacoEnvironment || {
//     getWorkerUrl: function (_moduleId, label) {
//       let workerScript = '';
//       if (label === "typescript" || label === "javascript") {
//         workerScript = `importScripts("${location.origin}/ts.worker.js");`;
//       } else {
//         workerScript = `importScripts("${location.origin}/editor.worker.js");`;
//       }
//       const blob = new Blob([workerScript], { type: "application/javascript" });
//       return URL.createObjectURL(blob);
//     },
//   };
// }
import * as monaco from "monaco-editor";
import { useEffect, useRef, useState } from "react";
import { useWebSocketContext } from "../context/WebSocketContext";
import "../styles/editor.css";
import { getSetiIcon } from "../utils/setiIconLoader";
import { ChevronArrow } from "./ChevronArrow";

const SAMPLE_CODE = `// Sample TypeScript Code
interface User {
  id: number;
  name: string;
  email: string;
}

class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  getUser(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getAllUsers(): User[] {
    return [...this.users];
  }
}

export const userService = new UserService();
`;

interface EditorProps {
  filePath: string;
  fileName: string;
  content: string;
}

export function Editor({ filePath, fileName, content }: EditorProps) {
  const { sendMessage } = useWebSocketContext();
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const [editorValue, setEditorValue] = useState(content || "");
  const [dirty, setDirty] = useState(false);

  // Initialize Monaco Editor
  useEffect(() => {
    if (!editorRef.current) return;
    let editor: monaco.editor.IStandaloneCodeEditor;
    let changeListener: monaco.IDisposable;
    try {
      editor = monaco.editor.create(editorRef.current, {
        value: content || "",
        language: "typescript",
        theme: "vs-dark",
        readOnly: false,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
        fontLigatures: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
      });
      monacoEditorRef.current = editor;
      const model = editor.getModel();
      changeListener = editor.onDidChangeModelContent(() => {
        const value = editor.getValue();
        setEditorValue(value);
        setDirty(value !== content);
      });
    } catch (error) {
      console.error("####Error initializing Monaco Editor:", error);
    }
    return () => {
      changeListener.dispose();
      editor.dispose();
      monacoEditorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Monaco value when file changes
  useEffect(() => {
    if (monacoEditorRef.current) {
      const model = monacoEditorRef.current.getModel();
      if (model && content !== model.getValue()) {
        monacoEditorRef.current.setValue(content || "");
        setEditorValue(content || "");
        setDirty(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, filePath]);

  // Save handler
  const handleSave = () => {
    if (!filePath) return;
    sendMessage({
      type: "SAVE_FILE_CONTENT",
      payload: { filePath, content: editorValue },
    });
    setDirty(false);
  };

  // Breadcrumbs UI
  const renderBreadcrumbs = () => {
    if (!filePath) return "No file selected";
    const segments = filePath.split(/[/\\]/).filter(Boolean);
    return segments.map((seg, idx) => {
      const isLast = idx === segments.length - 1;
      return (
        <span
          key={idx}
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          {isLast && (
            <span
              className="seti-icon"
              style={{
                fontSize: 20,
                marginRight: 6,
                color: getSetiIcon(seg).color,
                fontFamily: "'Seti', 'Menlo', 'monospace'",
                display: "inline-block",
                verticalAlign: "middle",
              }}
              title={seg}
            >
              {getSetiIcon(seg).char}
            </span>
          )}
          <span>{seg}</span>
          {idx < segments.length - 1 && (
            <ChevronArrow size={14} style={{ color: "#888" }} />
          )}
        </span>
      );
    });
  };

  return (
    <div className="editor-container">
      <div
        className="editor-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          fontSize: 13,
          fontWeight: 500,
          color: "#fff",
          background: "#232323",
        }}
      >
        {renderBreadcrumbs()}
        {dirty && (
          <button onClick={handleSave} style={{ marginLeft: 12 }}>
            Save
          </button>
        )}
      </div>
      <div className="editor-content" ref={editorRef} />
    </div>
  );
}
