import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';

/**
 * @param {string} recordUrl
 * @param {string} destPath
 * @param {{ redirectLeft?: number, extraHeaders?: Record<string, string> }} [options]
 */
export function downloadToFile(recordUrl, destPath, options = {}) {
    const redirectLeft = options.redirectLeft ?? 5;
    const extraHeaders = options.extraHeaders || {};
    return new Promise((resolve, reject) => {
        let urlObj;
        try {
            urlObj = new URL(recordUrl);
        } catch {
            reject(new Error('Invalid download URL'));
            return;
        }
        const lib = urlObj.protocol === 'https:' ? https : http;
        const headers = {
            'User-Agent': 'Vobiz-RTC-demo-recording-fetch/1.0',
            ...extraHeaders,
        };
        const req = lib.get(urlObj, { headers }, (response) => {
            const status = response.statusCode || 0;
            if ((status === 301 || status === 302 || status === 307 || status === 308) && response.headers.location) {
                response.resume();
                if (redirectLeft <= 0) {
                    reject(new Error('Too many redirects'));
                    return;
                }
                let nextUrl;
                try {
                    nextUrl = new URL(response.headers.location, urlObj).href;
                } catch {
                    reject(new Error('Invalid redirect location'));
                    return;
                }
                downloadToFile(nextUrl, destPath, { ...options, redirectLeft: redirectLeft - 1 })
                    .then(resolve)
                    .catch(reject);
                return;
            }
            if (status !== 200) {
                response.resume();
                reject(new Error(`Download failed: HTTP ${status}`));
                return;
            }
            const file = fs.createWriteStream(destPath);
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(destPath));
            });
            file.on('error', (err) => {
                file.close(() => {
                    fs.unlink(destPath, () => reject(err));
                });
            });
        });
        req.on('error', reject);
    });
}
