import type { Middleware } from "@reduxjs/toolkit";
import type { ReduxMirrorPayload } from "core/protocol/ideWebview";
import type { IIdeMessenger } from "../../context/IdeMessenger";

const MIRROR_MESSAGE_TYPE = "mirror/redux-root";
const REACT_ELEMENT_SYMBOL =
  typeof Symbol === "function" && typeof Symbol.for === "function"
    ? Symbol.for("react.element")
    : undefined;

type ActionLike =
  | { type?: unknown }
  | string
  | ((...args: any[]) => any)
  | undefined;

function deriveActionType(action: ActionLike): string {
  if (typeof action === "string") {
    return action;
  }

  if (typeof action === "function") {
    return action.name || "thunk";
  }

  if (action && typeof action === "object" && "type" in action) {
    const typeValue = (action as { type?: unknown }).type;
    if (typeof typeValue === "string") {
      return typeValue;
    }
    if (typeValue == null) {
      return "unknown";
    }
    return String(typeValue);
  }

  return "unknown";
}

function sanitizeForMirror(
  value: unknown,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "undefined") {
    return null;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "symbol") {
    return value.toString();
  }

  if (typeof value === "function") {
    return `[Function ${(value as Function).name || "anonymous"}]`;
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
    const sanitized = value.map((entry) => sanitizeForMirror(entry, seen));
    seen.delete(value);
    return sanitized;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Map) {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
    const entries: Record<string, unknown> = {};
    for (const [key, entryValue] of value.entries()) {
      entries[String(key)] = sanitizeForMirror(entryValue, seen);
    }
    seen.delete(value);
    return { __type: "Map", entries };
  }

  if (value instanceof Set) {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
    const sanitizedValues = Array.from(value.values()).map((entry) =>
      sanitizeForMirror(entry, seen),
    );
    seen.delete(value);
    return { __type: "Set", values: sanitizedValues };
  }

  if (typeof value === "object" && value !== null) {
    const typedValue = value as Record<string | symbol, unknown>;
    if (seen.has(typedValue)) {
      return "[Circular]";
    }
    seen.add(typedValue);

    if (
      REACT_ELEMENT_SYMBOL &&
      (typedValue as { $$typeof?: symbol }).$$typeof === REACT_ELEMENT_SYMBOL
    ) {
      seen.delete(typedValue);
      return "[ReactElement]";
    }

    const sanitizedObject: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(typedValue)) {
      sanitizedObject[key] = sanitizeForMirror(entryValue, seen);
    }
    seen.delete(typedValue);
    return sanitizedObject;
  }

  return value;
}

export const createReduxMirrorMiddleware = (
  ideMessenger: IIdeMessenger,
): Middleware => {
  return (storeApi) => (next) => (action) => {
    const result = next(action);

    try {
      const payload: ReduxMirrorPayload = {
        actionType: deriveActionType(action as ActionLike),
        state: JSON.stringify(storeApi.getState()),
      };

      ideMessenger.post(MIRROR_MESSAGE_TYPE, payload);
    } catch (error) {
      console.warn("Failed to mirror redux state", error);
    }

    return result;
  };
};
