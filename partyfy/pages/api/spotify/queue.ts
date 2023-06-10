import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  name: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method === 'GET') {
        let access_token = req.query.access_token as string;
        let response = await fetch('https://api.spotify.com/v1/me/player/queue', {  
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": "Bearer " + access_token,
            }
        });
        if (!response.ok) {
            res.status(response.status).json({name: response.statusText});
            return;
        }
        let json = await response.json();
        res.status(200).json(json);
        return;
    }
    if (req.method === 'POST') {
        let response = await fetch('https://api.spotify.com/v1/me/player/queue?uri=' + encodeURIComponent(req.body.uri as string), {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": "Bearer " + req.body.access_token as string,
            }
        });
        if (response.ok) {
            res.status(200).json({name: 'OK'});
            return;
        } else {
            res.status(response.status).json({name: response.statusText});
            return;
        }
    }
}
