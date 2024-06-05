import Database from '@/database/db';
import type { NextApiRequest, NextApiResponse } from 'next';

const database = new Database();

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const errDetails = req.body;

    if (!errDetails) {
        res.status(400).json({ message: 'Invalid request body, UserID key must be present.' });
        return;
    }

    console.log('Error reported:', errDetails);
    
    await database.addNewClientError(errDetails);
    res.status(200).json({ message: 'Error reported successfully' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};
