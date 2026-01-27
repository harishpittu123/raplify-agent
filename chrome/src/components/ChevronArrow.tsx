import React from "react";

export function ChevronArrow({
  style = {},
  size = 16,
}: {
  style?: React.CSSProperties;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: "inline",
        verticalAlign: "middle",
        margin: "0 4px",
        ...style,
      }}
    >
      <path
        d="M6 4L10 8L6 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
