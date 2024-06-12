import Database from '@/database/db';
import type { NextApiRequest, NextApiResponse } from 'next';

const database = new Database();

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const errDetails = req.body;

    if (!errDetails) {
        res.status(400).json({ message: 'Request body must be provided.' });
        return;
    }

    console.log('Error reported:', errDetails);
    
    // Add error to database if it isn't a client-side user network error
    const wasLogged = await database.addNewClientError(errDetails);

    // Notify myself via Home Assistant Automation
    if (wasLogged) await fetch(process.env.HOME_ASSISTANT_ALERT_WEBHOOK_URL);

    res.status(200).json({ message: 'Error reported successfully' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};
