import fs from 'node:fs';
import fsp from 'node:fs/promises';

/**
 * @param {import('../config/index.js').AppConfig} config
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getSampleAudio(config, req, res) {
    try {
        const st = await fsp.stat(config.sampleMp3);
        res.status(200);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', String(st.size));
        res.setHeader('Cache-Control', 'public, max-age=3600');
        if (req.method === 'HEAD') {
            res.end();
            return;
        }
        fs.createReadStream(config.sampleMp3)
            .on('error', (err) => {
                console.error('[audio]', err);
                if (!res.writableEnded) res.destroy();
            })
            .pipe(res);
    } catch {
        res.status(404).type('text/plain').send('sample.mp3 not found');
    }
}
