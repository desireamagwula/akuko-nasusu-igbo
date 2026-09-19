import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { DEFAULT_SITE_NAME } from "@/lib/site";

// Default share image for pages without a thumbnail. Rendered once at build time.
export const alt = DEFAULT_SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [semibold, regular] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Geist-SemiBold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Geist-Regular.ttf")),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#17130F",
          color: "#F6F2EA",
          padding: 72,
          fontFamily: "Geist",
        }}
      >
        <div style={{ width: 72, height: 72, background: "#A4161A", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, lineHeight: 1.02, letterSpacing: -2, fontWeight: 600 }}>{DEFAULT_SITE_NAME}</div>
          <div style={{ marginTop: 28, fontSize: 32, color: "#B9AFA3", fontWeight: 400 }}>
            News, culture, sport and entertainment in Igbo and English
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: semibold, weight: 600, style: "normal" },
        { name: "Geist", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
