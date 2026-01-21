export const REDUX_MIRROR_QUERY_PARAM = "mirror";
export const REDUX_MIRROR_EVENT = "mirror/sync/redux-root";
export const REDUX_MIRROR_WS_PORT = 65434;
export const REDUX_MIRROR_WS_PATH = "/mirror";
export const REDUX_MIRROR_COMMAND_EVENT = "mirror/command";
export const REDUX_MIRROR_COMMAND_RESPONSE_EVENT = "mirror/command/response";

export const REDUX_MIRROR_ALLOWED_COMMANDS = new Set([
  "acceptDiff",
  "rejectDiff",
]);
