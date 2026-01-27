import { useCallback, useEffect, useState } from "react";
import { webSocketMessageService } from "../utils/webSocketMessageService";
import { findDebugFilePath } from "./helpers";

interface WebSocketMessage {
  type: string;
  payload: any;
}

interface ConnectionState {
  port: number | null;
  attempts: number;
  error: string | null;
}

const INITIAL_PORT = 12100;
const PORT_COUNT = 10;
const MAX_ATTEMPTS = 20;
const RETRY_DELAY = 30000; // 30 seconds (increased from 10 seconds)

export function useWebSocket() {
  const [connected, setConnected] = useState<boolean>(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    port: null,
    attempts: 0,
    error: null,
  });

  const updateProjectPath = useCallback((): void => {
    const path = findDebugFilePath();
    setProjectPath(path);
  }, []);

  useEffect(() => {
    updateProjectPath();
    // const interval = setInterval(updateProjectPath, 5000); // Update every 5 seconds
    // return () => clearInterval(interval);
  }, [updateProjectPath]);

  const tryConnectToPort = useCallback(
    (port: number, projectPath: string): Promise<WebSocket | null> => {
      return new Promise((resolve) => {
        try {
          const protocol = window.location.protocol === "https:" ? "wss" : "ws";
          const host = "localhost";
          const wsUrl = `${protocol}://${host}:${port}/mirror`;

          const ws = new WebSocket(wsUrl);
          const timeout = setTimeout(() => {
            ws.close();
            resolve(null);
          }, 5000); // 5 second timeout per port (increased from 3 seconds)

          ws.addEventListener(
            "open",
            () => {
              clearTimeout(timeout);
              console.log(`Connected to port ${port}`);

              // Send project path to establish connection
              ws.send(
                JSON.stringify({
                  type: "PROJECT_PATH",
                  payload: projectPath,
                }),
              );

              // Wait for confirmation from VS Code extension
              const confirmationHandler = (event: Event) => {
                try {
                  if (event instanceof MessageEvent) {
                    const data = JSON.parse(event.data);
                    if (data.type === "CONFIRM_CONNECTION") {
                      console.log(`Confirmation received from port ${port}`);
                      ws.removeEventListener("message", confirmationHandler);
                      clearTimeout(confirmationTimeout);
                      setConnectionState({
                        port,
                        attempts: 0,
                        error: null,
                      });
                      resolve(ws);
                    }
                  }
                } catch (error) {
                  console.error(
                    "Error processing confirmation message:",
                    error,
                  );
                }
              };

              ws.addEventListener("message", confirmationHandler);

              // Timeout for confirmation (8 seconds, increased from 5 seconds)
              const confirmationTimeout = setTimeout(() => {
                ws.removeEventListener("message", confirmationHandler);
                if (ws.readyState === WebSocket.OPEN) {
                  ws.close();
                }
                resolve(null);
              }, 8000);
            },
            { once: true },
          );

          ws.addEventListener("error", () => {
            clearTimeout(timeout);
            resolve(null);
          });
        } catch (error) {
          console.error(`Error connecting to port ${port}:`, error);
          resolve(null);
        }
      });
    },
    [],
  );

  const attemptConnections = useCallback(async (): Promise<void> => {
    if (!projectPath) {
      console.warn("Project path not available yet");
      return;
    }

    setConnectionState((prev) => ({
      ...prev,
      error: null,
    }));

    for (let port = INITIAL_PORT; port < INITIAL_PORT + PORT_COUNT; port++) {
      console.log(`Attempting to connect to port ${port}...`);
      const ws = await tryConnectToPort(port, projectPath);

      if (ws) {
        console.log(`[useWebSocket] Connection successful at port ${port}`);
        setConnected(true);
        setSocket(ws);
        (window as any).__fileExplorerWs = ws;

        ws.addEventListener("message", (event) => {
          try {
            const data = JSON.parse(event.data);
            // Emit to internal subscribers
            webSocketMessageService.emit(data.type, data.payload);
            // Also dispatch custom event for backward compatibility
            window.dispatchEvent(
              new CustomEvent("websocket-message", { detail: data }),
            );
          } catch (error) {
            console.error("Failed to parse websocket message:", error);
          }
        });

        ws.addEventListener("close", () => {
          console.log("[useWebSocket] WebSocket disconnected");
          setConnected(false);
          setSocket(null);
          // Schedule reconnection attempt
          setTimeout(() => {
            setConnectionState((prev) => ({
              ...prev,
              attempts: 0,
            }));
            attemptConnections();
          }, RETRY_DELAY);
        });

        ws.addEventListener("error", (error) => {
          console.error("WebSocket error:", error);
        });

        return; // Success, exit the loop
      }
    }

    // No successful connection after trying all ports
    setConnectionState((prev) => {
      const newAttempts = prev.attempts + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        return {
          ...prev,
          attempts: newAttempts,
          error:
            "Failed to connect to VS Code extension after 20 attempts. Please click the refresh button to try again.",
        };
      }
      return {
        ...prev,
        attempts: newAttempts,
      };
    });

    // If we haven't reached max attempts, schedule retry
    setConnectionState((prev) => {
      if (prev.attempts < MAX_ATTEMPTS) {
        console.log(
          `Retry attempt ${prev.attempts + 1}/${MAX_ATTEMPTS} in 10 seconds...`,
        );
        setTimeout(attemptConnections, RETRY_DELAY);
      }
      return prev;
    });
  }, [projectPath, tryConnectToPort]);

  useEffect(() => {
    if (projectPath && !connected) {
      attemptConnections();
    }
  }, [projectPath, connected, attemptConnections]);

  const refreshConnection = useCallback((): void => {
    setConnected(false);
    setSocket(null);
    setConnectionState({
      port: null,
      attempts: 0,
      error: null,
    });
    attemptConnections();
  }, [attemptConnections]);

  const sendMessage = useCallback(
    (message: WebSocketMessage): void => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        console.warn("WebSocket not connected, message not sent");
      }
    },
    [socket],
  );

  return {
    connected,
    sendMessage,
    socket,
    connectionState,
    refreshConnection,
  };
}
