import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  name: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    let songid = req.query.SongID as string;
    let access_token = req.query.access_token as string;
    let response = await fetch('https://api.spotify.com/v1/tracks/' + songid, {  
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "Bearer " + access_token,
        }
    });
    let json = await response.json();
    res.status(200).json(json);
}
