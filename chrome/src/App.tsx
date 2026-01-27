import { useMemo } from "react";
import { Layout } from "./components/Layout";
import { WebSocketProvider } from "./context/WebSocketContext";
import { useWebSocket } from "./hooks/useWebSocket";
import "./styles/editor.css";
import "./styles/globals.css";

function AppContent() {
  return <Layout />;
}

function App() {
  const webSocketState = useWebSocket();

  // Memoize the context value to prevent unnecessary re-renders
  const memoizedValue = useMemo(
    () => webSocketState,
    [
      webSocketState.connected,
      webSocketState.socket,
      webSocketState.connectionState,
      webSocketState.sendMessage,
      webSocketState.refreshConnection,
    ],
  );

  return (
    <WebSocketProvider value={memoizedValue}>
      <AppContent />
    </WebSocketProvider>
  );
}

export default App;
