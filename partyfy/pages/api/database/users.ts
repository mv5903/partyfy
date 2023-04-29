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
    // Add new user into database if it doesn't exist
    if (req.method === 'POST') {
        let data = await database.getUser(req.body.UserID as string) as any;
        if (data.recordset.length == 0) {
            data = await database.addNewUser(req.body.UserID as string) as any;
        }
        res.status(200).json(data);
        return;
    }
    // Update user by adding in refresh token
    if (req.method === 'PATCH') {
        let data = await database.addUserRefreshToken(req.body.UserID as string, req.body.RefreshToken as string) as any;
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