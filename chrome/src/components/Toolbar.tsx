import { useWebSocketStatus } from "../hooks/useWebSocketListener";
import "../styles/toolbar.css";

export function Toolbar(): JSX.Element {
  const { connected, connectionState, refreshConnection } =
    useWebSocketStatus();

  const handleRefresh = (): void => {
    refreshConnection();
  };

  return (
    <div className="toolbar">
      <span className="toolbar-title">Raplify Agent</span>
      <div className="toolbar-status">
        <span
          className={`connection-status ${connected ? "connected" : "disconnected"}`}
        >
          {connected ? "● Connected" : "● Disconnected"}
        </span>
        {connectionState.error && (
          <span className="connection-error">{connectionState.error}</span>
        )}
        <button
          className="refresh-button"
          onClick={handleRefresh}
          title="Retry connection to VS Code extension"
        >
          ↻ Refresh
        </button>
      </div>
    </div>
  );
}
