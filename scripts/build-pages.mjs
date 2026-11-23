import { mkdirSync, writeFileSync, cpSync, existsSync } from "fs";
import { resolve } from "path";

const projectRoot = process.cwd();
const outDir = resolve(projectRoot, "pages-dist");
mkdirSync(outDir, { recursive: true });

// 1. Copy OpenNext static assets if available
const openNextAssets = resolve(projectRoot, ".open-next", "assets");
if (existsSync(openNextAssets)) {
  console.log("Copying .open-next/assets to pages-dist...");
  cpSync(openNextAssets, outDir, { recursive: true, force: true });
}

// 2. Also ensure public files are present
const publicDir = resolve(projectRoot, "public");
if (existsSync(publicDir)) {
  console.log("Copying public files to pages-dist...");
  cpSync(publicDir, outDir, { recursive: true, force: true });
}

// 3. Generate Cloudflare Pages Advanced Mode _worker.js
const workerContent = `/**
 * CINOVA Cloudflare Pages Advanced Mode Edge Gateway
 * Serves static assets via env.ASSETS and proxies dynamic SSR/API routes
 * to the internal OpenNext Cloudflare Worker without exposing workers.dev
 */

const BACKEND_HOST = 'cinova.nishuminecraft01.workers.dev';
const PUBLIC_DOMAIN = 'cinova.pages.dev';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const clientHost = url.host || PUBLIC_DOMAIN;

    // 1. Attempt to serve static asset from Pages CDN cache
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      try {
        const assetResponse = await env.ASSETS.fetch(request);
        // Only return if it's a found static file (not a 404/405)
        if (assetResponse.status >= 200 && assetResponse.status < 400) {
          return assetResponse;
        }
      } catch (_) {
        // Fall through to backend proxy on error
      }
    }

    // 2. Prepare backend request to the OpenNext Cloudflare Worker
    const backendUrl = new URL(request.url);
    backendUrl.hostname = BACKEND_HOST;
    backendUrl.protocol = 'https:';
    backendUrl.port = '';

    // Clone headers and preserve identity
    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', BACKEND_HOST);
    newHeaders.set('X-Forwarded-Host', clientHost);
    newHeaders.set('X-Forwarded-Proto', 'https');
    newHeaders.set('X-Real-IP', request.headers.get('cf-connecting-ip') || '');

    const reqInit = {
      method: request.method,
      headers: newHeaders,
      redirect: 'manual', // Prevent automatic redirects so we can rewrite Location headers
    };

    // Forward request body for mutation requests (POST, PUT, DELETE, PATCH)
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      reqInit.body = request.body;
      reqInit.duplex = 'half';
    }

    try {
      const response = await fetch(backendUrl.toString(), reqInit);

      // Clone response headers
      const resHeaders = new Headers(response.headers);

      // CRITICAL: Rewrite any internal redirects so the browser NEVER navigates to workers.dev
      const location = resHeaders.get('Location');
      if (location) {
        try {
          const locUrl = new URL(location, request.url);
          if (locUrl.hostname === BACKEND_HOST) {
            locUrl.hostname = clientHost;
            locUrl.protocol = 'https:';
            locUrl.port = '';
            resHeaders.set('Location', locUrl.toString());
          }
        } catch (_) {
          // Keep original relative URL if parsing fails
        }
      }

      // Rewrite any Set-Cookie domain attributes mentioning workers.dev
      const setCookies = resHeaders.getSetCookie ? resHeaders.getSetCookie() : [resHeaders.get('Set-Cookie')].filter(Boolean);
      if (setCookies.length > 0) {
        resHeaders.delete('Set-Cookie');
        for (const cookie of setCookies) {
          const cleanedCookie = cookie.replaceAll(BACKEND_HOST, clientHost);
          resHeaders.append('Set-Cookie', cleanedCookie);
        }
      }

      // Ensure no CORS or Link header leaks
      const allowOrigin = resHeaders.get('Access-Control-Allow-Origin');
      if (allowOrigin && allowOrigin.includes(BACKEND_HOST)) {
        resHeaders.set('Access-Control-Allow-Origin', allowOrigin.replaceAll(BACKEND_HOST, clientHost));
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: resHeaders,
      });
    } catch (err) {
      // Safe, branded fallback error page without leaking infrastructure details
      return new Response(
        \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>CINOVA — Service Updating</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      background: #080506;
      color: #F5F1F3;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
      padding: 1.5rem;
    }
    h1 {
      font-size: 2.2rem;
      background: linear-gradient(135deg, #FF385B, #E11D48, #A30D32);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    p { color: #AAA0A7; max-width: 420px; line-height: 1.5; }
  </style>
</head>
<body>
  <div>
    <h1>CINOVA</h1>
    <p>Service is briefly updating. Please refresh in a few moments.</p>
  </div>
</body>
</html>\`,
        {
          status: 502,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }
  },

  async scheduled(event, env, ctx) {
    // Scheduled Cron Trigger Handler (Every 24 hours at 03:00 UTC)
    try {
      const cronSecret = (env && env.CRON_SECRET) || '';
      const headers = {
        'User-Agent': 'Cloudflare-Worker-Cron-Trigger/1.0',
      };
      if (cronSecret) {
        headers['Authorization'] = 'Bearer ' + cronSecret;
      }
      const cronUrl = 'https://' + BACKEND_HOST + '/api/cron/music-daily-discovery';
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(fetch(cronUrl, { headers }));
      } else {
        await fetch(cronUrl, { headers });
      }
    } catch (e) {
      console.error('[Cloudflare Cron] Scheduled music discovery invocation failed:', e);
    }
  },
};
`;

writeFileSync(resolve(outDir, "_worker.js"), workerContent, "utf-8");
console.log("pages-dist/_worker.js created successfully.");

// 4. Generate _routes.json to route all requests through _worker.js
const routesContent = JSON.stringify(
  {
    version: 1,
    include: ["/*"],
    exclude: [],
  },
  null,
  2
);

writeFileSync(resolve(outDir, "_routes.json"), routesContent, "utf-8");
console.log("pages-dist/_routes.json created successfully.");
console.log("pages-dist build completed successfully.");
