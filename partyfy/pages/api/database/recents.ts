import Database from '@/database/db';
import { winston } from '@/logs/winston';
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  name: string
}

const database = new Database();

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method === 'GET') {
      let data = await database.getRecentSongs(req.query.UserID as string) as any;
      res.status(200).json(data);
      return;
    }
    else if (req.method === 'POST') {
      let body = req.body;
      let data = await database.insertRecentSong(body.UserID as string, body.SongID as string, body.SongName as string, body.SongArtist as string, body.SongAlbum as string, body.SongArt as string, body.SongExplicit) as any;
      res.status(200).json(data);
      return;
    }
    else if (req.method === 'DELETE') {
      let body = req.body;
      let data = await database.deleteRecentSongs(body.OwnerUserID as string) as any;
      res.status(200).json(data);
      return;
    }
    winston.error(`Method ${req.method} not allowed`);
    res.status(405).end();
}
