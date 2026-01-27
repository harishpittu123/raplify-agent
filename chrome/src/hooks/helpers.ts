interface ReactFiber {
  return?: ReactFiber;
  child?: ReactFiber;
  sibling?: ReactFiber;
  _debugSource?: {
    fileName?: string;
  };
  [key: string]: unknown;
}

const getAnyFiberFromDom = (): ReactFiber | null => {
  const all = document.querySelectorAll("*");
  for (const el of all) {
    for (const key in el) {
      if (key.startsWith("__reactFiber$")) {
        return (el as any)[key];
      }
      if (key.startsWith("__reactContainer$")) {
        const container = (el as any)[key];
        if (container?._reactRootContainer?._internalRoot?.current) {
          return container._reactRootContainer._internalRoot.current;
        }
      }
    }
  }
  return null;
};

const climbToRoot = (fiber: ReactFiber): ReactFiber => {
  let node = fiber;
  while (node.return) {
    node = node.return;
  }
  return node;
};

const getRootFiber = (): ReactFiber | null => {
  const fiber = getAnyFiberFromDom();
  if (!fiber) return null;
  return climbToRoot(fiber);
};
export const findDebugFilePath = (): string | null => {
  const fiber: ReactFiber | null = getRootFiber();
  if (!fiber) return null;

  const stack: ReactFiber[] = [fiber];

  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;

    if (node._debugSource?.fileName) {
      return node._debugSource.fileName as string;
    }

    if (node.child) stack.push(node.child);
    if (node.sibling) stack.push(node.sibling);
  }

  return null;
};

// // FNV-1a 32-bit hash
// const fnv1a = (str: string): number => {
//   let hash = 0x811c9dc5;
//   for (let i = 0; i < str.length; i++) {
//     hash ^= str.charCodeAt(i);
//     hash = (hash * 0x01000193) >>> 0;
//   }
//   return hash >>> 0;
// };

// // Map hash to port range
// const hashToPort = (hash: number): number => {
//   const min = 12000;
//   const max = 20000;
//   return min + (hash % (max - min));
// };

// const extractWorkspaceFromSrcPath = (srcPath: string): string => {
//   const idx = srcPath.indexOf("/src/");
//   if (idx === -1) return srcPath;
//   const parts = srcPath.substring(0, idx).split("/");
//   return parts.join("/"); // path till workspace folder
// };

// const generatePortFromPath = (path: string): number => {
//   const hash = fnv1a(path);
//   return hashToPort(hash);
// };

// console.log("Port:", generatePortFromPath(projectPath ?? ""));
