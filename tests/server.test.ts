import express from 'express';
import { registerRoutes } from '../server/routes.js';
import { io as ioc, Socket } from 'socket.io-client';
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const ok  = (m: string) => { pass++; console.log(`  ✅ ${m}`); };
const bad = (m: string) => { fail++; console.log(`  ❌ ${m}`); };

// 常設リスナーで最新状態を保持し、once の取りこぼし・競合を排除する
interface Client { s: Socket; updates: number; state: any; errors: string[]; }
const clients: Client[] = [];

async function main() {
  const app = express();
  const server = await registerRoutes(app);
  await new Promise<void>(r => server.listen(4400, '127.0.0.1', () => r()));
  const URL = 'http://127.0.0.1:4400';

  const mk = async (n: string): Promise<Client> => {
    const s: Socket = ioc(URL, { transports: ['websocket'] });
    await new Promise<void>(r => s.on('connect', () => r()));
    const c: Client = { s, updates: 0, state: null, errors: [] };
    s.on('game:state:update', (d: any) => { c.updates++; c.state = d.gameState; });
    s.on('game:start',        (d: any) => { c.state = d.gameState; });
    s.on('game:error',        (e: any) => { c.errors.push(e.message); });
    clients.push(c);
    s.emit('user:join', n); await wait(40);
    return c;
  };

  const room = async (a: Client, b: Client) => {
    const id: string = await new Promise(r => { a.s.once('room:created', (d: any) => r(d.roomId)); a.s.emit('room:create'); });
    await new Promise<void>(r => { b.s.once('room:joined', () => r()); b.s.emit('room:join', id); });
    await new Promise<void>(r => { a.s.once('game:start', () => r()); a.s.emit('player:ready', id); b.s.emit('player:ready', id); });
    return id;
  };

  // 着手し、盤面更新かエラーのどちらが来たかを返す
  const move = async (c: Client, id: string, row: number, col: number, piece: string) => {
    const u0 = c.updates, e0 = c.errors.length;
    c.s.emit('game:move', { roomId: id, position: { row, col }, piece });
    for (let i = 0; i < 40; i++) {
      if (c.updates > u0) return { applied: true,  state: c.state, error: null as string | null };
      if (c.errors.length > e0) return { applied: false, state: c.state, error: c.errors[c.errors.length - 1] };
      await wait(25);
    }
    return { applied: false, state: c.state, error: null };
  };

  console.log('\n[C-1] サーバがじゃんけんの勝敗を判定する');
  {
    const a = await mk('a1'), b = await mk('b1');
    const id = await room(a, b);
    await move(a, id, 0, 0, 'SCISSORS');
    const lose = await move(b, id, 0, 0, 'PAPER');   // パーはチョキに負ける
    if (!lose.applied && lose.error) ok(`負ける駒での奪取を拒否 ("${lose.error}")`); else bad('負ける駒で奪取できてしまう');
    const win = await move(b, id, 0, 0, 'ROCK');     // グーはチョキに勝つ
    if (win.applied && win.state.board[0][0].owner === 'PLAYER2' && win.state.board[0][0].hasBeenUsed) ok('勝つ駒での奪取は成功し、セルがロックされる'); else bad('勝つ駒での奪取が失敗した');
    a.s.close(); b.s.close();
  }

  console.log('\n[C-2] 不正ペイロードでサーバが停止しない');
  {
    const a = await mk('a2');
    let died = false;
    process.once('uncaughtException', () => { died = true; });
    for (const p of [undefined, null, 'x', 42, [], { roomId: 1 }, { roomId: '00000000' }, { roomId: '00000000', position: 'x', piece: 1 }]) {
      a.s.emit('game:move', p as any);
    }
    a.s.emit('player:ready', null as any); a.s.emit('room:join', { evil: 1 } as any);
    a.s.emit('user:join', null as any);    a.s.emit('game:request_rematch', [] as any);
    a.s.emit('room:leave', 999 as any);
    await wait(500);
    const alive = await new Promise<boolean>(r => {
      const p: Socket = ioc(URL, { transports: ['websocket'] });
      const to = setTimeout(() => r(false), 900);
      p.on('connect', () => { clearTimeout(to); p.close(); r(true); });
    });
    if (!died && alive) ok('12種の不正ペイロード後もサーバは応答している'); else bad(`サーバが停止した (died=${died}, alive=${alive})`);
    a.s.close();
  }

  console.log('\n[H-1] 終局後の着手を拒否する');
  {
    const a = await mk('a3'), b = await mk('b3');
    const id = await room(a, b);
    const seq: [Client, number, number][] = [[a,0,0],[b,5,0],[a,0,1],[b,5,1],[a,0,2],[b,5,2],[a,0,3]];
    let last: any = null;
    for (const [c, r0, c0] of seq) last = await move(c, id, r0, c0, 'ROCK');
    if (last.state?.gameResult === 'PLAYER1_WIN') ok('4連で勝利判定'); else bad('勝利判定されない: ' + last.state?.gameResult);
    const after = await move(a, id, 1, 0, 'ROCK');
    if (!after.applied && after.error) ok(`勝者の追加着手を拒否 ("${after.error}")`); else bad('終局後も着手できてしまう');
    a.s.close(); b.s.close();
  }

  console.log('\n[H-2] 対局中の再戦要求を拒否する');
  {
    const a = await mk('a4'), b = await mk('b4');
    const id = await room(a, b);
    await move(a, id, 2, 2, 'ROCK');
    const e0 = b.errors.length;
    let reset = false;
    b.s.once('game:rematch:initiated', () => { reset = true; });
    b.s.emit('game:request_rematch', id);
    await wait(500);
    if (!reset && b.errors.length > e0) ok(`対局中のリセットを拒否 ("${b.errors[b.errors.length-1]}")`); else bad('対局中に盤面をリセットできてしまう');
    a.s.close(); b.s.close();
  }

  console.log('\n[H-2b] 終局後の再戦要求は許可する');
  {
    const a = await mk('a6'), b = await mk('b6');
    const id = await room(a, b);
    const seq: [Client, number, number][] = [[a,0,0],[b,5,0],[a,0,1],[b,5,1],[a,0,2],[b,5,2],[a,0,3]];
    for (const [c, r0, c0] of seq) await move(c, id, r0, c0, 'ROCK');
    const reset: any = await new Promise(r => {
      const to = setTimeout(() => r(null), 800);
      b.s.once('game:rematch:initiated', (d: any) => { clearTimeout(to); r(d); });
      b.s.emit('game:request_rematch', id);
    });
    if (reset && reset.gameState.board[0][0].piece === 'EMPTY') ok('終局後は盤面をリセットできる'); else bad('終局後にリセットできない');
    a.s.close(); b.s.close();
  }

  console.log('\n[H-3] 自分自身とマッチしない');
  {
    const solo = await mk('solo');
    const matched: any = await new Promise(async r => {
      solo.s.once('matchmaking:matched', (d: any) => r(d));
      solo.s.emit('matchmaking:join'); await wait(80); solo.s.emit('matchmaking:join');
      setTimeout(() => r(null), 800);
    });
    if (matched) bad('1人でマッチが成立した'); else ok('重複登録しても単独ではマッチしない');
    // 2人目が来たら正常にマッチすること
    const other = await mk('other');
    const m2: any = await new Promise(r => {
      const to = setTimeout(() => r(null), 900);
      other.s.once('matchmaking:matched', (d: any) => { clearTimeout(to); r(d); });
      other.s.emit('matchmaking:join');
    });
    if (m2 && new Set(m2.players.map((p: any) => p.id)).size === 2) ok('2人揃えば正常にマッチする'); else bad('2人でもマッチしない');
    solo.s.close(); other.s.close();
  }

  console.log('\n[H-5] 切断で game:force:end が飛び、ルームが再利用できる');
  {
    const a = await mk('a5'), b = await mk('b5');
    const id = await room(a, b);
    const forced = new Promise<boolean>(r => { const to = setTimeout(() => r(false), 900); a.s.once('game:force:end', () => { clearTimeout(to); r(true); }); });
    b.s.close();
    if (await forced) ok('game:force:end が送信された'); else bad('game:force:end が送信されない');
    await wait(200);
    const c = await mk('eve');
    const kind: string = await new Promise(r => {
      c.s.once('room:joined', () => r('player'));
      c.s.once('room:joined:spectator', () => r('spectator'));
      c.s.emit('room:join', id); setTimeout(() => r('none'), 900);
    });
    if (kind === 'player') ok('空き枠に新規プレイヤーとして参加できる'); else bad(`参加結果が ${kind}`);
    a.s.close(); c.s.close();
  }

  console.log('\n[M-7] room:create のレート制限');
  {
    const s = await mk('spam');
    let created = 0;
    s.s.on('room:created', () => created++);
    for (let i = 0; i < 100; i++) s.s.emit('room:create');
    await wait(1000);
    if (created <= 10 && s.errors.length > 0) ok(`100回の room:create のうち ${created} 件のみ成功 (拒否 ${s.errors.length} 件)`); else bad(`制限が効いていない: 成功 ${created} 件`);
    s.s.close();
  }

  console.log(`\n===== 合格 ${pass} / 失敗 ${fail} =====`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
