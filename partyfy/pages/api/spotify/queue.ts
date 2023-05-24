import Database from '@/database/db';
import type { NextApiRequest, NextApiResponse } from 'next'
import { config } from '../config'

type Data = {
  name: string
}

const database = new Database();

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    let access_token = req.query.access_token as string;
    let response = await fetch('https://api.spotify.com/v1/me/player/queue', {  
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
