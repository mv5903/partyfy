import Database from '@/database/db';
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  name: string
}

const database = new Database();

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    // Add new user into database if it doesn't exist
    if (req.method === 'POST') {
        let data = await database.getUser(req.body.UserID as string) as any;
        if (!data) {
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
    // Delete a user's profile
    if (req.method === 'DELETE') {
        let data = await database.deleteUser(req.query.UserID as string) as any;
        res.status(200).json(data);
        return;
    }
}