import { createContext, ReactNode, useContext } from "react";

interface WebSocketMessage {
  type: string;
  payload: any;
}

interface ConnectionState {
  port: number | null;
  attempts: number;
  error: string | null;
}

export interface WebSocketContextType {
  connected: boolean;
  socket: WebSocket | null;
  connectionState: ConnectionState;
  sendMessage: (message: WebSocketMessage) => void;
  refreshConnection: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined,
);

export function useWebSocketContext(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider",
    );
  }
  return context;
}

interface WebSocketProviderProps {
  children: ReactNode;
  value: WebSocketContextType;
}

export function WebSocketProvider({
  children,
  value,
}: WebSocketProviderProps): JSX.Element {
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
