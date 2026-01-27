import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";

export interface FileItem {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileItem[];
}

export class FileExplorerManager {
  private static IGNORED_PATTERNS = [
    /^\./, // Hidden files and folders
    /node_modules/,
    /\.git/,
    /dist/,
    /build/,
  ];

  private static shouldIgnore(name: string): boolean {
    return this.IGNORED_PATTERNS.some((pattern) => pattern.test(name));
  }

  static async getWorkspaceFileHierarchy(): Promise<FileItem[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }

    const results: FileItem[] = [];

    for (const folder of workspaceFolders) {
      const items = await this.readDirectoryRecursive(folder.uri.fsPath);
      results.push(...items);
    }

    return results;
  }

  private static async readDirectoryRecursive(
    dirPath: string,
    depth: number = 0,
    maxDepth: number = 15,
  ): Promise<FileItem[]> {
    const items: FileItem[] = [];

    if (depth > maxDepth) {
      return items;
    }

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip ignored patterns
        if (this.shouldIgnore(entry.name)) {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(
          vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "",
          fullPath,
        );

        if (entry.isDirectory()) {
          const children = await this.readDirectoryRecursive(
            fullPath,
            depth + 1,
            maxDepth,
          );

          items.push({
            name: entry.name,
            path: relativePath,
            type: "folder",
            children: children.length > 0 ? children : undefined,
          });
        } else {
          items.push({
            name: entry.name,
            path: relativePath,
            type: "file",
          });
        }
      }

      // Sort items: folders first, then by name
      items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "folder" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }

    return items;
  }

  static async getFileContent(relativePath: string): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error("No workspace folder is open");
    }

    const fullPath = path.join(workspaceFolders[0].uri.fsPath, relativePath);

    try {
      const content = await fs.readFile(fullPath, "utf-8");
      return content;
    } catch (error) {
      console.error(`Error reading file ${fullPath}:`, error);
      throw error;
    }
  }
}
