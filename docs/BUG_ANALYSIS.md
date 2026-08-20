# JankenWars 既知バグの再発調査レポート

過去のコミット履歴から修正済みバグを分類し、**同じ原因パターンがコードベースの他の箇所に残っていないか**を全件調査した結果です。

- 調査対象: `main` ブランチ (`c58c083`) 時点の全 50 コミット / TypeScript 107 ファイル
- 検証方法: 静的解析に加え、**実際の `server/routes.ts` を起動した PoC で 6 件を実行確認**
- 調査日: 2026-08-20

---

## 1. 過去に修正されたバグの分類

| ID | バグの分類 | 代表コミット | 内容 |
|----|-----------|------------|------|
| **A** | 型定義のクライアント/サーバ不一致 | `ddda9a2` | サーバが数値 enum、クライアントが文字列 enum のまま運用されていた |
| **B** | 定数の重複定義とドリフト | `ddda9a2` `eb9f02e` | 盤面サイズが 7×7 / 6×6 / 3×3、初期駒数が 2 / 5 / 7 と箇所ごとに食い違っていた |
| **C** | Socket.IO イベント名の不一致 | `4e51335` | サーバが `error`、クライアントが `game:error` を待ち受けていた |
| **D** | ロジックの重複コピー | `ddda9a2` | ゲーム開始処理が 3 箇所にコピーされ、片方だけ修正される状態だった |
| **E** | メモリリーク | `ddda9a2` | レート制限用 `Map` が無制限に増え続けていた |
| **F** | 死んだ重複ファイル | `ddda9a2` | `useJankenGame.fixed.ts` / `selectCellForPlayer.ts` が残存していた |
| **G** | 状態同期の競合 | `4fda854` `5f0ac03` | `setTimeout` 遅延と楽観的更新が同期を壊していた |
| **H** | プレイヤー識別を配列 index で行う | `4c0591d` | `players[i]` の順序に依存し、P2 が P1 として表示されていた |
| **I** | 入力検証の範囲ずれ | `ddda9a2` | 3×3 盤面前提の座標検証が 6×6 盤面に残っていた |

**H（配列 index 依存）だけは完全に解消済み**で、現在は全箇所が `playerNumber` を参照しています。
それ以外の 8 分類は、いずれも別の場所に再発していました。

---

## 2. 深刻度別サマリ

| 深刻度 | 件数 | 内訳 |
|-------|-----|------|
| Critical | 2 | サーバのじゃんけん判定欠落 / 不正ペイロードによるサーバ全停止 |
| High | 7 | 状態検証の欠落、イベント不一致、未定義変数参照 ほか |
| Medium | 11 | 品質ゲートの不全、i18n 欠落、CORS、依存脆弱性 ほか |
| Low | 8 | デッドコード、ドキュメント齟齬 ほか |

`✅実証済` = 実際の `server/routes.ts` を起動して再現を確認した項目

---

## 3. Critical

### C-1. サーバがじゃんけんの勝敗を判定していない ✅実証済
**分類 A / I の再発** — `server/gameUtils.ts:31-71` (`isValidMove`)

クライアントの `isValidMove` は「攻撃側がじゃんけんに勝つ場合のみ」着手を許可します
(`client/src/lib/gameUtils.ts:362-366`)。
一方サーバ側の `isValidMove` にはじゃんけん判定が一切なく、相手の駒であれば無条件で奪取を許可します。
`server/routes.ts:511-520` も勝敗に関係なく常に攻撃側へセルを与えます。

```
# PoC 実行結果
P1が(0,0)にSCISSORSを配置 -> SCISSORS owner= PLAYER1
❌ P2はPAPERでSCISSORSに「負ける」はずが奪取成功
   -> (0,0) = PAPER owner= PLAYER2
```

改造クライアントから常に勝てる状態になります。サーバは権威ある検証者として機能していません。

**対策**: `client/src/lib/gameUtils.ts` の `determineWinner` をサーバへ移植し、
`isValidMove` と着手適用の双方で勝敗を判定する。理想的には共通ロジックを `shared/` に一元化する（分類 A/D の根本対策）。

---

### C-2. 不正ペイロードでサーバプロセスが全停止する ✅実証済
**分類 I の再発** — `server/routes.ts:439-440` + `server/index.ts:145-149`

```ts
socket.on("game:move", (data: {...}) => {
  const { roomId, position, piece } = data;   // data が undefined だと TypeError
```

`validateGameMove` は分割代入の**後**に呼ばれるため、`data` 自体の検証が存在しません。
Socket.IO のリスナー内で送出された例外は `uncaughtException` に到達し、
`server/index.ts:148` の `process.exit(1)` によって**プロセス全体が停止**します。
進行中の全ルーム・全対局が同時に消滅します。

```
# PoC 実行結果 — socket.emit('game:move') を引数なしで送信
❌ uncaughtException 発生 -> Cannot destructure property 'roomId' of 'data' as it is undefined.
```

認証も不要で、WebSocket に接続できる誰でも 1 行で実行できます。

**対策**:
1. 全ハンドラの先頭でペイロードの型を検証する（`data` が object か、`roomId` が string か）
2. 各ハンドラを try/catch で包む、または `io.engine` レベルで例外を捕捉する
3. `uncaughtException` で即 `process.exit(1)` する方針を見直す（ログ後に継続、あるいは graceful shutdown）

---

## 4. High

### H-1. GAME_OVER 後もサーバが着手を受理する ✅実証済
`server/routes.ts:462-465`

サーバは `room.inProgress` と `room.gameState` の存在しか確認せず、
`gameState.gamePhase` / `gameResult` を検証しません。
勝利時は `currentPlayer` が切り替わらない（`routes.ts:522-536` の else 節に入らない）ため、
**勝者だけが終局後も無制限に駒を置き続けられます**。

```
# PoC 実行結果
P1 -> (0,3) 受理=true phase=GAME_OVER result=PLAYER1_WIN
勝者P1が終了後に (1,0) へ着手 -> 受理=true   ❌ 盤面が更新された
敗者P2が終了後に (1,1) へ着手 -> 受理=false  ("Not your turn")
```

**対策**: `gamePhase === GAME_OVER` または `gameResult !== ONGOING` の場合に `game:move` を拒否する。

---

### H-2. 対局中に `game:request_rematch` で盤面をリセットできる ✅実証済
`server/routes.ts:561-610`

`game:request_rematch` はルーム所属チェックのみで、`gamePhase` を検証しません。
不利な側がいつでも盤面を白紙に戻せます。

```
# PoC 実行結果
リセット前 board[0][0]= ROCK
❌ 対局中(GAME_OVER前)にも関わらず盤面リセット成功
   board[0][0]= EMPTY  gamePhase= READY
```

クライアントは `gamePhase === GAME_OVER` のときだけ送信するため（`useOnlineGame.ts:942-953`）
通常操作では起きませんが、サーバ側の認可欠落であり改造クライアントで悪用可能です。

**対策**: 終局後、かつ両者の合意がある場合のみリセットを許可する。

---

### H-3. マッチメイキングの重複登録で自分自身とマッチする ✅実証済
`server/routes.ts:657-720`

`matchmaking:join` は同一ソケットの重複登録を弾きません。2 回送ると 1 人でマッチが成立します。

```
# PoC 実行結果
❌ 1人でマッチ成立. players = solo(P1), solo(P2)
   ユニークなsocketId数 = 1 -> 同一ソケットが P1 と P2 を兼任
```

さらにルーム生成時 `players` はソケット ID をキーにするため（`routes.ts:676-687`）
**キー衝突で 1 エントリに潰れ**、プレイヤー 1 人・`playerNumber: 2` という壊れたルームが残ります。
待機列にいた実プレイヤーも巻き込まれます。

**対策**: `waitingUsers.some(u => u.socketId === socket.id)` で重複を弾き、
マッチ成立時に `player1.socketId !== player2.socketId` を確認する。

---

### H-4. `game:force:end` を待ち受けるクライアントが存在しない
**分類 C の再発** — `server/routes.ts:649`

サーバは対局中の退出時に `game:force:end` を送信しますが、
`client/src/lib/socketService.ts` にリスナーが登録されていません。イベントは捨てられます。

逆方向の不一致も 1 件あります。`socketService.ts:289-296` の `sendGameResult()` は
`game:result` を送信しますが、**サーバにハンドラが存在しません**。

| イベント | サーバ | クライアント | 状態 |
|---------|-------|------------|------|
| `game:force:end` | 送信する | 待ち受けない | ❌ 破棄される |
| `game:result` | ハンドラ無し | 送信する | ❌ 破棄される |
| `game:move` (下り) | 送信しない | 待ち受ける | ⚠️ 死んだリスナー |
| `error` | 送信しない | 待ち受ける | ⚠️ `4e51335` の名残 |

`4e51335` で `error` → `game:error` を修正した際と**まったく同じ構造の不一致**です。

**対策**: イベント名を型付き定数（`shared/events.ts` など）に集約し、双方から参照する。

---

### H-5. 対局中の切断でルームが永久に「対局中」のまま残る ✅実証済
`server/routes.ts:727-762`

`room:leave`（`routes.ts:645-650`）は `inProgress = false` に戻し `game:force:end` を送りますが、
`disconnect` ハンドラは**同じ処理を持ちません**。`player:left` を送るだけです。

```
# PoC 実行結果
空きが1枠あるルームへの新規参加結果 -> room:joined:spectator (観戦者扱い)
```

1 人が切断したルームは `inProgress: true` のまま残り、新規参加者は全員観戦者扱いになります。
30 分の非アクティブタイムアウトまでルームは復帰しません。

**分類 D（ロジックの重複コピー）の再発**です。`room:leave` と `disconnect` に
同じ退出処理が別々に書かれ、片方だけが更新されています。

**対策**: 退出処理を単一の関数に切り出し、両ハンドラから呼び出す。

---

### H-6. 未定義変数 `socketId` の参照で開発サーバがクラッシュする
`client/src/pages/OnlineGamePage.tsx:534, 766, 791`

```tsx
socketId: players.length > 0 ? socketId : 'no socketId',   // 534行
socketId,                                                   // 766, 791行
```

`socketId` はどこにも宣言されていません（ストアには存在しますが、このコンポーネントは選択していません）。
ES モジュールは常に strict モードのため `ReferenceError: socketId is not defined` になります。
3 箇所とも描画パス内にあり、ルーム画面と対局画面の両方が落ちます。

**本番影響はありません** — `vite.config.ts:37` の `drop_console: true` により
production ビルドでは `console.log` ごと削除されます（ビルド成果物に該当文字列が無いことを確認済み）。
ただし `npm run dev` ではオンライン画面が使えず、`drop_console` を外した瞬間に本番が壊れます。

**対策**: `const socketId = useOnlineGame(state => state.socketId);` を追加する。

---

### H-7. 依存パッケージに未修正の脆弱性が 48 件
`package.json` / `package-lock.json`

```
npm audit: critical 2 / high 25 / moderate 20 / low 1
```

本番サーバに直接影響するもの:

| パッケージ | 深刻度 | 内容 |
|-----------|-------|------|
| `engine.io` | High | Polling Transport Connection Exhaustion |
| `socket.io-parser` | High | 無制限のバイナリ添付 / Zero-attachment Memory Exhaustion |
| `express` `body-parser` `qs` | Moderate | サイズ制限の無効化、DoS |
| `path-to-regexp` | High | ReDoS |
| `react-router-dom` | Moderate | オープンリダイレクト経由の XSS |

`SECURITY.md:69-72` は「即座に実行すべきコマンド」として `npm audit fix` を挙げていますが、
**一度も実行されていません**。`engine.io` / `socket.io-parser` の 2 件は C-2 と組み合わさると
サーバの可用性リスクをさらに高めます。

---

## 5. Medium

### M-1. クライアント約 1 万行が一度も型チェックされていない（分類 A の根本原因）
`tsconfig.json:1-3`

```json
"include": ["server/**/*", "shared/**/*"],
"exclude": ["node_modules", "build", "**/*.test.ts", "client/**/*"]
```

`npm run check` (`tsc`) は **`client/` を完全に除外**しています。
`npm run build` の `vite build` も esbuild による型削除のみで検査しません。
つまりクライアント側には型検査が存在しません。

これが**分類 A（型定義の不一致）が発生し、長期間気づかれなかった根本原因**です。
`ddda9a2` は症状（enum の値）を直しましたが、検出できない状態は放置されています。

実際に一時的なクライアント用 tsconfig で検査したところ **17 件のエラー**が埋もれていました。
H-6 の `socketId` と後述の M-2 はこれで検出されたものです。

**対策**: `tsconfig.client.json` を追加し、`npm run check` で server と client の両方を検査する。
`client/src/vite-env.d.ts`（`/// <reference types="vite/client" />`）も併せて追加が必要です。

---

### M-2. `npm run lint` が実行不能
`package.json:18`

```
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
```

`eslint` は `devDependencies` に存在せず、設定ファイルもありません。
`CLAUDE.md` には開発コマンドとして記載されています。
M-1 と併せて、**品質ゲートが 2 つとも機能していません**。

---

### M-3. i18n キーの大量欠落でオンライン UI がほぼ全滅
`client/src/lib/stores/useLanguage.tsx:514-521`

`t()` は未定義キーに対して**キー文字列そのものを返します**。

- `t()` 呼び出しのうち **41 キーが未定義** — うち 39 が `online.*`
- state に格納される **`message.*` が 18 キー未定義**

オンライン対戦の状態表示はほぼ全てが `online.waitingForOpponent` のような
生キー文字列として画面に出ます。`online.youWin` `online.opponentLeft` `online.invalidMove` など、
対局の主要なフィードバックが全滅しています。

**対策**: 欠落キーを補完し、`t()` のフォールバックを開発時は警告ログ付きにする。

---

### M-4. 動的生成されるキーの大文字小文字が定義と一致しない
`client/src/lib/stores/useJankenGame.ts:688, 871`

```ts
message: `message.${normalizePlayer(currentPlayer)}Win`,   // -> "message.PLAYER1Win"
const nextMessage = `message.${normalizePlayer(nextPlayer)}Turn`; // -> "message.PLAYER1Turn"
```

`normalizePlayer` は `PLAYER1` を返しますが、定義されているキーは `message.player1Win` / `message.player1Turn` です。
ローカル対戦の勝敗表示とターン表示が常に生キーになります。

---

### M-5. 勝利条件が実装 4 連・ドキュメント 5 連で食い違う
**分類 B の再発**

| 場所 | 記載 |
|------|-----|
| `server/gameUtils.ts:4` | `WIN_LENGTH = 4` |
| `client/src/lib/gameUtils.ts:154` | 4 連でループ |
| `client/src/lib/stores/useLanguage.tsx:20, 45` | 「5つ並べて勝利」 |
| `client/src/pages/HowToPlay.tsx:48, 281, 286` | 「5つ並べたプレイヤーが勝利」 |
| `CLAUDE.md` | 「Win by aligning 5 pieces in a row」 |

実装同士は一致していますが、**プレイヤーに説明しているルールが誤っています**。
定数がクライアント・サーバ・ドキュメントの 3 箇所に分散している構造は `ddda9a2` 以前と同じです。

**対策**: `WIN_LENGTH` を `shared/` に一元化し、UI 文言も同じ値から生成する。

---

### M-6. Socket.IO の CORS が全オリジン許可
`server/routes.ts:188-193`

```ts
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
```

`server/index.ts:26-33` の Express 側は本番オリジンを限定していますが、
**ゲーム機能はすべて Socket.IO 経由**のため実質的に無効化されています。
`SECURITY.md:3-8` は「変更後: 本番環境では特定のオリジンのみ許可」と記載しており、実態と乖離しています。

---

### M-7. Socket.IO イベントにレート制限が一切ない ✅実証済
`server/routes.ts:11` / `server/index.ts:13`

`rateLimiter` は `routes.ts` で **import されているだけで使われていません**。
`app.use('/api', ...)` は REST エンドポイントのみが対象です。

```
# PoC 実行結果
1ソケットから300回 room:create -> 作成成功 300 件
```

ルーム作成にソケットあたりの上限がなく、無制限にメモリを消費させられます。
生成されたルームは作成者が在室し続ける限り 30 分間保持されます。

**対策**: ソケットあたりのイベント頻度制限と、同時保持ルーム数の上限を設ける。

---

### M-8. `useAudio.ts` と `useAudio.tsx` が併存し API が非互換
**分類 F の再発** — `client/src/lib/stores/useAudio.ts` / `.tsx`

同じ import 指定子 `./useAudio` に対して 2 つの異なるストアが存在します。

| ファイル | 公開 API |
|---------|---------|
| `useAudio.ts` | `muted`, `toggleMute`, `playBattle`, `playPlace`, … |
| `useAudio.tsx` | `isMuted`, `backgroundMusic`, `setHitSound`, … |

解決順序で `.ts` が勝つため `.tsx` は死んだファイルですが、
`client/src/components/ui/interface.tsx:12` は `.tsx` 側の API (`isMuted`) を使っています。
解決順序が変われば即座に壊れます。`ddda9a2` が削除した
`useJankenGame.fixed.ts` / `selectCellForPlayer.ts` と同じ構造です。

同様に **`client/src/locales/ja.json` / `en.json` はどこからも import されていません**。
翻訳が 2 系統に分裂した状態です。

---

### M-9. 未使用のセキュリティ実装
`server/security.ts:127-150`

`generateCSRFToken` / `validateCSRFToken` は**どこからも呼ばれていません**。
`express-session` は依存に含まれますが、セッションミドルウェアは登録されていないため
`validateCSRFToken` は仮に登録しても常に 403 を返す状態です。

同様に `CLAUDE.md:85` と `.env.example:13` が案内する `ALLOWED_ORIGINS` 環境変数は
コード中で一度も読まれておらず、許可オリジンは `server/index.ts:27-28` にハードコードされています。

---

### M-10. ローカル対戦に `setTimeout` 連鎖が残存
**分類 G の再発** — `client/src/lib/stores/useJankenGame.ts:672-712`

`placePiece` は駒を置いた後、勝敗判定を 100ms 後、ターン切り替えをさらに 200ms 後の
`setTimeout` で実行します。`4fda854` は「同期を壊す `setTimeout` 遅延」を
`useOnlineGame.ts` から削除しましたが、**ローカル対戦側は手つかず**です。

この 300ms の間 `phase` は `SELECTING_CELL` のままで、勝敗が確定していない中間状態が露出します。

---

### M-11. 静的配信で全ドットファイルが公開される
`server/vite.ts:143`

```ts
app.use(express.static(staticPath, { dotfiles: 'allow', … }));
```

`9fd8111` が `.well-known/assetlinks.json` の配信のために追加した設定ですが、
`dist/public` 配下の**あらゆるドットファイル**が公開対象になります。
現状 `client/public` には `.well-known` しか無いため実害はありませんが、
ビルド出力に `.env` などが混入した瞬間に露出します。

**対策**: `dotfiles: 'allow'` をやめ、`.well-known` のみ個別ルートで配信する。

---

## 6. Low

| ID | 内容 | 場所 |
|----|-----|------|
| L-1 | `CLAUDE.md` の型定義記述が旧仕様（数値 enum・小文字 GamePhase）のまま。**分類 A の再発を誘発する** | `CLAUDE.md` 「Shared Types」節 |
| L-2 | `jankenBattleCells` は `CLAUDE.md` に「主要パターン」として記載されているが、初期化されるだけで読み書きされないデッド状態。実際のロックは `hasBeenUsed` | `useJankenGame.ts:41, 193, 329` |
| L-3 | `CLAUDE.md` は「Zustand with persistence」と記載するが、`persist` はコメントアウト済み | `useJankenGame.ts:922-946` |
| L-4 | オンライン対戦の引き分け判定が**減算前**のインベントリを使用。サーバは減算後で判定するため 1 手ずれる | `useOnlineGame.ts:922` |
| L-5 | `selectSpecialPiece` はストアに存在しない。特殊駒ボタンの `onClick` が `undefined`（当該コンポーネントは未使用） | `SpecialPieceButton.tsx:15, 35` |
| L-6 | i18n を迂回したハードコード日本語文字列 | `useJankenGame.ts:532, 582` |
| L-7 | AdSense クライアント ID がハードコードと環境変数の二重管理。`CookieConsent` は固定値、`AdBanner` は `VITE_ADSENSE_CLIENT` を参照 | `CookieConsent.tsx:21` / `AdBanner.tsx:28` |
| L-8 | エラーハンドラがレスポンス送信後に `throw err` しており、二重にエラー処理が走る | `server/index.ts:83-89` |

---

## 7. 再発を止めるための優先順位

現状のバグの多くは**個別のミスではなく、検出機構が無いこと**に起因しています。

### 第 1 優先 — 即時対応
1. **C-2**（サーバ全停止）: 全 Socket.IO ハンドラのペイロード検証と例外捕捉
2. **C-1**（じゃんけん判定）: サーバへの勝敗判定の実装
3. **H-1 / H-2 / H-3 / H-5**: サーバ側の状態・認可検証の追加

### 第 2 優先 — 再発防止の土台
4. **M-1**: `client/` を型チェック対象に含める（分類 A の再発を構造的に防ぐ）
5. **M-2**: ESLint の導入
6. **H-4**: Socket.IO イベント名の型付き定数化（分類 C の再発を構造的に防ぐ）
7. **共通ロジックの `shared/` への集約**: `determineWinner` / `isValidMove` / `BOARD_SIZE` / `WIN_LENGTH` / 初期インベントリ（分類 A・B・D の根本対策）

### 第 3 優先
8. **H-7**: `npm audit fix` の実行
9. **M-3 / M-4 / M-5**: i18n の補完と勝利条件の記述統一
10. **M-6 / M-7**: Socket.IO の CORS 制限とレート制限
11. **M-8**: 重複ファイルの削除
12. **L-1 / L-2 / L-3**: `CLAUDE.md` の実装との同期

---

## 付録: PoC の実行方法

検証は `server/routes.ts` の `registerRoutes` を直接 Express に登録し、
`socket.io-client` で実クライアントとして接続する方式で行いました。
再現用スクリプトは本レポートには含めていません（必要であれば再作成可能です）。

確認済みの項目: C-1 / C-2 / H-1 / H-2 / H-3 / H-5 / M-7
