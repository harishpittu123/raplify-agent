/**
 * WebSocket module - centralized exports
 * Import all WebSocket utilities from here
 */

// Context
export {
  WebSocketProvider,
  useWebSocketContext,
  type WebSocketContextType,
} from "./context/WebSocketContext";

// Hooks
export {
  useWebSocketListener,
  useWebSocketSend,
  useWebSocketStatus,
} from "./hooks/useWebSocketListener";

// Types
export {
  WebSocketMessageType,
  type ConnectionState,
  type GenericWebSocketMessage,
  type TypedListenerCallback,
  type TypedSendFunction,
  type WebSocketMessage,
  type WebSocketMessagePayloads,
} from "./types/websocket";

// Service
export { webSocketMessageService } from "./utils/webSocketMessageService";
