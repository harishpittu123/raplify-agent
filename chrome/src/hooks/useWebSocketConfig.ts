/**
 * Hook to access WebSocket configuration from URL parameters
 * Useful for GUI components that need to connect to the WebSocket
 */

import { useMemo } from "react";

interface WebSocketConfig {
  port: number | null;
  protocol: "ws" | "wss";
  host: string;
  url: string;
  isChromeExtension: boolean;
  isMirrorMode: boolean;
}

/**
 * Parse URL parameters and return WebSocket configuration
 *
 * Expected URL format:
 * http://localhost:5173/gui.html?mirror=true&chrome=true&port=12100
 *
 * @example
 * const wsConfig = useWebSocketConfig();
 * // Returns: { port: 12100, protocol: 'ws', host: 'localhost', url: 'ws://localhost:12100', ... }
 */
export function useWebSocketConfig(): WebSocketConfig {
  const config = useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    // Get WebSocket port from URL
    const portParam = params.get("port");
    const port = portParam ? parseInt(portParam, 10) : null;

    // Determine protocol based on current window protocol
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = "localhost";

    // Construct full WebSocket URL
    const url = port ? `${protocol}://${host}:${port}` : null;

    // Check if running in Chrome extension context
    const isChromeExtension = params.get("chrome") === "true";

    // Check if in mirror mode
    const isMirrorMode = params.get("mirror") === "true";

    return {
      port,
      protocol: protocol as "ws" | "wss",
      host,
      url: url || "",
      isChromeExtension,
      isMirrorMode,
    };
  }, []);

  return config;
}

/**
 * Hook to create and manage WebSocket connection based on URL config
 * Automatically connects when port becomes available
 *
 * @example
 * const { ws, connected, error } = useWebSocketConnection();
 *
 * useEffect(() => {
 *   if (connected && ws) {
 *     ws.send(JSON.stringify({ type: "MESSAGE", payload: {} }));
 *   }
 * }, [connected, ws]);
 */
export function useWebSocketConnection() {
  const config = useWebSocketConfig();
  const [ws, setWs] = React.useState<WebSocket | null>(null);
  const [connected, setConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const connectionAttemptRef = React.useRef(false);

  React.useEffect(() => {
    // Only attempt connection if we have a port and haven't already tried
    if (!config.port || connectionAttemptRef.current) {
      return;
    }

    connectionAttemptRef.current = true;

    console.log(`[GUI WebSocket] Attempting to connect on port ${config.port}`);

    try {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const wsUrl = `${protocol}://localhost:${config.port}`;
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log(`[GUI WebSocket] Connected to ${wsUrl}`);
        setConnected(true);
        setError(null);

        // Send connection message
        websocket.send(
          JSON.stringify({
            type: "GUI_CONNECTED",
            payload: {
              source: "gui",
              timestamp: new Date().toISOString(),
            },
          }),
        );
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Dispatch custom event for other components to listen
          window.dispatchEvent(
            new CustomEvent("websocket-message-gui", { detail: data }),
          );
        } catch (err) {
          console.error("[GUI WebSocket] Failed to parse message:", err);
        }
      };

      websocket.onerror = (event) => {
        console.error("[GUI WebSocket] Error:", event);
        setError(`WebSocket error on port ${config.port}`);
      };

      websocket.onclose = () => {
        console.log(`[GUI WebSocket] Connection closed`);
        setConnected(false);
        setWs(null);
        connectionAttemptRef.current = false;
      };

      setWs(websocket);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[GUI WebSocket] Connection failed:`, errorMsg);
      setError(errorMsg);
      connectionAttemptRef.current = false;
    }

    // Cleanup
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [config.port]);

  return {
    ws,
    connected,
    error,
    config,
  };
}

/**
 * Hook to send messages through WebSocket
 *
 * @example
 * const send = useWebSocketSend();
 * send("MESSAGE_TYPE", { data: "value" });
 */
export function useWebSocketSend() {
  const { ws, connected } = useWebSocketConnection();

  const sendMessage = React.useCallback(
    (type: string, payload: any) => {
      if (!connected || !ws) {
        console.warn("[GUI WebSocket] Not connected, cannot send message");
        return;
      }

      try {
        ws.send(
          JSON.stringify({
            type,
            payload,
          }),
        );
      } catch (err) {
        console.error("[GUI WebSocket] Failed to send message:", err);
      }
    },
    [ws, connected],
  );

  return {
    sendMessage,
    connected,
    ws,
  };
}

// Re-export React for convenience
import * as React from "react";
