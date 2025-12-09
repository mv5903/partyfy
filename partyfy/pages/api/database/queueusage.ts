import Database from '@/database/db';
import { RollingPeriod } from '@/prisma/UserOptions';
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
    hasRestriction: boolean;
    currentQueueCount?: number;
    maxQueueCount?: number;
    timeUntilNextQueue?: string;
    intervalValue?: number;
    intervalUnit?: RollingPeriod;
}

const database = new Database();

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method === 'GET') {
        const requesteeUserID = req.query.UserID as string | null;
        const requesteeDeviceID = req.query.DeviceID as string;
        const friendUserID = req.query.FriendUserID as string;

        if (!friendUserID || (!requesteeUserID && !requesteeDeviceID)) {
            res.status(400).json({ hasRestriction: false });
            return;
        }

        // Check if the friend is a commercial account with queue restrictions
        let friendData = await database.getUser(friendUserID);
        if (!friendData || friendData.product_type !== 'commercial' || !friendData.options) {
            res.status(200).json({ hasRestriction: false });
            return;
        }

        const friendOptions = friendData.options;
        const queueLimitTimeRestriction = friendOptions["queueLimitTimeRestriction"];

        if (!queueLimitTimeRestriction || queueLimitTimeRestriction.maxQueueCount <= 0) {
            res.status(200).json({ hasRestriction: false });
            return;
        }

        // Get all the queues from the requestee
        let deviceQueues = await database.getDeviceQueues(requesteeUserID, requesteeDeviceID, friendUserID);

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

        const currentQueueCount = songsWithinTimeRestriction.length;
        const maxQueueCount = queueLimitTimeRestriction.maxQueueCount;

        // Check if user is at limit
        if (currentQueueCount >= maxQueueCount && songsWithinTimeRestriction.length > 0) {
            let timeUntilNextQueue = new Date(
                new Date(songsWithinTimeRestriction[0].created_at).getTime() +
                queueLimitTimeRestriction.intervalValue * getMilliseconds(queueLimitTimeRestriction.intervalUnit)
            );

            res.status(200).json({
                hasRestriction: true,
                currentQueueCount,
                maxQueueCount,
                timeUntilNextQueue: getNextAvailableTime(timeUntilNextQueue),
                intervalValue: queueLimitTimeRestriction.intervalValue,
                intervalUnit: queueLimitTimeRestriction.intervalUnit
            });
            return;
        }

        // User has remaining queues
        res.status(200).json({
            hasRestriction: true,
            currentQueueCount,
            maxQueueCount,
            intervalValue: queueLimitTimeRestriction.intervalValue,
            intervalUnit: queueLimitTimeRestriction.intervalUnit
        });
        return;
    }

    res.status(405).json({ hasRestriction: false });
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

function getNextAvailableTime(targetDate: Date): string {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) return "now";

    const minute = 1000 * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30.44; // Approximate month length
    const year = day * 365.25; // Approximate year length

    const years = Math.floor(diff / year);
    const months = Math.floor((diff % year) / month);
    const weeks = Math.floor((diff % month) / week);
    const days = Math.floor((diff % week) / day);
    const hours = Math.floor((diff % day) / hour);
    const minutes = Math.floor((diff % hour) / minute);
    const seconds = Math.floor((diff % minute) / 1000);

    const timeSegments: string[] = [];

    if (years > 0) timeSegments.push(`${years} ${RollingPeriod.YEAR}${years > 1 ? 's' : ''}`);
    if (months > 0) timeSegments.push(`${months} ${RollingPeriod.MONTH}${months > 1 ? 's' : ''}`);
    if (weeks > 0) timeSegments.push(`${weeks} ${RollingPeriod.WEEK}${weeks > 1 ? 's' : ''}`);
    if (days > 0) timeSegments.push(`${days} ${RollingPeriod.DAY}${days > 1 ? 's' : ''}`);
    if (hours > 0) timeSegments.push(`${hours} ${RollingPeriod.HOUR}${hours > 1 ? 's' : ''}`);
    if (minutes > 0) timeSegments.push(`${minutes} ${RollingPeriod.MINUTE}${minutes > 1 ? 's' : ''}`);

    // Only show seconds if less than 1 minute
    if (timeSegments.length === 0 && seconds > 0) {
        timeSegments.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
    }

    return timeSegments.join(', ');
}
