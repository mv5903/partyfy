import Database from '@/database/db';
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  name: string
}

const database = new Database();

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    // Add new session into the database
    if (req.method === 'POST') {
        let data = await database.createSession(req.body.UserID as string, req.body.ExpirationDate as Date) as any;
        if (!data) {
            res.status(500).json({name: 'Error creating session'});
            return;
        }
        res.status(200).json(data);
        return;
    }
    // Update expiration date of ongoing session
    if (req.method === 'PATCH') {
        let data = await database.updateSession(req.body.UserID as string, req.body.ExpirationDate as Date) as any;
        if (!data) {
            res.status(500).json({name: 'Error updating session'});
            return;
        }
        res.status(200).json(data);
        return;
    }
    // Get a user's ongoing session
    if (req.method === 'GET') {
        if (!req.query.UserID) {
            let data = await database.getSessionFromID(req.query.SessionID as string) as any;
            res.status(200).json(data);
            return;
        }
        let data = await database.getSession(req.query.UserID as string) as any;
        res.status(200).json(data);
        return;
    }
    // Delete a user's ongoing session
    if (req.method === 'DELETE') {
        let data = await database.deleteSession(req.body.UserID as string) as any;
        res.status(200).json(data);
        return;
    }
}