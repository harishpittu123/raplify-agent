interface VSCodeAPI {
  postMessage(message: unknown): void;
}

declare global {
  interface Window {
    vscode: VSCodeAPI;
  }
}

export {};
