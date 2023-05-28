import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  name: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    let access_token = req.query.access_token as string;
    let response = await fetch('https://api.spotify.com/v1/search?type=track&limit=5&q=' + encodeURIComponent(req.query.query as string), {  
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
