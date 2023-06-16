import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  name: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    let code = req.query.code as string;
    if (!code || code === '') {
        res.status(400).json({name: "No code provided"});
        return;
    }
    let authorization = 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64');
    await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": authorization
        },
        body: new URLSearchParams({
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': process.env.SPOTIFY_REDIRECT_URL as string
        })
    })
    .then(response => response.json())
    .then((data: any) => {
        res.status(200).json(data);
    })
    .catch((error: any) => {
        res.status(500).json(error);
    });
}
