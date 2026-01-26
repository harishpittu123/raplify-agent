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

  constructor(
    private readonly options: {
      port?: number;
      path?: string;
    } = {},
  ) {}

  public start(): void {
    if (this.server) {
      return;
    }

    const port = this.options.port ?? REDUX_MIRROR_WS_PORT;
    const path = this.options.path ?? REDUX_MIRROR_WS_PATH;

    this.server = new WebSocketServer({ port, path });

    this.server.on("connection", (socket) => {
      this.clients.add(socket);
      socket.on("message", (event) => {
        try {
          const parsed = JSON.parse(event.toString()) as MirrorMessage;
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
