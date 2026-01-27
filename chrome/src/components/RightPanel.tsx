import { useEffect, useRef } from "react";
import { useWebSocketStatus } from "../hooks/useWebSocketListener";
import "../styles/panels.css";

export function RightPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { connected, connectionState } = useWebSocketStatus();
  const iframeCreatedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Continue globals
    const setupGlobals = () => {
      if (!window.vscode) {
        window.vscode = {
          postMessage(message: unknown) {
            console.debug("[chrome shim] VS Code webview message", message);
          },
        };
      }
    };

    setupGlobals();

    // Only create iframe once and when we have a port
    if (iframeCreatedRef.current) {
      return;
    }

    if (!connected || !connectionState.port) {
      // Wait for connection to establish
      return;
    }

    iframeCreatedRef.current = true;

    // Create iframe for GUI with the connected WebSocket port
    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    const wsPort = connectionState.port;
    iframe.src = `http://localhost:5173/gui.html?mirror=true&chrome=true&port=${wsPort}`;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(iframe);
  }, [connected, connectionState.port]);

  return (
    <div className="panel">
      <div className="panel-header">Chat</div>
      <div
        className="panel-content"
        id="gui-container"
        ref={containerRef}
        style={{
          display: "flex",
          overflow: "hidden",
          padding: 0,
        }}
      />
    </div>
  );
}
