import { Request, Response, NextFunction } from 'express';
import { BOARD_SIZE } from '../shared/gameRules.js';
import { PieceType, isPieceType } from '../shared/gameTypes.js';

// ---------------------------------------------------------------------------
// Allowed origins
// ---------------------------------------------------------------------------

const DEFAULT_DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:5001', 'http://localhost:5000'];
const DEFAULT_PROD_ORIGINS = ['https://jankenwars.onrender.com'];

/**
 * Origins allowed to talk to this server, over HTTP and over Socket.IO alike.
 *
 * ALLOWED_ORIGINS (comma separated) overrides the defaults. It was documented
 * in .env.example and CLAUDE.md but never actually read.
 */
export function getAllowedOrigins(): string[] {
  const fromEnv = process.env.ALLOWED_ORIGINS;
  if (fromEnv) {
    const origins = fromEnv.split(',').map((o) => o.trim()).filter(Boolean);
    if (origins.length > 0) return origins;
  }
  return process.env.NODE_ENV === 'production' ? DEFAULT_PROD_ORIGINS : DEFAULT_DEV_ORIGINS;
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

// ---------------------------------------------------------------------------
// HTTP rate limiting
// ---------------------------------------------------------------------------

const requestCounts = new Map<string, { count: number; resetTime: number }>();

// 定期的に期限切れエントリを削除（メモリリーク防止）
const requestSweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000);
requestSweeper.unref();

export function rateLimiter(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    const clientData = requestCounts.get(clientIp);

    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (clientData.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please try again later.',
      });
      return;
    }

    clientData.count++;
    next();
  };
}

// ---------------------------------------------------------------------------
// Socket.IO rate limiting
// ---------------------------------------------------------------------------

interface SocketBucket {
  count: number;
  resetTime: number;
}

const socketBuckets = new Map<string, Map<string, SocketBucket>>();

const socketSweeper = setInterval(() => {
  const now = Date.now();
  for (const [socketId, buckets] of socketBuckets) {
    for (const [event, bucket] of buckets) {
      if (now > bucket.resetTime) buckets.delete(event);
    }
    if (buckets.size === 0) socketBuckets.delete(socketId);
  }
}, 60000);
socketSweeper.unref();

/**
 * Per-socket, per-event budget. Returns false once the socket is over it.
 *
 * The HTTP limiter only covers /api, so every Socket.IO event was previously
 * unmetered: 300 room:create calls from one socket all succeeded.
 */
export function allowSocketEvent(
  socketId: string,
  event: string,
  maxEvents: number,
  windowMs: number = 60000,
): boolean {
  const now = Date.now();
  let buckets = socketBuckets.get(socketId);
  if (!buckets) {
    buckets = new Map();
    socketBuckets.set(socketId, buckets);
  }

  const bucket = buckets.get(event);
  if (!bucket || now > bucket.resetTime) {
    buckets.set(event, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (bucket.count >= maxEvents) return false;

  bucket.count++;
  return true;
}

/** Drop a disconnected socket's buckets. */
export function releaseSocketLimits(socketId: string): void {
  socketBuckets.delete(socketId);
}

// ---------------------------------------------------------------------------
// Input sanitisation
// ---------------------------------------------------------------------------

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
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
    // Null prototype and an explicit key filter: assigning a "__proto__" key
    // onto a normal object literal mutates its prototype instead of adding a
    // property.
    const sanitized: Record<string, unknown> = Object.create(null);
    for (const key of Object.keys(input as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(key)) continue;
      sanitized[key] = sanitizeInput((input as Record<string, unknown>)[key]);
    }
    return sanitized;
  }

  return input;
}

export function validateInput(req: Request, res: Response, next: NextFunction) {
  // ペイロードサイズの検証（100KB制限）
  if (req.body !== undefined && JSON.stringify(req.body ?? null).length > 100000) {
    return res.status(413).json({ error: 'Payload too large' });
  }

  if (req.body) {
    req.body = sanitizeInput(req.body);
  }

  // req.query and req.params are getter-only in newer Express versions, so
  // they are sanitised at the point of use rather than reassigned here.

  next();
}

// ---------------------------------------------------------------------------
// Domain validation
// ---------------------------------------------------------------------------

/** Room IDs are the first 8 hex characters of a UUID. */
export function validateRoomId(roomId: unknown): roomId is string {
  return typeof roomId === 'string' && /^[a-f0-9]{8}$/i.test(roomId);
}

/** 1-20文字、英数字・アンダースコア・日本語文字を許可 */
export function validateUsername(username: unknown): username is string {
  if (typeof username !== 'string') return false;
  // \w + 全角スペース/句読点・ひらがな・カタカナ・漢字・拡張漢字
  const usernamePattern =
    /^[\w\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u{20000}-\u{2A6DF}]{1,20}$/u;
  return usernamePattern.test(username);
}

/** Pieces a player may actually place. EMPTY is not one of them. */
const PLACEABLE_PIECES: PieceType[] = [
  PieceType.ROCK,
  PieceType.PAPER,
  PieceType.SCISSORS,
  PieceType.SPECIAL,
];

export function validateGameMove(position: unknown, piece: unknown): boolean {
  if (!position || typeof position !== 'object' || Array.isArray(position)) return false;

  const { row, col } = position as { row: unknown; col: unknown };
  if (typeof row !== 'number' || typeof col !== 'number') return false;
  if (!Number.isInteger(row) || !Number.isInteger(col)) return false;
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return false;

  return isPieceType(piece) && PLACEABLE_PIECES.includes(piece);
}
