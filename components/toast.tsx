"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

type ToastProps = {
  message?: string;
  tone?: "success" | "error";
  onClose?: () => void;
};

export default function Toast({ message, tone = "success", onClose }: ToastProps) {
  const [dismissedMessage, setDismissedMessage] = useState<string | undefined>();

  if (!message) return null;
  if (dismissedMessage === message) return null;

  function dismiss() {
    setDismissedMessage(message);
    onClose?.();
  }

  return (
    <div className={`app-toast ${tone}`} role="alert">
      {tone === "success" ? <Check size={16} aria-hidden="true" /> : <X size={16} aria-hidden="true" />}
      <span>{message}</span>
      <button type="button" onClick={dismiss}>OK</button>
    </div>
  );
}
