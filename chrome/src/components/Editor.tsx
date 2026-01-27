import * as monaco from "monaco-editor";
import { useEffect, useRef } from "react";
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
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null,
  );

  // Create editor on mount
  useEffect(() => {
    if (!editorRef.current) return;
    monacoEditorRef.current = monaco.editor.create(editorRef.current, {
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
    return () => {
      monacoEditorRef.current?.dispose();
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update editor content when file changes
  useEffect(() => {
    if (monacoEditorRef.current) {
      const model = monacoEditorRef.current.getModel();
      if (model && content !== model.getValue()) {
        monacoEditorRef.current.setValue(content || "");
      }
    }
  }, [content, filePath]);

  // Breadcrumbs logic: show workspace folder to file name, separated by chevron
  let breadcrumbs: React.ReactNode = filePath || "No file selected";
  if (filePath) {
    // Split path into segments
    const segments = filePath.split(/[/\\]/).filter(Boolean);
    breadcrumbs = segments.map((seg, idx) => {
      // Only show icon for last segment (file)
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
  }
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
        {breadcrumbs}
      </div>
      <div className="editor-content" ref={editorRef} />
    </div>
  );
}
