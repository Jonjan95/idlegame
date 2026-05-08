"use client";

import { useGame } from "../context/GameContext";

export default function Notifications() {
  const { toasts } = useGame();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2.5 border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-2xl"
        >
          <span>{toast.icon}</span>
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );
}
