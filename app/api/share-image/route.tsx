import { ImageResponse } from "next/og";
import { parseSharePayload } from "@/lib/share";

const size = { width: 1200, height: 630 };

async function loadJapaneseFont(text: string) {
  const cssUrl = new URL("https://fonts.googleapis.com/css2");
  cssUrl.searchParams.set("family", "Noto Serif JP:wght@600");
  cssUrl.searchParams.set("text", text);

  const cssResponse = await fetch(cssUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "force-cache",
  });
  if (!cssResponse.ok) throw new Error("Font stylesheet could not be loaded");

  const css = await cssResponse.text();
  const fontUrl = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
  if (!fontUrl) throw new Error("Font URL was not found");

  const fontResponse = await fetch(fontUrl, { cache: "force-cache" });
  if (!fontResponse.ok) throw new Error("Font file could not be loaded");
  return fontResponse.arrayBuffer();
}

function ScoreImage({ haiku, score, rank, headline }: ReturnType<typeof parseSharePayload>) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", color: "#25251f", background: "#f4f0e7", padding: "62px 76px", fontFamily: "Noto Serif JP" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #d8d1c4", paddingBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 27, letterSpacing: ".16em" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 50, height: 50, marginRight: 18, color: "white", background: "#a43c2f", borderRadius: 3, letterSpacing: 0 }}>俳</span>
          俳句道場
        </div>
        <div style={{ color: "#a43c2f", fontSize: 18, letterSpacing: ".2em" }}>稽古の記録</div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 60 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 38, lineHeight: 1.65, letterSpacing: ".12em" }}>
            {haiku.split("\n").map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}
          </div>
          <div style={{ marginTop: 28, color: "#6f6d63", fontSize: 22 }}>{headline}</div>
        </div>
        <div style={{ width: 295, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 238, height: 238, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "12px solid #a43c2f", borderRadius: 999, background: "#fbfaf6" }}>
            <strong style={{ fontSize: 92, lineHeight: 1 }}>{score}</strong>
            <span style={{ color: "#6f6d63", fontSize: 20 }}>/ 100</span>
          </div>
          <div style={{ marginTop: 19, padding: "7px 18px", color: "#a43c2f", border: "2px solid #a43c2f", fontSize: 17, letterSpacing: ".14em" }}>{rank}</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#6f6d63", fontSize: 16, letterSpacing: ".1em" }}>
        <span>ことばを削り、景色を残す。</span><span>#haiku_dojo</span>
      </div>
    </div>
  );
}

function FallbackImage({ score }: { score: number }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#25251f", background: "#f4f0e7", padding: "80px", fontFamily: "serif" }}>
      <div style={{ display: "flex", flexDirection: "column" }}><span style={{ color: "#a43c2f", fontSize: 28, letterSpacing: ".2em" }}>HAIKU DOJO</span><strong style={{ marginTop: 28, fontSize: 58 }}>YOUR SCORE</strong><span style={{ marginTop: 24, color: "#6f6d63", fontSize: 24 }}>#haiku_dojo</span></div>
      <div style={{ width: 280, height: 280, display: "flex", alignItems: "center", justifyContent: "center", border: "14px solid #a43c2f", borderRadius: 999, background: "#fbfaf6", fontSize: 105 }}>{score}</div>
    </div>
  );
}

export async function GET(request: Request) {
  const payload = parseSharePayload(new URL(request.url).searchParams);
  try {
    const fontData = await loadJapaneseFont(`俳句道場稽古の記録点ことばを削り景色を残すHAIKUDOJYOURSC#haiku_dojo0123456789/・_${payload.haiku}${payload.rank}${payload.headline}`);
    return new ImageResponse(<ScoreImage {...payload} />, {
      ...size,
      fonts: [{ name: "Noto Serif JP", data: fontData, weight: 600, style: "normal" }],
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
    });
  } catch (error) {
    console.error("Share image font loading failed", error);
    return new ImageResponse(<FallbackImage score={payload.score} />, {
      ...size,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  }
}
