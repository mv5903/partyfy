import Database from '@/database/db';
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  name: string
}

const database = new Database();

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    let access_token = req.query.access_token as string;
    let userId = req.query.user as string;
    let recentSongsIds = await database.getRecentSongs(userId);
    if (recentSongsIds.length == 0) {
        res.status(204).json({name: 'No recent songs found'});
    }
    recentSongsIds = recentSongsIds.map((song: any) => song.song_id);
    recentSongsIds = recentSongsIds.map((song: any) => song.split(':')[2]);
    let response = await fetch('https://api.spotify.com/v1/tracks?ids=' + recentSongsIds, {  
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
