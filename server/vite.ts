import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config.js";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  try {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
      allowedHosts: true as true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
          console.error('Vite server error:', msg);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

        if (!fs.existsSync(clientTemplate)) {
          throw new Error(`Template file not found: ${clientTemplate}`);
        }

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
        console.error("Vite HTML transform error:", e);
      next(e);
    }
  });
  } catch (error) {
    console.error("Failed to setup Vite:", error);
    serveStatic(app);
  }
}

export function serveStatic(app: Express) {
  // Try multiple possible paths for static files
  const possiblePaths = [
    // Production build paths (built by vite build)
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(__dirname, "..", "dist", "public"),
    // If running from server/ directory in src/ (Render's structure)
    path.resolve(__dirname, "..", "..", "dist", "public"),
    // Development fallback paths
    path.resolve(process.cwd(), "client", "public"),
    path.resolve(__dirname, "..", "client", "public")
  ];

  let staticPath;
  let foundPath = false;
  
  for (const checkPath of possiblePaths) {
    log(`Checking for static files at: ${checkPath}`);
    if (fs.existsSync(checkPath)) {
      // Check if index.html exists in this path
      const indexPath = path.join(checkPath, "index.html");
      if (fs.existsSync(indexPath)) {
        staticPath = checkPath;
        foundPath = true;
        log(`Found static files with index.html at: ${staticPath}`);
        break;
      } else {
        log(`Path exists but no index.html found at: ${indexPath}`);
      }
    }
  }
  
  if (!foundPath) {
    const error = new Error(
      `Could not find static files with index.html. Checked paths:\n${possiblePaths.join('\n')}`
    );
    console.error(error);
    throw error;
  }

  app.use((req, res, next) => {
    const url = req.url;
    if (url.endsWith('.js')) {
      res.type('application/javascript');
    } else if (url.endsWith('.css')) {
      res.type('text/css');
    } else if (url.endsWith('.json')) {
      res.type('application/json');
    } else if (url.endsWith('.png')) {
      res.type('image/png');
    } else if (url.endsWith('.jpg') || url.endsWith('.jpeg')) {
      res.type('image/jpeg');
    } else if (url.endsWith('.svg')) {
      res.type('image/svg+xml');
    } else if (url.endsWith('.ico')) {
      res.type('image/x-icon');
    }
    next();
  });

  app.use(express.static(staticPath, {
    dotfiles: 'allow',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      }
    }
  }));

  app.use("*", (req, res) => {
    try {
      res.sendFile(path.resolve(staticPath, "index.html"));
    } catch (error) {
      console.error("Error serving index.html:", error);
      res.status(500).send("Internal Server Error: Could not serve the application");
    }
  });
}
