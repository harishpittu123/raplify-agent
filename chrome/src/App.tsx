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

  return (
    <WebSocketProvider value={webSocketState}>
      <AppContent />
    </WebSocketProvider>
  );
}

export default App;
