import { useEffect, useRef, useState } from "react";
import { Editor } from "./Editor";
import { FileExplorer } from "./FileExplorer";
import { RightPanel } from "./RightPanel";
import { Toolbar } from "./Toolbar";

export function Layout() {
  const [leftPanelWidth, setLeftPanelWidth] = useState(250);
  const [rightPanelWidth, setRightPanelWidth] = useState(500);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingLeftRef = useRef(false);
  const isResizingRightRef = useRef(false);

  const MIN_PANEL_WIDTH = 200;
  const RIGHT_PANEL_MIN = 300;

  const handleMouseDown = (e: React.MouseEvent, isLeft: boolean) => {
    e.preventDefault();
    if (isLeft) {
      isResizingLeftRef.current = true;
    } else {
      isResizingRightRef.current = true;
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();

      if (isResizingLeftRef.current) {
        const newWidth = Math.max(
          MIN_PANEL_WIDTH,
          e.clientX - containerRect.left,
        );
        if (newWidth < containerRect.width - rightPanelWidth - 100) {
          setLeftPanelWidth(newWidth);
        }
      }

      if (isResizingRightRef.current) {
        const newWidth = Math.max(
          RIGHT_PANEL_MIN,
          containerRect.right - e.clientX,
        );
        if (newWidth < containerRect.width - leftPanelWidth - 100) {
          setRightPanelWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      isResizingLeftRef.current = false;
      isResizingRightRef.current = false;
    };

    if (isResizingLeftRef.current || isResizingRightRef.current) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [leftPanelWidth, rightPanelWidth]);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Toolbar />
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Left Panel */}
        <div style={{ width: `${leftPanelWidth}px`, overflow: "hidden" }}>
          <FileExplorer />
        </div>

        {/* Left Resizer */}
        <div
          className="resizer"
          onMouseDown={(e) => handleMouseDown(e, true)}
          style={{ cursor: "col-resize" }}
        />

        {/* Center Editor */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Editor />
        </div>

        {/* Right Resizer */}
        <div
          className="resizer"
          onMouseDown={(e) => handleMouseDown(e, false)}
          style={{ cursor: "col-resize" }}
        />

        {/* Right Panel */}
        <div style={{ width: `${rightPanelWidth}px`, overflow: "hidden" }}>
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
