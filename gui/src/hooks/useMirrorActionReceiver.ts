import { useEffect } from "react";

import { MirrorActionKey } from "../mirror/constants";
import { isMirrorInstance } from "../mirror/mirrorBridgeClient";
import { useAppDispatch } from "../redux/hooks";
import { callToolById } from "../redux/thunks/callToolById";
import { cancelToolCallThunk } from "../redux/thunks/cancelToolCall";
import { streamResponseThunk } from "../redux/thunks/streamResponse";

export function useMirrorActionReceiver() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof window === "undefined" || isMirrorInstance()) {
      return;
    }

    const handler = (event: MessageEvent) => {
      const data = event.data as
        | { messageType?: string; data?: any }
        | undefined;
      if (!data || typeof data.messageType !== "string") {
        return;
      }

      switch (data.messageType) {
        case MirrorActionKey.CallToolById:
          dispatch(
            callToolById(data.data as Parameters<typeof callToolById>[0]),
          );
          break;
        case MirrorActionKey.CancelToolCall:
          dispatch(
            cancelToolCallThunk(
              data.data as Parameters<typeof cancelToolCallThunk>[0],
            ),
          );
          break;
        case MirrorActionKey.Enter:
          dispatch(
            streamResponseThunk(
              data.data as Parameters<typeof streamResponseThunk>[0],
            ),
          );
          break;
        default:
          break;
      }
    };

    window.addEventListener("message", handler);

    return () => {
      window.removeEventListener("message", handler);
    };
  }, [dispatch]);
}
