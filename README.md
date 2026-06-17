# Daily GenAI Log

Codex が日次で生成 AI の情報を調査し、静的 HTML で閲覧できるログとして保存するためのリポジトリです。

## 使い方

1. `config/research.json` に調査対象ソース、タグ、除外条件を定義します。
2. Codex が当日の調査結果を `data/YYYY-MM-DD.json` と `data/index.json` に反映します。
3. ローカル確認が必要な場合は、次のコマンドで簡易サーバーを起動します。

```powershell
python -m http.server 8000
```

`http://localhost:8000` を開くと、ビルド不要で内容を確認できます。

## 構成

- `config/research.json`: 調査対象と選定ルール
- `data/index.json`: 最新版とアーカイブ一覧
- `data/YYYY-MM-DD.json`: 日次ログ本体
- `data/template.json`: 日次 JSON のテンプレート
- `index.html` / `styles.css` / `app.js`: 表示用の静的サイト

`research.json` の `priority` は `high` / `medium` / `low`、タグの `weight` は `1` から `5` を想定しています。日次ログは `data/template.json` と同じ形で作成し、概要は `summary` に短い導入文、`overview` に `title > items[].title > items[].points[]` の3階層、`highlights` に補助的な3項目前後を記録します。各記事の要点は `articles[].points` に 3 項目前後で記録します。

## Automation policy

- `data/YYYY-MM-DD.json` と `data/index.json` を更新した後、automation は JSON 構文、件数、重複、参照先の検証を行います。
- 検証が通った場合、automation は同じ run の中で `git add`、`git commit`、`git push` まで実行します。
- 検証失敗や、関係のない差分が混在していて安全に確定できない場合は、commit / push の前で停止して理由を報告します。
