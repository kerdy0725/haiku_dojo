import type { Metadata } from "next";
import Link from "next/link";
import { makeShareSearchParams, parseSharePayload, SITE_ORIGIN } from "@/lib/share";

type SharePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toUrlSearchParams(values: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string") params.set(key, value);
  }
  return params;
}

async function getPayload(searchParams: SharePageProps["searchParams"]) {
  return parseSharePayload(toUrlSearchParams(await searchParams));
}

export async function generateMetadata({ searchParams }: SharePageProps): Promise<Metadata> {
  const payload = await getPayload(searchParams);
  const query = makeShareSearchParams(payload).toString();
  const shareUrl = `${SITE_ORIGIN}/share?${query}`;
  const imageUrl = `${SITE_ORIGIN}/api/share-image?${query}`;
  const description = `俳句道場の採点は${payload.score}点（${payload.rank}）。${payload.headline}`;

  return {
    title: `${payload.score}点「${payload.haiku.replace(/\n/g, " ") }」｜俳句道場`,
    description,
    alternates: { canonical: shareUrl },
    openGraph: {
      type: "website",
      url: shareUrl,
      title: `${payload.score}点｜俳句道場`,
      description,
      siteName: "俳句道場",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `俳句道場 採点結果 ${payload.score}点` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${payload.score}点｜俳句道場`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const payload = await getPayload(searchParams);

  return (
    <main className="share-page">
      <section className="shared-result">
        <p className="eyebrow">HAIKU DOJO · SCORE</p>
        <div className="shared-brand"><span>俳</span>俳句道場</div>
        <blockquote className="shared-haiku">
          {payload.haiku.split("\n").map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}
        </blockquote>
        <div className="shared-score"><strong>{payload.score}</strong><span>/ 100</span></div>
        <span className="rank">{payload.rank}</span>
        <h1>{payload.headline}</h1>
        <Link className="submit share-return" href="/#top">自分の俳句を採点する <b>→</b></Link>
      </section>
    </main>
  );
}
