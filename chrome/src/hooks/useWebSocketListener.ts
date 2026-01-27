import { useCallback, useEffect, useMemo } from "react";
import { useWebSocketContext } from "../context/WebSocketContext";
import { webSocketMessageService } from "../utils/webSocketMessageService";

/**
 * Hook to listen to specific WebSocket message types
 * @param messageType - The type of message to listen for
 * @param onMessage - Callback function when message is received
 * @example
 * useWebSocketListener("FILE_UPDATE", (data) => {
 *   console.log("File updated:", data);
 * });
 */
export function useWebSocketListener(
  messageType: string,
  onMessage: (data: any) => void,
): void {
  useEffect(() => {
    const unsubscribe = webSocketMessageService.subscribe(
      messageType,
      onMessage,
    );

    return () => {
      unsubscribe();
    };
  }, [messageType, onMessage]);
}

/**
 * Hook to send WebSocket messages
 * @returns Object with sendMessage function and connection status
 * @example
 * const { sendMessage, connected } = useWebSocketSend();
 *
 * const handleSendMessage = () => {
 *   sendMessage({
 *     type: "FILE_OPERATION",
 *     payload: { action: "create", path: "/path/to/file" }
 *   });
 * };
 */
export function useWebSocketSend() {
  const { sendMessage, connected, socket } = useWebSocketContext();

  const send = useCallback(
    (messageType: string, payload: any) => {
      sendMessage({
        type: messageType,
        payload,
      });
    },
    [sendMessage],
  );

  return useMemo(
    () => ({
      sendMessage: send,
      connected,
      socket,
    }),
    [send, connected, socket],
  );
}

/**
 * Hook to get the current WebSocket connection state
 * @returns WebSocket connection state
 * @example
 * const { connected, connectionState } = useWebSocketStatus();
 */
export function useWebSocketStatus() {
  const { connected, connectionState, refreshConnection } =
    useWebSocketContext();

  return useMemo(
    () => ({
      connected,
      connectionState,
      refreshConnection,
    }),
    [connected, connectionState, refreshConnection],
  );
}
