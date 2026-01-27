/**
 * Example component demonstrating WebSocket usage
 * This shows how to listen to and send WebSocket messages from any component
 */

import { useState } from "react";
import {
  useWebSocketListener,
  useWebSocketSend,
  useWebSocketStatus,
} from "../hooks/useWebSocketListener";

export function WebSocketExampleComponent() {
  const { sendMessage, connected } = useWebSocketSend();
  const { connected: isConnected, connectionState } = useWebSocketStatus();
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");

  // Listen to incoming messages
  useWebSocketListener("MESSAGE", (data: any) => {
    setReceivedMessages((prev) => [
      ...prev,
      { type: "MESSAGE", timestamp: new Date(), data },
    ]);
  });

  useWebSocketListener("ERROR", (data: any) => {
    setReceivedMessages((prev) => [
      ...prev,
      { type: "ERROR", timestamp: new Date(), data },
    ]);
  });

  const handleSendMessage = () => {
    if (!connected) {
      alert("WebSocket not connected");
      return;
    }

    sendMessage("CUSTOM_MESSAGE", {
      text: inputMessage,
      timestamp: new Date().toISOString(),
    });

    setInputMessage("");
  };

  return (
    <div
      style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}
    >
      <h2>WebSocket Example Component</h2>

      {/* Connection Status */}
      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          backgroundColor: "#f0f0f0",
        }}
      >
        <h3>Connection Status</h3>
        <p>
          Status:{" "}
          <strong>{isConnected ? "✓ Connected" : "✗ Disconnected"}</strong>
        </p>
        {isConnected && <p>Port: {connectionState.port}</p>}
        {connectionState.error && (
          <p style={{ color: "red" }}>Error: {connectionState.error}</p>
        )}
        <p>Attempts: {connectionState.attempts}</p>
      </div>

      {/* Send Message */}
      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <h3>Send Message</h3>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Enter message..."
          style={{ padding: "8px", width: "300px", marginRight: "10px" }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!connected}
          style={{
            padding: "8px 16px",
            backgroundColor: connected ? "#4CAF50" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: connected ? "pointer" : "not-allowed",
          }}
        >
          Send
        </button>
      </div>

      {/* Received Messages */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Received Messages ({receivedMessages.length})</h3>
        <button
          onClick={() => setReceivedMessages([])}
          style={{
            padding: "8px 16px",
            marginBottom: "10px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Clear
        </button>

        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid #ddd",
            padding: "10px",
            backgroundColor: "#fff",
          }}
        >
          {receivedMessages.length === 0 ? (
            <p style={{ color: "#999" }}>No messages received yet</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              {receivedMessages.map((msg, idx) => (
                <li
                  key={idx}
                  style={{
                    marginBottom: "8px",
                    padding: "8px",
                    backgroundColor:
                      msg.type === "ERROR" ? "#ffebee" : "#f5f5f5",
                    borderRadius: "4px",
                  }}
                >
                  <strong>[{msg.type}]</strong>{" "}
                  {msg.timestamp.toLocaleTimeString()}
                  <br />
                  <code>{JSON.stringify(msg.data, null, 2)}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Usage Example Code */}
      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#f0f0f0",
        }}
      >
        <h3>How to Use in Your Component</h3>
        <pre style={{ overflow: "auto", fontSize: "12px" }}>
          {`import { useWebSocketListener, useWebSocketSend } from "@/hooks/useWebSocketListener";

export function MyComponent() {
  const { sendMessage, connected } = useWebSocketSend();

  // Listen to incoming messages
  useWebSocketListener("MESSAGE", (data) => {
    console.log("Received:", data);
  });

  const handleSend = () => {
    if (connected) {
      sendMessage("CUSTOM_MESSAGE", { 
        text: "Hello from my component" 
      });
    }
  };

  return <button onClick={handleSend}>Send Message</button>;
}`}
        </pre>
      </div>
    </div>
  );
}
