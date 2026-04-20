import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { NextFunction, Request, Response } from 'express';
import { IncomingHttpHeaders } from 'node:http';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const apiTarget = process.env['API_TARGET'] || 'http://localhost:3001';

const app = express();
const angularApp = new AngularNodeAppEngine();

function createProxyHeaders(headers: IncomingHttpHeaders): Record<string, string> {
  const proxyHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!value || key === 'host' || key === 'content-length') {
      continue;
    }
    proxyHeaders[key] = Array.isArray(value) ? value.join(',') : value;
  }
  return proxyHeaders;
}

function readRequestBody(req: Request): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return Promise.resolve(undefined);
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: unknown) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))));
    req.on('end', () => resolve(chunks.length ? Buffer.concat(chunks) : undefined));
    req.on('error', reject);
  });
}

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = await readRequestBody(req);
    const requestInit: RequestInit = {
      method: req.method,
      headers: createProxyHeaders(req.headers),
    };
    if (body) {
      requestInit.body = new Uint8Array(body);
    }
    const upstream = await fetch(`${apiTarget}${req.originalUrl}`, requestInit);

    upstream.headers.forEach((value, key) => {
      if (key === 'transfer-encoding' || key === 'connection') {
        return;
      }
      res.setHeader(key, value);
    });
    res.status(upstream.status);
    const responseBody = Buffer.from(await upstream.arrayBuffer());
    res.send(responseBody);
  } catch (error) {
    next(error);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  angularApp
    .handle(req)
    .then((response: globalThis.Response | null) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error?: Error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
