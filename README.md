# web_shooting - AI搭載 縦スクロール弾幕シューティング

![License](https://img.shields.io/badge/license-MIT-blue.svg)  
![Phaser](https://img.shields.io/badge/Phaser-3.x-green.svg)  
![Python](https://img.shields.io/badge/Python-3.x-blue.svg)  
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-orange.svg)

## 📖 概要 (Overview)
本リポジトリはWebブラウザ上で動作する縦スクロール弾幕シューティングのプロトタイプです。
最終的な目標は「プレイヤー挙動を学習して共闘する味方機（Ally）」を実装することですが、現時点では学習・推論パイプラインの準備と、ルールベースの味方機、データ収集機構を中心に実装しています。

## 🏗 現在の実装状況（プロトタイプ）

### 実装済み
- プレイヤー操作、敵エンティティ、弾の発生と更新（`frontend/src/entities/Player.js`, `Enemy.js`, `BulletManager.js`）
- ルールベース味方機（`frontend/src/entities/Ally.js`）
	- プレイヤーを追従し、近接する敵に支援射撃を行う
	- 味方弾（`meta='ally'`）で敵を倒せる衝突処理
	- 味方にHP（3）を実装。敵弾で3回被弾すると味方は消滅
- 味方HP を HUD に表示（`GameScene` 内の HUD 表示）
- 弾の空間インデックス（`frontend/src/physics/SpatialHash.js`）と近傍検索
- デバッグオーバーレイ（`D` キーでトグル）: 状態（State）JSON表示、近傍弾の可視化
- HitmapRecorder とサーバ送信機能（`frontend/src/analytics/HitmapRecorder.js`、`frontend/src/logger.js`）
- サーバ API（Flask）
	- `POST /api/upload-log`（状態ログ受信）
	- `POST /api/upload-hitmap`（ヒット座標の受信）
	- `GET /api/hitmap-data`（保存されたヒットデータをJSONで返す）
	- `GET /hitmap`（静的なヒットマップビューア: `server/static/hitmap.html`）

### 未実装 / 予定
- ブラウザ上での TensorFlow.js によるリアルタイム推論（`AIController` の統合）
- サーバ側でのトレーニングスクリプトと自動化（`server/trainer/`）
- 大量弾（数千）での高性能化（オブジェクトプール、WebGL ブリット等）
- 敵 AI の適応化（ヒットマップを活用したスポーン分布の最適化）

## 📂 ディレクトリ構成（抜粋）
```
web_shooting/
├── frontend/
│   ├── index.html
│   └── src/
│       ├── scenes/GameScene.js
│       ├── entities/
│       │   ├── Player.js
│       │   ├── Enemy.js
│       │   └── Ally.js
│       ├── bullets/BulletManager.js
│       ├── physics/SpatialHash.js
│       ├── components/MovementComponent.js
│       └── analytics/HitmapRecorder.js
├── server/
│   ├── app.py
│   └── static/hitmap.html
└── README.md
```

## ⚙️ ローカル実行方法（開発用）
- サーバ起動（開発用 Flask）:
	```powershell
	python ./server/app.py
	```
	- サーバは `http://localhost:5000` をリッスンします。
	- ヒットマップビューア: `http://localhost:5000/hitmap`

- フロントを静的配信して確認（簡易）:
	```powershell
	python -m http.server 5500 --directory frontend
	```
	- ブラウザで `http://127.0.0.1:5500` を開いて `index.html` を表示

## 開発ノート / 注意事項
- 現状はプロトタイプ実装です。パフォーマンス面は簡易実装のため、本番利用や大量弾を扱う場合は最適化が必要です。
- サーバ側は開発向けにCORSを緩めています。本番環境では適切な認証・制限を加えてください。
- `collectState()` は現在、`nearest_bullets` を「敵弾のみ」に限定して収集しています（AI に回避を学習させやすくするため）。

## 次のステップ候補
1. `AIController`（TF.js）スケルトンの実装とモデルロードの統合
2. サーバ側の学習スクリプト雛形（`server/trainer/`）を追加
3. 味方死亡時の演出（爆発エフェクト、サウンド）と UI の強化
