/**
 * WebSocket Message Emitter Service
 * Provides utilities to listen to and send WebSocket messages from any component
 */

interface WebSocketMessageListener {
  (data: any): void;
}

interface MessageListeners {
  [messageType: string]: Set<WebSocketMessageListener>;
}

class WebSocketMessageService {
  private listeners: MessageListeners = {};

  /**
   * Subscribe to a specific message type
   * @param messageType - The type of message to listen for
   * @param callback - Function to call when message is received
   * @returns Unsubscribe function
   */
  subscribe(
    messageType: string,
    callback: WebSocketMessageListener,
  ): () => void {
    if (!this.listeners[messageType]) {
      this.listeners[messageType] = new Set();
    }

    this.listeners[messageType].add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[messageType].delete(callback);
      // Clean up empty sets
      if (this.listeners[messageType].size === 0) {
        delete this.listeners[messageType];
      }
    };
  }

  /**
   * Emit a message to all subscribed listeners
   * @param messageType - The type of message
   * @param data - The message payload
   */
  emit(messageType: string, data: any): void {
    if (this.listeners[messageType]) {
      this.listeners[messageType].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `Error in WebSocket message listener for type "${messageType}":`,
            error,
          );
        }
      });
    }
  }

  /**
   * Get all subscribed message types
   */
  getSubscribedTypes(): string[] {
    return Object.keys(this.listeners);
  }

  /**
   * Clear all listeners for a specific message type
   */
  clearListeners(messageType: string): void {
    delete this.listeners[messageType];
  }

  /**
   * Clear all listeners
   */
  clearAll(): void {
    this.listeners = {};
  }
}

// Export singleton instance
export const webSocketMessageService = new WebSocketMessageService();
