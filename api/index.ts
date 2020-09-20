import { IncomingMessage, ServerResponse } from 'http';
import { parseRequest } from './_lib/parser';
import { getScreenshot } from './_lib/chromium';
import { getHtml } from './_lib/template';

const isDev = !process.env.AWS_REGION;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    try {
        if (req.url?.endsWith('favicon.ico')) {
            res.statusCode = 404;
            res.end();
            return;
        }

        const parsedReq = parseRequest(req);
        const html = await getHtml(parsedReq);

        if (parsedReq.html) {
            res.setHeader('Content-Type', 'text/html');
            res.end(html);
            return;
        }

        const file = await getScreenshot(html, isDev);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', `public, no-transform, s-maxage=${86400}, max-age=${86400}`);
        res.end(file);
    } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>Internal Error</h1><p>Sorry, there was a problem</p>');
        console.error(e);
    }
}
