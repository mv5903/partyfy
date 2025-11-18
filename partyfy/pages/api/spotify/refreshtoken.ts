import { winston } from '@/logs/winston';
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  name: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    let code = req.query.code as string;
    let redirect_uri = req.query.redirect_uri as string;

    if (!redirect_uri.endsWith("/")) {
        redirect_uri += "/";
    }

    if (!redirect_uri.endsWith('dashboard')) {
        redirect_uri += 'dashboard';
    }

    winston.info(`[Spotify Refresh Token] Received request to exchange code for tokens. Code: ${code}, Redirect URI: ${redirect_uri}`);

    if (!code || code === '') {
        res.status(400).json({name: "No code provided"});
        return;
    }

    if (!redirect_uri || redirect_uri === '') {
        res.status(400).json({name: "No redirect_uri provided"});
        return;
    }

    let authorization = 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64');
    let body = new URLSearchParams({
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri // URLSearchParams handles encoding automatically
    })
    await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": authorization
        },
        body
    })
    .then(response => response.json())
    .then((data: any) => {
        res.status(200).json(data);
    })
    .catch((error: any) => {
        res.status(500).json(error);
    });
}
