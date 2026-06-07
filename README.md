# Daily GenAI Log

Codexが毎日調査した生成AI情報を、静的HTMLで読むための保存先です。

## 使い方

1. `config/research.json` に重点URL・タグ・除外語を追加する
2. Codexへ「設定に従って本日の生成AI情報を調査し、`data/YYYY-MM-DD.json` と `data/index.json` を更新して」と依頼する
3. ローカルで確認する

```powershell
python -m http.server 8000
```

`http://localhost:8000` を開きます。ビルドや依存関係は不要です。

## 構成

- `config/research.json`: 調査対象と優先タグ
- `data/index.json`: トップページが読む最新号
- `data/YYYY-MM-DD.json`: 日ごとの調査結果
- `data/template.json`: Codexが生成時に従うJSONテンプレート
- `index.html` / `styles.css` / `app.js`: 表示用の静的サイト

`research.json` の `priority` は `high` / `medium` / `low`、タグの `weight` は `1` から `5` を目安にします。調査結果は `data/template.json` と同じ形式で生成します。
上部概要は `highlights`、各記事の箇条書きは `articles[].points` に3項目前後で記録します。
