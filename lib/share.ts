export const SITE_ORIGIN = "https://haiku-dojo-web.vercel.app";

export type SharePayload = {
  haiku: string;
  score: number;
  rank: string;
  headline: string;
};

function clean(value: string | null | undefined, maxLength: number) {
  return (value ?? "").replace(/\r/g, "").trim().slice(0, maxLength);
}

export function parseSharePayload(searchParams: URLSearchParams): SharePayload {
  const rawScore = Number.parseInt(searchParams.get("score") ?? "0", 10);

  return {
    haiku: clean(searchParams.get("haiku"), 120) || "一句を、俳句道場へ。",
    score: Number.isFinite(rawScore) ? Math.min(100, Math.max(0, rawScore)) : 0,
    rank: clean(searchParams.get("rank"), 20) || "稽古中",
    headline: clean(searchParams.get("headline"), 60) || "ことばを削り、景色を残す。",
  };
}

export function makeShareSearchParams(payload: SharePayload) {
  return new URLSearchParams({
    v: "2",
    haiku: clean(payload.haiku, 120),
    score: String(Math.min(100, Math.max(0, Math.round(payload.score)))),
    rank: clean(payload.rank, 20),
    headline: clean(payload.headline, 60),
  });
}
