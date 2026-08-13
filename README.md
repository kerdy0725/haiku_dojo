# 俳句道場

俳句を「音律・季語・情景・切れ・余韻」の観点から採点し、講評と二つの推敲例を返す Next.js アプリです。

## ローカル起動

```bash
npm install
cp .env.example .env.local
npm run dev
```

`OPENAI_API_KEY` は任意です。未設定時やAPIが利用できない場合も、ルールベースの基本採点で動作します。設定時は Responses API を使ったAI講評に自動で切り替わります。

## Vercel

1. GitHub の `kerdy0725/haiku_dojo` を Vercel に Import
2. Framework Preset は Next.js、Root Directory はリポジトリ直下
3. AI講評を使う場合は Environment Variables に `OPENAI_API_KEY` を追加
4. 必要なら `OPENAI_MODEL` を設定（既定: `gpt-5.4-nano`）

APIキーはクライアントへ公開されず、サーバールート内だけで使用されます。
