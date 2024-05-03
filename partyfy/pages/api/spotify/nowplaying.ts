import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  name: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    let access_token = req.query.access_token as string;
    let response = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'GET',
        headers: {
            "Accept": "application/json",
            "Authorization": "Bearer " + access_token,
            "Content-Type": "application/json",
        }
    });
    try {
        if (response.statusText === 'No Content' || response.status === 204) {
            res.status(204).end();
            return;
        }
        let data = await response.json();
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json(error);
    }
}
