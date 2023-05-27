import Database from '@/database/db';
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  name: string
}

const database = new Database();

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    // Get user's friends list
    if (req.method === 'GET') {
        if (req.query.action) {
            let action = req.query.action as string;
            if (action === 'search') {
                let data = await database.searchForUsers(req.query.UserID as string, req.query.Query as string);
                res.status(200).json(data as any);
                return;
            }
            if (action === 'sent') {
                let data = await database.getSentFriendRequests(req.query.UserID as string);
                res.status(200).json(data as any);
                return;
            }
            if (action === 'requests') {
                let data = await database.getIncomingFriendRequests(req.query.UserID as string);
                res.status(200).json(data as any);
                return;
            }
        } else {
            let data = await database.getFriends(req.query.UserID as string) as any;
            res.status(200).json(data);
            return;
        }
    }
    if (req.method === 'PATCH') {
        let body = req.body;
        let action = body.action;
        if (action == 'SendFriendReqest') {
            let data = await database.addFriendRequest(body.UserID as string, body.FriendUserID as string) as any;
            res.status(200).json(data);
            return;
        }
        if (action == 'AcceptFriendRequest') {
            let data = await database.acceptFriendRequest(body.UserID as string, body.FriendUserID as string) as any;
            res.status(200).json(data);
            return;
        }
    }
    if (req.method === 'DELETE') {
        let body = req.body;
        let action = body.action;
        if (action == 'DeleteFriendRequest') {
            let data = await database.deleteFriendRequest(body.UserID as string, body.FriendUserID as string) as any;
            res.status(200).json(data);
            return;
        }
        if (action == 'DeleteFriend') {
            let data = await database.deleteFriend(body.UserID as string, body.FriendUserID as string) as any;
            res.status(200).json(data);
            return;
        }
    }
}