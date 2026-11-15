"use client";

import { createMessages } from "@/lib/i18n/messages";
import { useEffect } from "react";

const uiCopy = createMessages("en");

/**
 * Root error boundary — replaces the whole document when the root layout itself throws,
 * so it must render its own <html>/<body> and cannot rely on globals.css or the Mint fonts.
 * Inline styles mirror the warm charcoal palette so it still looks on-brand with zero dependencies.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[keryx] global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          background: "#242322",
          color: "#f2eee8",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <p
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 12,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#a39c94",
            margin: 0,
          }}
        >
          {uiCopy("globalError.eyebrow")}
        </p>
        <h1 style={{ fontSize: "clamp(36px,7vw,64px)", fontWeight: 600, margin: 0, lineHeight: 1 }}>
          {uiCopy("globalError.title")}
        </h1>
        <p style={{ fontStyle: "italic", fontSize: "1.25rem", color: "#c9c2ba", maxWidth: 460, margin: 0 }}>
          {uiCopy("globalError.body")}
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1rem",
            background: "none",
            border: "none",
            borderBottom: "1px solid #d78363",
            paddingBottom: 4,
            fontFamily: "ui-monospace, monospace",
            fontSize: 14,
            color: "#d78363",
            cursor: "pointer",
          }}
        >
          {uiCopy("globalError.retry")}
        </button>
      </body>
    </html>
  );
}
