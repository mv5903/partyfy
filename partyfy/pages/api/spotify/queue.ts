import Database from '@/database/db';
import UserOptions, { RollingPeriod } from '@/prisma/UserOptions';
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  name: string
}

const database = new Database();

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method === 'GET') {
        let access_token = req.query.access_token as string;
        let response = await fetch('https://api.spotify.com/v1/me/player/queue', {  
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": "Bearer " + access_token,
            }
        });
        if (!response.ok) {
            res.status(response.status).json({name: response.statusText});
            return;
        }
        let json = await response.json();
        if (json.error) {
            res.status(json.error.status).json({name: json.error.message});
        }
        res.status(200).json(json);
        return;
    }
    if (req.method === 'POST') {
        // BEGIN: Verify that the user has the necessary permissions to queue a song, if friend is a commerical account
        let requesteeUserID = req.body.UserID;
        let requesteeDeviceID = req.body.DeviceID;
        let friendUserID = req.body.FriendUserID;

        // Check if the friend is a commercial account
        let friendData = await database.getUser(friendUserID);
        if (!friendData) {
            res.status(404).json({name: 'User not found'});
            return;
        }
        if (friendData.product_type === 'commercial' && friendData.options) {
            // Get all the queues from the requestee (userID first if exists, otherwise deviceID). Sorted by most recent to oldest.
            let deviceQueues = await database.getDeviceQueues(requesteeUserID, requesteeDeviceID, friendUserID);
    
            // Check the restriction based on this data
            if (deviceQueues.length > 0) {
                let friendOptions = friendData.options;
                let queueLimitTimeRestriction = friendOptions["queueLimitTimeRestriction"];
                if (queueLimitTimeRestriction) {
                    let restriction = (friendOptions as unknown) as UserOptions;
                    // Determine songs that are within the time restriction
                    let currentTime = new Date();
                    let currentTimeMinusInterval = getPastTime(
                        queueLimitTimeRestriction.intervalValue,
                        queueLimitTimeRestriction.intervalUnit
                    );
    
                    let songsWithinTimeRestriction = deviceQueues.filter((queue) => {
                        let queueTime = new Date(queue.created_at);
                        return queueTime >= currentTimeMinusInterval;
                    });
    
                    if (songsWithinTimeRestriction.length >= queueLimitTimeRestriction.maxQueueCount) {
                        let timeUntilNextQueue = new Date(
                            new Date(songsWithinTimeRestriction[0].created_at).getTime() +
                            queueLimitTimeRestriction.intervalValue * getMilliseconds(queueLimitTimeRestriction.intervalUnit)
                        );

                        // Check if now's date is the same, if so, hide the date portion
                        if (timeUntilNextQueue.toLocaleDateString() === currentTime.toLocaleDateString()) {
                            let reopeningDate = timeUntilNextQueue.toLocaleTimeString();
                            res.status(201).json({ name: 'Try again at '  + reopeningDate });
                            return;
                        } else {
                            let reopeningDate = timeUntilNextQueue.toLocaleDateString() + " " + timeUntilNextQueue.toLocaleTimeString();
                            res.status(201).json({ name: 'Try again at '  + reopeningDate });
                            return;
                        }
                    }
                }
            }

            // If we get here, the user has the necessary permissions to queue a song
            // Log to the queue
            await database.addToDeviceQueue(requesteeUserID, requesteeDeviceID, friendUserID, req.body.uri as string);
        }

        // END: Verify that the user has the necessary permissions to queue a song, if friend is a commerical account

        let response = await fetch('https://api.spotify.com/v1/me/player/queue?uri=' + encodeURIComponent(req.body.uri as string), {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": "Bearer " + req.body.access_token as string,
            }
        });
        if (!response.ok) {
            let json = await response.json();
            if (json.error) {
                res.status(json.error.status).json({name: json.error.message});
                return;
            } else {
                res.status(response.status).json({name: response.statusText});
                return;
            }
        } else {
            res.status(200).json({name: 'OK'});
            return;
        }
    }
}

// Function to calculate the past time based on interval value and unit
function getPastTime(intervalValue: number, intervalUnit: RollingPeriod): Date {
    const currentTime = new Date();
    switch (intervalUnit) {
        case RollingPeriod.MINUTE:
            currentTime.setMinutes(currentTime.getMinutes() - intervalValue);
            break;
        case RollingPeriod.HOUR:
            currentTime.setHours(currentTime.getHours() - intervalValue);
            break;
        case RollingPeriod.DAY:
            currentTime.setDate(currentTime.getDate() - intervalValue);
            break;
        case RollingPeriod.WEEK:
            currentTime.setDate(currentTime.getDate() - (intervalValue * 7));
            break;
        case RollingPeriod.MONTH:
            currentTime.setMonth(currentTime.getMonth() - intervalValue);
            break;
        case RollingPeriod.YEAR:
            currentTime.setFullYear(currentTime.getFullYear() - intervalValue);
            break;
        default:
            throw new Error(`Unsupported interval unit: ${intervalUnit}`);
    }
    return currentTime;
}

// Function to convert interval unit to milliseconds
function getMilliseconds(intervalUnit: RollingPeriod): number {
    switch (intervalUnit) {
        case RollingPeriod.MINUTE:
            return 1000 * 60;
        case RollingPeriod.HOUR:
            return 1000 * 60 * 60;
        case RollingPeriod.DAY:
            return 1000 * 60 * 60 * 24;
        case RollingPeriod.WEEK:
            return 1000 * 60 * 60 * 24 * 7;
        case RollingPeriod.MONTH:
            return 1000 * 60 * 60 * 24 * 30; // Approximation
        case RollingPeriod.YEAR:
            return 1000 * 60 * 60 * 24 * 365; // Approximation
        default:
            throw new Error(`Unsupported interval unit: ${intervalUnit}`);
    }
}