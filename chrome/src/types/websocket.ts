/**
 * WebSocket Message Types and Interfaces
 * Use these types for better TypeScript support across your app
 */

/**
 * Define all your message types here for type safety
 * This prevents typos and enables IDE autocomplete
 */
export enum WebSocketMessageType {
  // System messages
  CONFIRM_CONNECTION = "CONFIRM_CONNECTION",
  PROJECT_PATH = "PROJECT_PATH",
  ERROR = "ERROR",

  // File operations
  FILE_CREATED = "FILE_CREATED",
  FILE_UPDATED = "FILE_UPDATED",
  FILE_DELETED = "FILE_DELETED",
  FILE_RENAMED = "FILE_RENAMED",
  GET_FILE_LIST = "GET_FILE_LIST",
  FILE_LIST = "FILE_LIST",

  // Directory operations
  DIRECTORY_CREATED = "DIRECTORY_CREATED",
  DIRECTORY_DELETED = "DIRECTORY_DELETED",
  DIRECTORY_RENAMED = "DIRECTORY_RENAMED",

  // Custom operations
  CUSTOM_MESSAGE = "CUSTOM_MESSAGE",
  ACTION = "ACTION",
}

/**
 * Payload types for each message type
 * Extend this interface with your message payloads
 */
export interface WebSocketMessagePayloads {
  [WebSocketMessageType.CONFIRM_CONNECTION]: {
    status: string;
  };
  [WebSocketMessageType.PROJECT_PATH]: {
    path: string;
  };
  [WebSocketMessageType.ERROR]: {
    message: string;
    code?: number;
    details?: unknown;
  };

  // File operation payloads
  [WebSocketMessageType.FILE_CREATED]: {
    path: string;
    size: number;
    timestamp: number;
    content?: string;
  };
  [WebSocketMessageType.FILE_UPDATED]: {
    path: string;
    content: string;
    timestamp: number;
    size: number;
  };
  [WebSocketMessageType.FILE_DELETED]: {
    path: string;
    timestamp: number;
  };
  [WebSocketMessageType.FILE_RENAMED]: {
    oldPath: string;
    newPath: string;
    timestamp: number;
  };
  [WebSocketMessageType.GET_FILE_LIST]: {
    path?: string;
    recursive?: boolean;
  };
  [WebSocketMessageType.FILE_LIST]: {
    files: Array<{
      path: string;
      type: "file" | "directory";
      size: number;
      modified: number;
    }>;
  };

  // Directory operation payloads
  [WebSocketMessageType.DIRECTORY_CREATED]: {
    path: string;
    timestamp: number;
  };
  [WebSocketMessageType.DIRECTORY_DELETED]: {
    path: string;
    timestamp: number;
  };
  [WebSocketMessageType.DIRECTORY_RENAMED]: {
    oldPath: string;
    newPath: string;
    timestamp: number;
  };

  // Custom payloads
  [WebSocketMessageType.CUSTOM_MESSAGE]: {
    text: string;
    timestamp: string;
    [key: string]: unknown;
  };
  [WebSocketMessageType.ACTION]: {
    [key: string]: unknown;
  };
}

/**
 * Base WebSocket message structure
 */
export interface WebSocketMessage<
  T extends WebSocketMessageType = WebSocketMessageType,
> {
  type: T;
  payload: WebSocketMessagePayloads[T];
}

/**
 * Generic WebSocket message structure for runtime parsing
 */
export interface GenericWebSocketMessage {
  type: string;
  payload: unknown;
}

/**
 * Connection state interface
 */
export interface ConnectionState {
  port: number | null;
  attempts: number;
  error: string | null;
}

/**
 * Context type for WebSocket provider
 */
export interface WebSocketContextType {
  connected: boolean;
  socket: WebSocket | null;
  connectionState: ConnectionState;
  sendMessage: (message: GenericWebSocketMessage) => void;
  refreshConnection: () => void;
}

/**
 * Typed hook for sending specific message types
 * Usage: const send = useTypedWebSocketSend();
 *        send("FILE_CREATED", { path: "/file.txt", size: 100, timestamp: Date.now() });
 */
export type TypedSendFunction = <T extends WebSocketMessageType>(
  type: T,
  payload: WebSocketMessagePayloads[T],
) => void;

/**
 * Typed listener callback
 */
export type TypedListenerCallback<
  T extends WebSocketMessageType = WebSocketMessageType,
> = (payload: WebSocketMessagePayloads[T]) => void;
