import { PieceType } from '../lib/types'

export interface JankenPiece {
  id: PieceType
  nameKey: string // 翻訳キー (例: 'pieces.rock')
  // icon?: string; // 必要であればアイコンのパスやコンポーネントなど
}

export const pieces: JankenPiece[] = [
  { id: PieceType.ROCK, nameKey: 'pieces.rock' },
  { id: PieceType.PAPER, nameKey: 'pieces.paper' },
  { id: PieceType.SCISSORS, nameKey: 'pieces.scissors' }
  // SPECIAL 駒は現状、直接選択するUIがなさそうなので一旦含めない
  // 必要に応じて追加してください
  // { id: PieceType.SPECIAL, nameKey: 'pieces.special' },
] 