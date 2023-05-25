import Database from '@/database/db';
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  name: string
}

const database = new Database();

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    // Attempt to create the username for a user
    if (req.method === 'PATCH') {
        let shouldEnable = req.body.enable as boolean;
        if (shouldEnable) {
            let data = await database.enableUnattendedQueues(req.body.UserID as string) as any;
            res.status(200).json(data);
            return;
        } else {
            let data = await database.disableUnattendedQueues(req.body.UserID as string) as any;
            res.status(200).json(data);
            return;
        }
    }

    // Get a user's profile
    if (req.method === 'GET') {
        let data = await database.getUnattendedQueues(req.query.UserID as string) as any;
        res.status(200).json(data);
        return;
    }
}