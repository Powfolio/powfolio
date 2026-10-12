import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} | Web3 proof of work, CV, trades, writing and onchain`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0D0D0C",
          color: "#B9853A",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: "-0.04em" }}>{SITE_NAME}</div>
        <div style={{ marginTop: 16, fontSize: 28, color: "#C9B896" }}>
          Proof of work, CV, trades, writing, onchain
        </div>
      </div>
    ),
    size
  );
}
