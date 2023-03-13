import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  name: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    let access_token = req.query.access_token as string;
    await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        method: 'GET',
        headers: {
            "Accept": "application/json",
            "Authorization": "Bearer " + access_token,
            "Content-Type": "application/json",
        }
    })
    .then(response => {
        return response.json();
    })
    .then((data: any) => {
        res.status(200).json(data);
    })
    .catch((error: any) => {
        res.status(500).json(error);
    });
}
