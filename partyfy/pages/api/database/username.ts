import Database from '@/database/db';
import type { NextApiRequest, NextApiResponse } from 'next'
import { config } from '../config'

type Data = {
  name: string
}

const database = new Database();

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    // Attempt to create the username for a user
    if (req.method === 'PATCH') {
        let data = await database.addUsername(req.body.UserID as string, req.body.Username as string) as any;
        res.status(200).json(data);
        return;
    }

    // Get a user's profile
    if (req.method === 'GET') {
        let data = await database.getUser(req.query.UserID as string) as any;
        res.status(200).json(data);
        return;
    }
}