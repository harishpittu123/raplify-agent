import { createServer } from "net";
import * as vscode from "vscode";
import { WebSocket, WebSocketServer } from "ws";

import type { Message } from "core/protocol/messenger";

export const REDUX_MIRROR_QUERY_PARAM = "mirror";
export const REDUX_MIRROR_EVENT = "mirror/sync/redux-root";
export const REDUX_MIRROR_WS_PORT = 65434;
export const REDUX_MIRROR_WS_PATH = "/mirror";
export const REDUX_MIRROR_COMMAND_EVENT = "mirror/command";
export const REDUX_MIRROR_COMMAND_RESPONSE_EVENT = "mirror/command/response";
export const REDUX_MIRROR_ACTION_EVENT = "mirror/action";
export const REDUX_MIRROR_VSCODE_EVENT = "mirror/vscode";

// Port discovery constants
export const INITIAL_WS_PORT = 12100;
export const PORT_RANGE = 10; // Try ports 12100-12109

interface MirrorMessage {
  type: string;
  payload: unknown;
}

type MirrorCommandHandler = (
  message: Message,
  respond: (payload: Message) => void,
) => void;

type MirrorActionHandler = (message: MirrorActionMessage) => void;
type MirrorVsCodeHandler = (message: MirrorVsCodeMessage) => void;

export interface MirrorActionMessage {
  key: string;
  payload: unknown;
}

export interface MirrorVsCodeMessage {
  action: string;
  payload: unknown;
}

export class ReduxMirrorBridge implements vscode.Disposable {
  private server: WebSocketServer | undefined;
  private readonly clients = new Set<WebSocket>();
  private commandHandler?: MirrorCommandHandler;
  private actionHandler?: MirrorActionHandler;
  private vsCodeHandler?: MirrorVsCodeHandler;
  private actualPort: number | undefined;
  private projectPath: string | undefined;

  constructor(
    private readonly options: {
      port?: number;
      path?: string;
    } = {},
  ) {}

  public async start(): Promise<void> {
    if (this.server) {
      return;
    }

    const path = this.options.path ?? REDUX_MIRROR_WS_PATH;
    const port = await this.findAvailablePort(
      this.options.port ?? INITIAL_WS_PORT,
    );

    this.actualPort = port;
    this.server = new WebSocketServer({ port, path });

    this.server.on("connection", (socket) => {
      this.clients.add(socket);
      socket.on("message", async (event) => {
        try {
          const parsed = JSON.parse(event.toString()) as MirrorMessage;

          // Handle Chrome extension connection confirmation
          if (parsed?.type === "PROJECT_PATH") {
            const projectPath = parsed.payload as string;
            this.projectPath = projectPath;
            console.log(
              `Chrome extension connected with project path: ${projectPath}`,
            );

            // Send confirmation back to Chrome
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(
                JSON.stringify({
                  type: "CONFIRM_CONNECTION",
                  payload: {
                    success: true,
                    message: "VS Code extension connected",
                    port: this.actualPort,
                  },
                }),
              );
            }
            return;
          }

          // Handle workspace files request from Chrome
          if (parsed?.type === "WORKSPACE_FILES") {
            const files = await this.getWorkspaceFilesHierarchy();
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(
                JSON.stringify({
                  type: "WORKSPACE_FILES",
                  payload: {
                    success: true,
                    files: files,
                  },
                }),
              );
            }
            return;
          }

          // Handle file content request from Chrome
          if (parsed?.type === "GET_FILE_CONTENT") {
            const filePath = (parsed.payload as any)?.filePath;
            if (!filePath) {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(
                  JSON.stringify({
                    type: "GET_FILE_CONTENT",
                    payload: {
                      success: false,
                      error: "No file path provided",
                    },
                  }),
                );
              }
              return;
            }

            try {
              const fileContent = await this.getFileContent(filePath);
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(
                  JSON.stringify({
                    type: "GET_FILE_CONTENT",
                    payload: {
                      success: true,
                      content: fileContent,
                      filePath: filePath,
                    },
                  }),
                );
              }
            } catch (error) {
              console.error(`Error reading file ${filePath}:`, error);
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(
                  JSON.stringify({
                    type: "GET_FILE_CONTENT",
                    payload: {
                      success: false,
                      error: `Failed to read file: ${(error as Error).message}`,
                    },
                  }),
                );
              }
            }
            return;
          }

          if (parsed?.type === REDUX_MIRROR_COMMAND_EVENT) {
            if (!this.commandHandler) {
              console.warn(
                "ReduxMirrorBridge received command with no handler",
              );
              return;
            }
            const payload = parsed.payload as Message;
            this.commandHandler(payload, (response) => {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(
                  JSON.stringify({
                    type: REDUX_MIRROR_COMMAND_RESPONSE_EVENT,
                    payload: response,
                  }),
                );
              }
            });
          } else if (parsed?.type === REDUX_MIRROR_ACTION_EVENT) {
            if (!this.actionHandler) {
              console.warn("ReduxMirrorBridge received action with no handler");
              return;
            }
            this.actionHandler(parsed.payload as MirrorActionMessage);
          } else if (parsed?.type === REDUX_MIRROR_VSCODE_EVENT) {
            if (!this.vsCodeHandler) {
              console.warn(
                "ReduxMirrorBridge received vscode message with no handler",
              );
              return;
            }
            this.vsCodeHandler(parsed.payload as MirrorVsCodeMessage);
          }
        } catch (error) {
          console.warn("ReduxMirrorBridge message handling error", error);
        }
      });
      socket.on("close", () => {
        this.clients.delete(socket);
      });
      socket.on("error", (error) => {
        console.warn("ReduxMirrorBridge socket error", error);
      });
    });

    this.server.on("listening", () => {
      console.log(
        `ReduxMirrorBridge listening on ws://localhost:${port}${path ?? ""}`,
      );
    });

    this.server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.warn(
          `ReduxMirrorBridge could not bind to port ${port}: address in use`,
        );
      } else {
        console.error("ReduxMirrorBridge server error", error);
      }
    });
  }

  /**
   * Finds an available port starting from the given port.
   * Tries up to PORT_RANGE ports before giving up.
   * @param startPort The port to start checking from
   * @returns The available port number
   */
  private findAvailablePort(startPort: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const attemptPort = (port: number, attempt: number): void => {
        if (attempt > PORT_RANGE) {
          reject(
            new Error(
              `No available ports found in range ${startPort}-${startPort + PORT_RANGE - 1}`,
            ),
          );
          return;
        }

        const server = createServer();
        server.listen(port, "localhost", () => {
          server.close(() => {
            console.log(`Found available port: ${port}`);
            resolve(port);
          });
        });

        server.on("error", (err: NodeJS.ErrnoException) => {
          if (err.code === "EADDRINUSE") {
            console.log(`Port ${port} is in use, trying port ${port + 1}...`);
            attemptPort(port + 1, attempt + 1);
          } else {
            reject(err);
          }
        });
      };

      attemptPort(startPort, 0);
    });
  }

  public getActualPort(): number | undefined {
    return this.actualPort;
  }

  /**
   * Gets the workspace files with hierarchy structure
   * @returns Array of FileItem objects representing the workspace structure
   */
  private async getWorkspaceFilesHierarchy(): Promise<any[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }

    const files: any[] = [];

    for (const folder of workspaceFolders) {
      const folderItems = await this.getDirectoryContents(folder.uri, "");
      files.push({
        name: folder.name,
        path: folder.uri.fsPath,
        type: "folder",
        children: folderItems,
      });
    }

    return files;
  }

  /**
   * Recursively gets the contents of a directory
   * @param uri The URI of the directory
   * @param basePath The base path for relative paths
   * @returns Array of FileItem objects
   */
  private async getDirectoryContents(
    uri: vscode.Uri,
    basePath: string,
  ): Promise<any[]> {
    try {
      const entries = await vscode.workspace.fs.readDirectory(uri);
      const items: any[] = [];

      // Sort entries: folders first, then files, both alphabetically
      entries.sort((a, b) => {
        if (a[1] !== b[1]) {
          return a[1] === vscode.FileType.Directory ? -1 : 1;
        }
        return a[0].localeCompare(b[0]);
      });

      for (const [name, fileType] of entries) {
        const filePath = basePath ? `${basePath}/${name}` : name;
        const fullUri = vscode.Uri.joinPath(uri, name);

        // Skip hidden files and common excludes
        if (name.startsWith(".") || name === "node_modules") {
          continue;
        }

        if (fileType === vscode.FileType.Directory) {
          const children = await this.getDirectoryContents(fullUri, filePath);
          items.push({
            name,
            path: filePath,
            type: "folder",
            children,
          });
        } else if (fileType === vscode.FileType.File) {
          items.push({
            name,
            path: filePath,
            type: "file",
          });
        }
      }

      return items;
    } catch (error) {
      console.error(`Error reading directory ${uri}:`, error);
      return [];
    }
  }

  /**
   * Reads the content of a file from the workspace
   * @param filePath The relative path of the file
   * @returns The file content as a string
   */
  private async getFileContent(filePath: string): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error("No workspace folders found");
    }

    // Try to find the file in workspace folders
    for (const folder of workspaceFolders) {
      const fileUri = vscode.Uri.joinPath(folder.uri, filePath);
      try {
        const fileData = await vscode.workspace.fs.readFile(fileUri);
        return new TextDecoder().decode(fileData);
      } catch {
        // Continue to next folder if file not found
        continue;
      }
    }

    throw new Error(`File not found: ${filePath}`);
  }

  public broadcast(type: string, payload: unknown): void {
    if (!this.server || this.server?.clients.size === 0) {
      return;
    }

    const message: MirrorMessage = { type, payload };
    const serialized = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    }
  }

  public dispose(): void {
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();
    this.server?.close();
    this.server = undefined;
  }

  public onCommand(handler: MirrorCommandHandler): void {
    this.commandHandler = handler;
  }

  public onAction(handler: MirrorActionHandler): void {
    this.actionHandler = handler;
  }

  public onVsCodeMessage(handler: MirrorVsCodeHandler): void {
    this.vsCodeHandler = handler;
  }
}
