export type Category = {
  label: string;
  score: number;
  max: number;
  comment: string;
};

export type HaikuResult = {
  score: number;
  rank: string;
  headline: string;
  summary: string;
  rhythm: { pattern: string; score: number; comment: string };
  categories: Category[];
  strengths: string[];
  improvements: string[];
  examples: { haiku: string; reading: string; note: string }[];
  mode: "ai" | "fallback";
};

const seasonWords = [
  "春", "桜", "霞", "梅", "燕", "蛙", "夏", "蝉", "夕立", "蛍", "青嵐",
  "秋", "月", "紅葉", "虫", "稲妻", "冬", "雪", "氷", "木枯", "時雨", "初日",
];

const smallKana = new Set(["ゃ", "ゅ", "ょ", "ぁ", "ぃ", "ぅ", "ぇ", "ぉ", "ャ", "ュ", "ョ", "ァ", "ィ", "ゥ", "ェ", "ォ"]);

export function countMora(reading: string) {
  return Array.from(reading.replace(/[\s、。・／/]/g, "")).reduce(
    (total, char) => total + (smallKana.has(char) ? 0 : 1),
    0,
  );
}

export function splitHaiku(haiku: string) {
  const explicit = haiku.split(/\r?\n|[／/]/).map((line) => line.trim()).filter(Boolean);
  return explicit.length > 1 ? explicit : [haiku.trim()];
}

const fallbackExamples: Record<string, HaikuResult["examples"]> = {
  春: [
    { haiku: "春風や\nひかりをほどく\n川の面", reading: "はるかぜや／ひかりをほどく／かわのも", note: "動きのある季語から、水面の光へ焦点を絞りました。" },
    { haiku: "花の雨\n靴音ひとつ\n橋をゆく", reading: "はなのあめ／くつおとひとつ／はしをゆく", note: "音を一つ置き、静けさを引き立てました。" },
  ],
  夏: [
    { haiku: "夕立や\n軒に集まる\n土の匂い", reading: "ゆうだちや／のきにあつまる／つちのにおい", note: "視覚だけでなく匂いを加え、場面を立ち上げました。" },
    { haiku: "蝉しぐれ\n鍵穴だけが\n冷えている", reading: "せみしぐれ／かぎあなだけが／ひえている", note: "熱気と冷たさの対比で余韻を作りました。" },
  ],
  秋: [
    { haiku: "夕暮れや\n水面をわたる\n秋の風", reading: "ゆうぐれや／みなもをわたる／あきのかぜ", note: "切れ字のあとに、視線が遠くへ動く構成です。" },
    { haiku: "月白し\n机に残る\n鍵ひとつ", reading: "つきしろし／つくえにのこる／かぎひとつ", note: "物を一つだけ残し、物語を読者に委ねました。" },
  ],
  冬: [
    { haiku: "初雪や\nポストの赤を\n深くして", reading: "はつゆきや／ぽすとのあかを／ふかくして", note: "白と赤の対比で、景色を鮮明にしました。" },
    { haiku: "冬の星\n言えないことを\n靴に置く", reading: "ふゆのほし／いえないことを／くつにおく", note: "感情を説明せず、具体物に託しました。" },
  ],
};

export function createFallbackResult(haiku: string, reading?: string): HaikuResult {
  const lines = splitHaiku(haiku);
  const readingLines = reading ? splitHaiku(reading) : [];
  const counts = readingLines.length === lines.length
    ? readingLines.map(countMora)
    : lines.map((line) => Array.from(line.replace(/[\s、。]/g, "")).length);
  const rhythmDistance = counts.length === 3
    ? Math.abs(counts[0] - 5) + Math.abs(counts[1] - 7) + Math.abs(counts[2] - 5)
    : 8;
  const rhythmScore = Math.max(4, 25 - rhythmDistance * 3);
  const found = seasonWords.find((word) => haiku.includes(word));
  const seasonScore = found ? 18 : 8;
  const cutFound = /や|かな|けり|よ|ぞ/.test(haiku);
  const cutScore = cutFound ? 13 : 8;
  const imageryScore = /風|雨|光|音|匂|空|川|海|山|花|鳥|影|星|月|雪/.test(haiku) ? 17 : 11;
  const aftertasteScore = Math.max(10, Math.min(20, 21 - Math.max(0, haiku.length - 24)));
  const score = rhythmScore + seasonScore + cutScore + imageryScore + aftertasteScore;
  const season = found && ["春", "夏", "秋", "冬"].includes(found) ? found : found && /桜|霞|梅|燕|蛙/.test(found) ? "春" : found && /蝉|夕立|蛍|青嵐/.test(found) ? "夏" : found && /月|紅葉|虫|稲妻/.test(found) ? "秋" : "冬";
  const examples = fallbackExamples[season || "秋"];

  return {
    score,
    rank: score >= 85 ? "師範" : score >= 70 ? "上段" : score >= 55 ? "中段" : "初段",
    headline: found ? `${found}の気配を、もう一歩くっきりと` : "一句の中心となる景色を定めましょう",
    summary: "言葉を足すより、いちばん見せたい瞬間を一つ選ぶと句が強くなります。読みを添えると、音数をより正確に採点できます。",
    rhythm: {
      pattern: counts.join("・"),
      score: rhythmScore,
      comment: reading ? "入力された読みから音数を数えました。" : "文字数による目安です。正確な音数には読みを入力してください。",
    },
    categories: [
      { label: "季語", score: seasonScore, max: 20, comment: found ? `「${found}」が季節の入口になっています。` : "季語を一つ置くと、景色と時間が締まります。" },
      { label: "情景", score: imageryScore, max: 20, comment: imageryScore > 15 ? "目に浮かぶ具体的な手がかりがあります。" : "色・音・匂いのどれかを具体化してみましょう。" },
      { label: "切れ", score: cutScore, max: 15, comment: cutFound ? "切れが一句に間を作っています。" : "二つの景を取り合わせると余白が生まれます。" },
      { label: "余韻", score: aftertasteScore, max: 20, comment: "説明を一つ削ると、読者の想像が入りやすくなります。" },
    ],
    strengths: [found ? `季節を感じる「${found}」が入っています。` : "短い言葉の中に焦点を作ろうとしています。", lines.length === 3 ? "三つのまとまりがあり、呼吸が伝わります。" : "一息で読める簡潔さがあります。"],
    improvements: ["感情を直接言わず、見えた物や聞こえた音に置き換える。", "一句の中で最も弱い説明語を一つ削ってみる。"],
    examples,
    mode: "fallback",
  };
}
