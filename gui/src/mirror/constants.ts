import { JSONContent } from "@tiptap/core";
import { InputModifiers } from "core";

export const REDUX_MIRROR_QUERY_PARAM = "mirror";
export const REDUX_MIRROR_EVENT = "mirror/sync/redux-root";
export const REDUX_MIRROR_WS_PORT = 65434;
export const REDUX_MIRROR_WS_PATH = "/mirror";
export const REDUX_MIRROR_COMMAND_EVENT = "mirror/command";
export const REDUX_MIRROR_COMMAND_RESPONSE_EVENT = "mirror/command/response";
export const REDUX_MIRROR_ACTION_EVENT = "mirror/action";
export const REDUX_MIRROR_VSCODE_EVENT = "mirror/vscode";

export const REDUX_MIRROR_ALLOWED_COMMANDS = new Set([
  "acceptDiff",
  "rejectDiff",
]);

export enum MirrorActionKey {
  CallToolById = "mirror/action/callToolById",
  CancelToolCall = "mirror/action/cancelToolCall",
  Enter = "mirror/action/enter",
}

export type MirrorActionPayloadMap = {
  [MirrorActionKey.CallToolById]: {
    toolCallId: string;
    isAutoApproved?: boolean;
    depth?: number;
  };
  [MirrorActionKey.CancelToolCall]: {
    toolCallId: string;
  };
  [MirrorActionKey.Enter]: {
    editorState: JSONContent;
    modifiers: InputModifiers;
    index?: number;
  };
};

export type MirrorActionMessage<K extends MirrorActionKey = MirrorActionKey> = {
  key: K;
  payload: MirrorActionPayloadMap[K];
};
