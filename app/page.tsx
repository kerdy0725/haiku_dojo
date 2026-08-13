"use client";

import { FormEvent, useState } from "react";
import type { HaikuResult } from "@/lib/haiku";
import { makeShareSearchParams } from "@/lib/share";

const sample = "古池や\n蛙飛びこむ\n水の音";

export default function Home() {
  const [haiku, setHaiku] = useState("");
  const [reading, setReading] = useState("");
  const [result, setResult] = useState<HaikuResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function evaluate(event: FormEvent) {
    event.preventDefault();
    if (!haiku.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ haiku, reading }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "採点できませんでした。");
      setResult(data);
      requestAnimationFrame(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "しばらくしてから、もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  function clearForm() {
    setHaiku("");
    setReading("");
    setResult(null);
    setError("");
    requestAnimationFrame(() => document.getElementById("haiku")?.focus());
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="俳句道場 ホーム"><span>俳</span> 俳句道場</a>
        <span className="header-note">一句を磨く、静かな稽古場</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">HAIKU DOJO · AI REVIEW</p>
          <h1><span>ことばを削り、</span><em>景色を残す。</em></h1>
          <p className="lead">あなたの一句を五つの眼で読み解き、強みと伸びしろ、二つの推敲例をお返しします。</p>
          <div className="criteria" aria-label="採点基準">
            <span>音律</span><span>季語</span><span>情景</span><span>切れ</span><span>余韻</span>
          </div>
        </div>

        <form className="dojo-card" onSubmit={evaluate}>
          <div className="card-heading">
            <div><small>本日の稽古</small><h2>一句、どうぞ。</h2></div>
            <span className="seal">投<br />句</span>
          </div>
          <label htmlFor="haiku">俳句 <span>必須</span></label>
          <textarea id="haiku" value={haiku} onChange={(e) => setHaiku(e.target.value)} maxLength={120} placeholder={"春の雨\n窓辺に残る\n指の跡"} required />
          <div className="input-meta"><button type="button" className="text-button" onClick={() => setHaiku(sample)}>お手本を入れる</button><span>{haiku.length} / 120</span></div>
          <details>
            <summary>読みを添える <span>より正確な音数に</span></summary>
            <input aria-label="俳句の読み" value={reading} onChange={(e) => setReading(e.target.value)} maxLength={180} placeholder="はるのあめ／まどべにのこる／ゆびのあと" />
          </details>
          <button className="submit" disabled={!haiku.trim() || loading}>{loading ? <><i /> 師匠が一句を読んでいます</> : <>この句を採点する <b>→</b></>}</button>
          <button type="button" className="clear-form" onClick={clearForm} disabled={loading || (!haiku && !reading && !result)}>入力をクリア</button>
          {error && <p className="error" role="alert">{error}</p>}
          <p className="privacy">入力した俳句は、この画面には保存されません。</p>
        </form>
      </section>

      {result && <Result haiku={haiku} result={result} />}

      <footer><span>俳句道場</span><p>正解は一つではありません。講評を手がかりに、あなたの一句を。</p></footer>
    </main>
  );
}

function Result({ haiku, result }: { haiku: string; result: HaikuResult }) {
  const [downloading, setDownloading] = useState(false);
  const [shareError, setShareError] = useState("");

  function getShareUrls() {
    const query = makeShareSearchParams({
      haiku,
      score: result.score,
      rank: result.rank,
      headline: result.headline,
    }).toString();
    return {
      page: `${window.location.origin}/share?${query}`,
      image: `${window.location.origin}/api/share-image?${query}`,
    };
  }

  function postToX() {
    const { page } = getShareUrls();
    const text = `${haiku.trim()}\n\n俳句道場の採点：${result.score}点（${result.rank}）\n${result.headline}\n\n#haiku_dojo`;
    const intent = new URL("https://twitter.com/intent/tweet");
    intent.searchParams.set("text", text);
    intent.searchParams.set("url", page);
    window.open(intent.toString(), "_blank", "noopener,noreferrer");
  }

  async function downloadImage() {
    setDownloading(true);
    setShareError("");
    try {
      const response = await fetch(getShareUrls().image);
      if (!response.ok) throw new Error("画像を作成できませんでした。");
      const blobUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `haiku-dojo-${result.score}.png`;
      anchor.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "画像を作成できませんでした。");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="result" id="result">
      <div className="result-title"><p className="eyebrow">稽古の記録</p><h2>師匠からの講評</h2></div>
      <div className="score-panel">
        <div className="score-ring" style={{ "--score": `${result.score * 3.6}deg` } as React.CSSProperties}><div><strong>{result.score}</strong><span>/ 100</span></div></div>
        <div><span className="rank">{result.rank}</span><h3>{result.headline}</h3><p>{result.summary}</p></div>
      </div>

      {result.mode === "fallback" && <p className="mode-note">現在は基本採点モードです。読みを添えると音数の精度が上がります。</p>}

      <div className="review-grid">
        <article className="rhythm-card"><small>音律</small><strong>{result.rhythm.pattern}</strong><div className="meter"><i style={{ width: `${result.rhythm.score * 4}%` }} /></div><p>{result.rhythm.comment}</p></article>
        {result.categories.map((category) => <article key={category.label}><div className="category-head"><h3>{category.label}</h3><b>{category.score}<span> / {category.max}</span></b></div><div className="meter"><i style={{ width: `${Math.min(100, category.score / category.max * 100)}%` }} /></div><p>{category.comment}</p></article>)}
      </div>

      <div className="lists">
        <article><span className="list-icon good">○</span><h3>この句のよいところ</h3><ul>{result.strengths.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article><span className="list-icon next">↗</span><h3>次の推敲で試すこと</h3><ul>{result.improvements.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </div>

      <div className="share-panel">
        <div><p className="eyebrow">SHARE YOUR HAIKU</p><h2>この一句を、Xへ。</h2><p>俳句・採点結果・画像カード・URL・#haiku_dojo をまとめて投稿できます。</p></div>
        <div className="share-actions">
          <button type="button" className="x-share" onClick={postToX}><span>𝕏</span> Xに投稿する</button>
          <button type="button" className="image-download" onClick={downloadImage} disabled={downloading}>{downloading ? "画像を作成中…" : "結果画像を保存"}</button>
          {shareError && <p className="error" role="alert">{shareError}</p>}
        </div>
      </div>

      <div className="examples">
        <div className="examples-heading"><div><p className="eyebrow">推敲の見本</p><h2>同じ種から、二つの景色。</h2></div><p>原句の核を残しながら、焦点の置き方を変えました。</p></div>
        <div className="example-grid">{result.examples.map((example, index) => <article key={index}><span>案 {index + 1}</span><blockquote>{example.haiku.split("\n").map((line) => <span key={line}>{line}</span>)}</blockquote><small>{example.reading}</small><p>{example.note}</p></article>)}</div>
      </div>
      <a className="again" href="#top">もう一句、稽古する ↑</a>
    </section>
  );
}
