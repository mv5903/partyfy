import Database from '@/database/db';
import type { NextApiRequest, NextApiResponse } from 'next'
import { config } from '../config'

type Data = {
  name: string
}

const database = new Database(config);

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (!database.initialized) {
      await database.connect();
    }
    if (req.method === 'GET') {
      if (req.query.schema == 'true') {
        let data = await database.getRecentsSchema() as any;
        res.status(200).json(data);
        return;
      }
      let data = await database.getRecentSongs(req.query.UserID as string) as any;
      res.status(200).json(data);
      return;
    }
    else if (req.method === 'POST') {
      let body = req.body;
      console.log('body', body);
      let data = await database.insertRecentSong(body.UserID as string, body.SongID as string, body.SongName as string, body.SongArtist as string, body.SongAlbum as string, body.SongArt as string, body.SongExplicit ? '1' : '0') as any;
      res.status(200).json(data);
      return;
    }
    else if (req.method === 'DELETE') {
      let body = req.body;
      let data = await database.deleteRecentSong(body.OwnerUserID as string) as any;
      res.status(200).json(data);
      return;
    }
    res.status(405).end();
}
