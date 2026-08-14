import { Request, Response, NextFunction } from 'express';

// レート制限のための簡易実装
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// 定期的に期限切れエントリを削除（メモリリーク防止）
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000);

export function rateLimiter(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    const clientData = requestCounts.get(clientIp);

    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(clientIp, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (clientData.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please try again later.'
      });
      return;
    }

    clientData.count++;
    next();
  };
}

// Socket.IO イベント用のレート制限（ソケット単位）
const socketEventCounts = new Map<string, { count: number; resetTime: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of socketEventCounts) {
    if (now > value.resetTime) {
      socketEventCounts.delete(key);
    }
  }
}, 60000);

export function checkSocketRateLimit(key: string, maxEvents: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now();
  const data = socketEventCounts.get(key);

  if (!data || now > data.resetTime) {
    socketEventCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (data.count >= maxEvents) {
    return false;
  }

  data.count++;
  return true;
}

// 入力サニタイゼーション
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // HTMLエンティティのエスケープ
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  
  return input;
}

// 入力検証ミドルウェア
export function validateInput(req: Request, res: Response, next: NextFunction) {
  // ペイロードサイズの検証
  if (JSON.stringify(req.body).length > 100000) { // 100KB制限
    return res.status(413).json({ error: 'Payload too large' });
  }
  
  // 基本的な入力サニタイゼーション
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
  
  next();
}

// ルームIDの検証
export function validateRoomId(roomId: string): boolean {
  // UUIDの最初の8文字の形式をチェック
  const roomIdPattern = /^[a-f0-9]{8}$/i;
  return roomIdPattern.test(roomId);
}

// ユーザー名の検証（日本語文字も許可）
export function validateUsername(username: string): boolean {
  // 1-20文字、英数字・アンダースコア・日本語文字を許可
  const usernamePattern = /^[\w\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u{20000}-\u{2A6DF}]{1,20}$/u;
  return usernamePattern.test(username);
}

// ゲームの移動の検証
export function validateGameMove(position: any, piece: any): boolean {
  // positionが適切な形式か確認
  if (!position || typeof position !== 'object') return false;
  if (typeof position.row !== 'number' || typeof position.col !== 'number') return false;
  if (!Number.isInteger(position.row) || !Number.isInteger(position.col)) return false;
  if (position.row < 0 || position.row >= 6 || position.col < 0 || position.col >= 6) return false;

  // pieceが有効な値か確認（文字列enum）
  const validPieces = ['ROCK', 'PAPER', 'SCISSORS', 'SPECIAL'];
  if (!validPieces.includes(piece)) return false;

  return true;
}
