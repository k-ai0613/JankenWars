import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// レート制限のための簡易実装
const requestCounts = new Map<string, { count: number; resetTime: number }>();

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

// ユーザー名の検証
export function validateUsername(username: string): boolean {
  // 3-20文字、英数字とアンダースコアのみ
  const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;
  return usernamePattern.test(username);
}

// ゲームの移動の検証
export function validateGameMove(position: any, piece: any): boolean {
  // positionが適切な形式か確認
  if (!position || typeof position !== 'object') return false;
  if (typeof position.row !== 'number' || typeof position.col !== 'number') return false;
  if (position.row < 0 || position.row > 2 || position.col < 0 || position.col > 2) return false;
  
  // pieceが有効な値か確認
  const validPieces = ['ROCK', 'PAPER', 'SCISSORS'];
  if (!validPieces.includes(piece)) return false;
  
  return true;
}

// CSRFトークンの生成
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// CSRFトークンの検証
export function validateCSRFToken(req: Request, res: Response, next: NextFunction) {
  // WebSocketの場合はスキップ
  if (req.path.startsWith('/socket.io')) {
    return next();
  }
  
  // GETリクエストはスキップ
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || req.body?.csrfToken;
  const sessionToken = (req as any).session?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
}