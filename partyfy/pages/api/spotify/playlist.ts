import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  name: string
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    let access_token = req.query.access_token as string;
    let action = req.query.action as string;
    if (action === 'list') {
        let url = 'https://api.spotify.com/v1/me/playlists';
        let offset = req.query?.offset as string;
        if (offset) {
            url  += `?offset=${offset}`;
        }
        let response = await fetch(url, {
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Authorization": "Bearer " + access_token,
                "Content-Type": "application/json",
            }
        });
        try {
            if (response.statusText === 'No Content' || response.status === 204) {
                res.status(204).end();
                return;
            }
            let data = await response.json();
            res.status(200).json(data);
            return;
        } catch (error: any) {
            res.status(500).json(error);
            return;
        }
    } else if (action === 'get') {
        let playlist_id = req.query.playlist_id as string;
        let url = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`
        let offset = req.query?.offset as string;
        if (offset) {
            url  += `?offset=${offset}`;
        }
        let response = await fetch(url, {
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Authorization": "Bearer " + access_token,
                "Content-Type": "application/json",
            }
        });
        try {
            if (response.statusText === 'No Content' || response.status === 204) {
                res.status(204).end();
                return;
            }
            let data = await response.json();
            res.status(200).json(data);
            return;
        } catch (error: any) {
            res.status(500).json(error);
            return;
        }
    }
    res.status(500).json({name: 'Invalid action'});
}