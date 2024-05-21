import Database from '@/database/db';
import UserOptions from '@/prisma/UserOptions';
import type { NextApiRequest, NextApiResponse } from 'next';

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
        if (req.body.last_login) {
            let data = await database.updateUserLastLoginNow(req.body.UserID as string) as any;
            res.status(200).json(data);
        } else if (req.body.changeUsername) {
            let data = await database.updateUsername(req.body.UserID as string, req.body.Username as string) as any;
            res.status(200).json(data);
        } else if (req.body.setOptions) {
            let options = JSON.parse(req.body.setOptions as string) as UserOptions;
            let data = await database.setOptions(req.body.UserID as string, options) as any;
            res.status(200).json(data);
        } else {
            let data = await database.addUserRefreshToken(req.body.UserID as string, req.body.RefreshToken as string) as any;
            res.status(200).json(data);
        }
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
        let action = req.query.action as string;
        if (action === 'unlink') {
            let data = await database.unlinkUser(req.query.UserID as string) as any;
            res.status(200).json(data);
            return;
        }
        let data = await database.deleteUser(req.query.UserID as string) as any;
        res.status(200).json(data);
        return;
    }
}