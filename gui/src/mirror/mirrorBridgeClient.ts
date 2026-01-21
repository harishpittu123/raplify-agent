import type { Dispatch } from "@reduxjs/toolkit";
import type { Message } from "core/protocol/messenger";

import {
  MirrorActionKey,
  MirrorActionMessage,
  MirrorActionPayloadMap,
  REDUX_MIRROR_ACTION_EVENT,
  REDUX_MIRROR_ALLOWED_COMMANDS,
  REDUX_MIRROR_COMMAND_EVENT,
  REDUX_MIRROR_COMMAND_RESPONSE_EVENT,
  REDUX_MIRROR_EVENT,
  REDUX_MIRROR_QUERY_PARAM,
  REDUX_MIRROR_WS_PATH,
  REDUX_MIRROR_WS_PORT,
} from "./constants";

declare global {
  interface Window {
    __continueMirrorActive?: boolean;
  }
}

type ReduxDispatch = Dispatch<any>;

const detectMirrorInstance = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get(REDUX_MIRROR_QUERY_PARAM) === "true";
};

let socket: WebSocket | null = null;
let initialized = false;
let mirrorActive = detectMirrorInstance();
let shouldReconnect = true;
const pendingMessages: string[] = [];

type OutboundMirrorMessage = {
  type: string;
  payload: unknown;
};

const buildSocketUrl = (): string => {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.hostname || "localhost";
  return `${protocol}://${host}:${REDUX_MIRROR_WS_PORT}${REDUX_MIRROR_WS_PATH}`;
};

const flushPendingMessages = (): void => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }
  while (pendingMessages.length > 0) {
    const serialized = pendingMessages.shift();
    if (serialized) {
      socket.send(serialized);
    }
  }
};

const enqueueMirrorMessage = (message: OutboundMirrorMessage): void => {
  const serialized = JSON.stringify(message);
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(serialized);
    return;
  }
  pendingMessages.push(serialized);
};

const dispatchMirrorState = (
  payload: { state?: unknown },
  dispatch: ReduxDispatch,
): void => {
  let payloadState = payload?.state;
  if (typeof payloadState === "string") {
    try {
      payloadState = JSON.parse(payloadState);
    } catch (error) {
      console.warn("Failed to parse mirrored Redux state", error);
      return;
    }
  }
  if (payloadState) {
    dispatch({ type: REDUX_MIRROR_EVENT, payload: payloadState });
  }
};

const handleSocketMessage = (
  event: MessageEvent,
  dispatch: ReduxDispatch,
): void => {
  console.log("Mirror bridge received message", event);
  try {
    const message = JSON.parse(event.data);
    if (message?.type === REDUX_MIRROR_EVENT) {
      dispatchMirrorState(message.payload, dispatch);
      return;
    }

    if (message?.type === REDUX_MIRROR_COMMAND_RESPONSE_EVENT) {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: message.payload,
        }),
      );
    }
  } catch (error) {
    console.warn("Failed to process mirror payload", error);
  }
};

export function initMirrorBridge(dispatch: ReduxDispatch): void {
  if (initialized || typeof window === "undefined" || !mirrorActive) {
    return;
  }

  initialized = true;
  mirrorActive = true;
  window.__continueMirrorActive = true;

  const connect = () => {
    const socketUrl = buildSocketUrl();
    socket = new WebSocket(socketUrl);

    socket.addEventListener("open", () => {
      flushPendingMessages();
    });

    socket.addEventListener("message", (event) =>
      handleSocketMessage(event, dispatch),
    );

    socket.addEventListener("close", () => {
      socket = null;
      if (shouldReconnect) {
        setTimeout(connect, 1000);
      }
    });

    socket.addEventListener("error", (error) => {
      console.warn("Mirror bridge websocket error", error);
    });
  };

  connect();

  window.addEventListener("beforeunload", () => {
    shouldReconnect = false;
    socket?.close();
  });
}

export function sendMirrorCommand(message: Message): boolean {
  if (!mirrorActive) {
    return false;
  }

  if (!REDUX_MIRROR_ALLOWED_COMMANDS.has(message.messageType)) {
    // Swallow non-allowed commands in mirror mode to avoid leaking excessive state
    return true;
  }

  enqueueMirrorMessage({
    type: REDUX_MIRROR_COMMAND_EVENT,
    payload: message,
  });

  return true;
}

export function isMirrorInstance(): boolean {
  return mirrorActive;
}

export function sendMirrorAction<T extends MirrorActionKey>(
  key: T,
  payload: MirrorActionPayloadMap[T],
): boolean {
  if (!mirrorActive) {
    return false;
  }

  const message: MirrorActionMessage<T> = {
    key,
    payload,
  };

  enqueueMirrorMessage({
    type: REDUX_MIRROR_ACTION_EVENT,
    payload: message,
  });

  return true;
}
