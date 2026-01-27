import * as monaco from "monaco-editor";
import { useEffect, useRef } from "react";
import "../styles/editor.css";

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

export function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null,
  );

  useEffect(() => {
    if (!editorRef.current) return;

    monacoEditorRef.current = monaco.editor.create(editorRef.current, {
      value: SAMPLE_CODE,
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
  }, []);

  return (
    <div className="editor-container">
      <div className="editor-header">sample.ts</div>
      <div className="editor-content" ref={editorRef} />
    </div>
  );
}
