import type { NextApiRequest, NextApiResponse } from 'next'

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
            let data = await response.json() as any;
            url = 'https://api.spotify.com/v1/me/tracks';
            response = await fetch(url, {
                method: 'GET',
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer " + access_token,
                    "Content-Type": "application/json",
                }
            });
            let likedSongs = await response.json();
            let tracks = likedSongs.items.map((track: any) => track.track);
            let likedSongsObj = {
                collaborative: false,
                description: 'Liked Songs',
                external_urls: null,
                href: null,
                id: 'likedSongs',
                images: null,
                name: 'Liked Songs',
                owner: null,
                primary_color: null,
                public: false,
                snapshot_id: null,
                tracks,
                type: 'playlist',
                uri: null,
                count: likedSongs.total
            }
            data.items.unshift(likedSongsObj);
            res.status(200).json(data);
            return;
        } catch (error: any) {
            res.status(500).json(error);
            return;
        }
    } else if (action === 'get') {
        let playlist_id = req.query.playlist_id as string;
        if (playlist_id === 'likedSongs') {
            let offset = req.query?.offset as string;
            let url = 'https://api.spotify.com/v1/me/tracks' + (offset ? `?offset=${offset}` : '');
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
        } else {
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
    }
    res.status(500).json({name: 'Invalid action'});
}