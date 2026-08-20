import { PieceType, Player } from '../shared/gameTypes.js';
import { createEmptyBoard, isValidMove, applyMove, findWinningLine, attackerWins, WIN_LENGTH, BOARD_SIZE } from '../shared/gameRules.js';

let pass=0, fail=0;
const t = (name: string, cond: boolean) => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); }
};

console.log(`BOARD_SIZE=${BOARD_SIZE} WIN_LENGTH=${WIN_LENGTH}`);

console.log('\n[じゃんけん判定]');
t('ROCK は SCISSORS に勝つ',    attackerWins(PieceType.ROCK, PieceType.SCISSORS));
t('SCISSORS は PAPER に勝つ',   attackerWins(PieceType.SCISSORS, PieceType.PAPER));
t('PAPER は ROCK に勝つ',       attackerWins(PieceType.PAPER, PieceType.ROCK));
t('PAPER は SCISSORS に負ける', !attackerWins(PieceType.PAPER, PieceType.SCISSORS));
t('同種は攻撃側の負け',          !attackerWins(PieceType.ROCK, PieceType.ROCK));

console.log('\n[isValidMove]');
let b = createEmptyBoard();
t('空セルに置ける', isValidMove(b, {row:0,col:0}, PieceType.ROCK, Player.PLAYER1));
b = applyMove(b, {row:0,col:0}, PieceType.SCISSORS, Player.PLAYER1).board;
t('自分の駒は奪えない',  !isValidMove(b, {row:0,col:0}, PieceType.ROCK, Player.PLAYER1));
t('負ける駒で奪えない',  !isValidMove(b, {row:0,col:0}, PieceType.PAPER, Player.PLAYER2));
t('勝つ駒で奪える',       isValidMove(b, {row:0,col:0}, PieceType.ROCK, Player.PLAYER2));
const cap = applyMove(b, {row:0,col:0}, PieceType.ROCK, Player.PLAYER2);
t('奪取でセルがロックされる', cap.board[0][0].hasBeenUsed === true);
t('奪取後は誰も置けない', !isValidMove(cap.board, {row:0,col:0}, PieceType.PAPER, Player.PLAYER1));
t('SPECIAL は空セル限定', !isValidMove(b, {row:0,col:0}, PieceType.SPECIAL, Player.PLAYER2));
const sb = applyMove(createEmptyBoard(), {row:1,col:1}, PieceType.SPECIAL, Player.PLAYER1).board;
t('SPECIAL は奪われない',  !isValidMove(sb, {row:1,col:1}, PieceType.ROCK, Player.PLAYER2));
t('盤外は不正', !isValidMove(b, {row:-1,col:0}, PieceType.ROCK, Player.PLAYER1));
t('盤外(下限超過)は不正', !isValidMove(b, {row:6,col:0}, PieceType.ROCK, Player.PLAYER1));

console.log('\n[findWinningLine]');
const line = (cells:[number,number][]) => {
  let bd = createEmptyBoard();
  for (const [r,c] of cells) bd = applyMove(bd, {row:r,col:c}, PieceType.ROCK, Player.PLAYER1).board;
  return bd;
};
t(`横 ${WIN_LENGTH} 連を検出`, !!findWinningLine(line([[0,0],[0,1],[0,2],[0,3]]), Player.PLAYER1));
t(`縦 ${WIN_LENGTH} 連を検出`, !!findWinningLine(line([[0,0],[1,0],[2,0],[3,0]]), Player.PLAYER1));
t('右下がり斜めを検出',        !!findWinningLine(line([[0,0],[1,1],[2,2],[3,3]]), Player.PLAYER1));
t('右上がり斜めを検出',        !!findWinningLine(line([[0,3],[1,2],[2,1],[3,0]]), Player.PLAYER1));
t('末端の横連も検出',          !!findWinningLine(line([[5,2],[5,3],[5,4],[5,5]]), Player.PLAYER1));
t(`${WIN_LENGTH-1} 連では勝利しない`, !findWinningLine(line([[0,0],[0,1],[0,2]]), Player.PLAYER1));
t('飛び石は勝利しない',        !findWinningLine(line([[0,0],[0,1],[0,3],[0,4]]), Player.PLAYER1));
t('相手の連は自分の勝利ではない', !findWinningLine(line([[0,0],[0,1],[0,2],[0,3]]), Player.PLAYER2));
const wl = findWinningLine(line([[2,1],[2,2],[2,3],[2,4]]), Player.PLAYER1);
t('勝利ラインの座標が正しい', JSON.stringify(wl?.positions) === JSON.stringify([{row:2,col:1},{row:2,col:2},{row:2,col:3},{row:2,col:4}]));

console.log(`\n===== 合格 ${pass} / 失敗 ${fail} =====`);
process.exit(fail?1:0);
