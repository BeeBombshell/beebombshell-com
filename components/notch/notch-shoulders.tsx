import React from "react";

export function NotchLeftShoulder({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`block shrink-0 fill-[var(--fg)] transition-colors duration-500 ${className}`}
      aria-hidden="true"
    >
      <path d="M0 0H16V16A16 16 0 0 0 0 0Z" />
    </svg>
  );
}

export function NotchRightShoulder({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`block shrink-0 fill-[var(--fg)] transition-colors duration-500 scale-x-[-1] ${className}`}
      aria-hidden="true"
    >
      <path d="M0 0H16V16A16 16 0 0 0 0 0Z" />
    </svg>
  );
}
