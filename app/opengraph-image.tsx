import { ImageResponse } from "next/og";
import { productGuideCopy } from "@/locales/en/product-guide";

export const alt = productGuideCopy("product.socialAlt");
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social card for Arch's SERV + Reppo hackathon entry.
export default function OpengraphImage() {
  const [titleLine, emphasizedLine] = productGuideCopy("product.socialTitle").split("\n");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#06070c",
          backgroundImage: "linear-gradient(rgba(122,162,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(122,162,255,0.08) 1px, transparent 1px), radial-gradient(circle at 76% 18%, rgba(69,105,198,0.2), transparent 44%)",
          backgroundSize: "42px 42px, 42px 42px, 100% 100%",
          color: "#e8ebf7",
          padding: 56,
          fontFamily: "Arial, sans-serif",
          border: "1px solid rgba(122,162,255,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 18,
            letterSpacing: 3,
            color: "#aab5d1",
            textTransform: "uppercase",
          }}
        >
          <span>SERV REASONING · REPPO EVALUATION</span>
          <span>EDITION 02 · 2026</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 76, lineHeight: 1.08, fontWeight: 700 }}>{titleLine}</div>
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.08,
              fontWeight: 700,
              color: "#7aa2ff",
            }}
          >
            {emphasizedLine}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 64,
              border: "3px solid #7aa2ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7aa2ff",
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>Arch</div>
          <div style={{ fontSize: 18, color: "#aab5d1", letterSpacing: 2 }}>
            {productGuideCopy("product.socialSubtitle")}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
