import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { rateLimiter, validateInput } from "./security.js";

const app = express();

// セッション安定性のための設定
app.use(express.json({ limit: '100kb' })); // ペイロードサイズ制限を強化
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// レート制限と入力検証
app.use('/api', rateLimiter(100, 60000)); // 1分間に100リクエストまで
app.use(validateInput);

// Keep-Alive設定でコネクション安定化
app.set('trust proxy', 1);

// セキュリティヘッダーとCORS設定
app.use((req, res, next) => {
  // Keep-Alive設定
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=30, max=1000');
  
  // CORS設定 - 本番環境では特定のオリジンのみ許可
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://jankenwars.onrender.com'] 
    : ['http://localhost:5173', 'http://localhost:5000'];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // セキュリティヘッダー
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:;");
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // サーバーをポート5000で起動
  const port = 5000;
  
  // サーバー設定の改善
  server.timeout = 30000; // 30秒タイムアウト
  server.keepAliveTimeout = 31000; // Keep-Aliveタイムアウト
  server.headersTimeout = 32000; // ヘッダータイムアウト
  
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
  
  // サーバーの優雅な終了処理
  process.on('SIGTERM', () => {
    log('SIGTERM received, closing server gracefully');
    server.close(() => {
      log('Server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    log('SIGINT received, closing server gracefully');
    server.close(() => {
      log('Server closed');
      process.exit(0);
    });
  });
})();
