import { prisma } from '@/./db';
import { winston } from '@/logs/winston';
import UserOptions from '@/prisma/UserOptions';

export default class Database {
    async setOptions(UserID: string, userOptions: UserOptions) {
        winston.info(`[Database] Setting options for ${UserID}`);
        let json = JSON.stringify(userOptions);
        const data = await prisma.users.update({
            where: {
                UserID: UserID
            },
            data: {
                options: JSON.parse(json)  
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully set options for ${UserID}`);
        return data;
    }

    async getSessionFromID(SessionID: string) {
        winston.info(`[Database] Getting session from ID ${SessionID}`);
        const data = await prisma.sessions.findFirst({
            where: {
                session_id: SessionID
            }
        });
        await prisma.$disconnect();
        if (data) winston.info(`[Database] Successfully got session from ID ${SessionID}`);
        else winston.info(`[Database] Failed to get session from ID ${SessionID}, likely does not exist`);
        return data;
    }

    async deleteSession(UserID: string) {
        winston.info(`[Database] Deleting session for ${UserID}`);
        try {
            const data = await prisma.sessions.delete({
                where: {
                    user_id: UserID
                }
            });
            await prisma.$disconnect();
            winston.info(`[Database] Successfully deleted session for ${UserID}`);
            return data;
        } catch (err: any) {
            winston.error(`[Database] Failed to delete session for ${UserID}: does not exist`);
            return {
                name: 'Error deleting session'
            }
        }

    }

    async getSession(UserID: string) {
        winston.info(`[Database] Getting session for ${UserID}`);
        const data = await prisma.sessions.findMany({
            where: {
                user_id: UserID
            }
        });
        let sortedData = data.sort((a, b) => a.created_date.getTime() - b.created_date.getTime());
        await prisma.$disconnect();
        if (sortedData) winston.info(`[Database] Successfully got session for ${UserID}`);
        else winston.info(`[Database] Failed to get session for ${UserID}, likely does not exist`);
        return sortedData[sortedData.length - 1];
    }

    async updateSession(UserID: string, NewExpirationDate: Date) {
        winston.info(`[Database] Updating session for ${UserID} to ${NewExpirationDate}`);
        const data = await prisma.sessions.update({
            where: {
                user_id: UserID
            },
            data: {
                expiration_date: NewExpirationDate
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully updated session for ${UserID} to ${NewExpirationDate}`);
        return data;
    }

    async createSession(UserID: string, ExpirationDate: Date) {
        winston.info(`[Database] Creating session for ${UserID}`);
        const data = await prisma.sessions.create({
            data: {
                user_id: UserID,
                expiration_date: ExpirationDate
            }
        });
        await prisma.$disconnect();
        let sessionID = data.session_id;
        winston.info(`[Database] Successfully created session for ${UserID}, with session ID ${sessionID}`);
        return data;
    }
    
    async updateUsername(UserID: string, newUsername: string) {
        winston.info(`[Database] Updating username for ${UserID} to ${newUsername}`);
        const data = await prisma.users.update({
            where: {
                UserID: UserID
            },
            data: {
                Username: newUsername
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully updated username for ${UserID} to ${newUsername}`);
        return data;
    }
    async updateUserLastLoginNow(UserID: string) {
        winston.info(`[Database] Setting last_login of users for ${UserID} to now`);
        const data = await prisma.users.update({
            where: {
                UserID: UserID
            },
            data: {
                last_login: new Date()
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully Set last_login of users for ${UserID} to now`);
        return data;
    }

    async getRecentSongs(OwnerUserID: string) {
        winston.info(`[Database] Getting recent songs for ${OwnerUserID}`);
        const data = (await prisma.recents.findMany({
            where: {
                OwnerUserID: OwnerUserID
            },
        })).reverse();
        await prisma.$disconnect();
        if (data.length > 0) winston.info(`[Database] Successfully got ${data.length} recent songs for ${OwnerUserID}`);
        return data;
    }

    async insertRecentSong(OwnerUserID: string, SongID: string, SongName: string, SongArtist: string, SongAlbum: string, SongArt: string, SongExplicit: boolean) {
        winston.info(`[Database] Inserting recent song for ${OwnerUserID}, content: ${SongName} by ${SongArtist}`);
        const data = await prisma.recents.create({
            data: {
                OwnerUserID: OwnerUserID,
                PlayedAt: new Date(),
                SongID: SongID,
                SongName: SongName,
                SongArtist: SongArtist,
                SongAlbum: SongAlbum,
                SongArt: SongArt,
                SongExplicit: SongExplicit
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully inserted recent song for ${OwnerUserID}, content: ${SongName} by ${SongArtist}`);
        return data;
    }

    async deleteRecentSongs(OwnerUserID: string) {
        winston.info(`[Database] Deleting recent songs for ${OwnerUserID}`);
        const data = await prisma.recents.deleteMany({
            where: {
                OwnerUserID: OwnerUserID
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully deleted recent songs for ${OwnerUserID}`);
        return data;
    }

    async getUser(UserID: string) {
        winston.info(`[Database] Getting user ${UserID}`);
        const data = await prisma.users.findFirst({
            where: {
                UserID: UserID
            }
        });
        await prisma.$disconnect();
        if (data) winston.info(`[Database] Successfully got user ${UserID}`);
        else {
            winston.info(`[Database] Failed to get user ${UserID}, likely does not exist`);
            return null;
        } 
        return data;
    }

    async addNewUser(UserID: string) {
        winston.info(`[Database] Adding new user ${UserID}`);
        const data = await prisma.users.create({
            data: {
                UserID: UserID
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully added new user ${UserID}`);
        return data;
    }

    async addUserRefreshToken(UserID: string, RefreshToken: string) {
        winston.info(`[Database] Adding refresh token ${RefreshToken} for ${UserID}`);
        const data = await prisma.users.update({
            where: {
                UserID: UserID
            },
            data: {
                RefreshToken: RefreshToken
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully added refresh token ${RefreshToken} for ${UserID}`);
        return data;
    }

    async addUsername(UserID: string, Username: string) {
        winston.info(`[Database] Adding username ${Username} for ${UserID}`);
        // Attempt to get user with username first, to see if it exists
        const user = await prisma.users.findFirst({
            where: {
                Username: Username
            }
        });
        if (user) {
            winston.warn(`[Database] Failed to add username ${Username} for ${UserID}, already exists`);
            return {
                duplicate: true
            }
        }
        try {
            const data = await prisma.users.update({
                where: {
                    UserID: UserID
                },
                data: {
                    Username: Username
                }
            });
            await prisma.$disconnect();
            winston.info(`[Database] Successfully added username ${Username} for ${UserID}`);
            return data;
        } catch (err: any) {
            if (err.toString().includes('Cannot insert duplicate key')) {
                winston.warn(`[Database] Failed to add username ${Username} for ${UserID}, already exists`);
                return {
                    duplicate: true
                }
            }
        }
    }

    async enableUnattendedQueues(UserID: string) {
        winston.info(`[Database] Enabling unattended queues for ${UserID}`);
        const data = await prisma.users.update({
            where: {
                UserID: UserID
            },
            data: {
                UnattendedQueues: true
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully enabled unattended queues for ${UserID}`);
        return data;
    }

    async disableUnattendedQueues(UserID: string) {
        winston.info(`[Database] Disabling unattended queues for ${UserID}`);
        const data = await prisma.users.update({
            where: {
                UserID: UserID
            },
            data: {
                UnattendedQueues: false
            }
        });
        winston.info(`[Database] Successfully disabled unattended queues for ${UserID}`);
        await prisma.$disconnect();
        return data;
    }

    async getUnattendedQueues(UserID: string) {
        winston.info(`[Database] Getting unattended queues for ${UserID}`);
        const data = await prisma.users.findFirst({
            where: {
                UserID: UserID
            },
            select: {
                UnattendedQueues: true
            }
        });
        await prisma.$disconnect();
        if (data) winston.info(`[Database] Successfully got unattended queues for ${UserID}`);
        return data;
    }

    async searchForUsers(UserID: string, Query: string) {
        // Ignore all users that are already friends, or have a pending friend request
        winston.info(`[Database] Searching for users with query ${Query} for ${UserID}`);
        const userFriends = await this.getFriends(UserID);
        const outgoingFriendRequests = await this.getSentFriendRequests(UserID);
        const incomingFriendRequests = await this.getIncomingFriendRequests(UserID);
        let friendIDS = userFriends.map(u => u.UserID);
        friendIDS = friendIDS.concat(outgoingFriendRequests.map(u => u.UserID));
        friendIDS = friendIDS.concat(incomingFriendRequests.map(u => u.UserID));
        friendIDS = friendIDS.filter((v, i, a) => a.indexOf(v) === i);
        const data = (await prisma.users.findMany({
            where: {
                Username: {
                    contains: Query,
                    mode: 'insensitive'
                },
                UserID: {
                    notIn: friendIDS
                }
            },
            take: 5
        })).filter((user, index, array) => array.findIndex(u => u.UserID === user.UserID) === index && user.Username !== UserID);
        await prisma.$disconnect();
        if (data) winston.info(`[Database] Successfully searched for users with query ${Query} for ${UserID}`);
        else winston.info(`[Database] User ${UserID}'s search for users with query ${Query} returned no results`);
        return data;
    }

    // [UserID] sends [FriendUserID] a friend request. Appears in [FriendUserID]'s requests page.
    async addFriendRequest(UserID: string, FriendUserID: string) {
        winston.info(`[Database] Adding friend request from ${UserID} to ${FriendUserID}`);
        const data = await prisma.friends.create({
            data: {
                UserID: UserID,
                FriendUserID: FriendUserID,
                IsFriendRequest: true
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully added friend request from ${UserID} to ${FriendUserID}`);
        return data;
    }

    // [FriendUserID] accepts [UserID]'s friend request.
    async acceptFriendRequest(UserID: string, FriendUserID: string) {
        winston.info(`[Database] Accepting friend request from ${FriendUserID} to ${UserID}`);
        await prisma.friends.updateMany({
            where: {
                UserID: FriendUserID,
                FriendUserID: UserID
            },
            data: {
                IsFriendRequest: false
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully accepted friend request from ${FriendUserID} to ${UserID}`);
    }

    async getFriends(UserID: string) {
        winston.info(`[Database] Getting friends for ${UserID}`);
        const data = await prisma.friends.findMany({
            where: {
                OR: [
                    {
                        UserID: UserID,
                        IsFriendRequest: false
                    },
                    {
                        FriendUserID: UserID,
                        IsFriendRequest: false
                    }
                ]
            },
        });
        
        let friendUsernames: any = [];

        
        data.forEach(user => {
            if (user.UserID == UserID) {
                friendUsernames.push(user.FriendUserID);
            } else {
                friendUsernames.push(user.UserID);
            }
        });
        
        const friends = await prisma.users.findMany({
            where: {
                UserID: {
                    in: friendUsernames
                }
            },
        });
        await prisma.$disconnect();
        if (friends) winston.info(`[Database] Successfully got friends for ${UserID}`);
        else winston.info(`[Database] User ${UserID} has no friends`);
        return friends;
    }

    async getSentFriendRequests(UserID: string) {
        winston.info(`[Database] Getting sent friend requests for ${UserID}`);
        const data = await prisma.friends.findMany({
            where: {
                UserID: UserID,
                IsFriendRequest: true
            }
        });
        const usernamesForData = await prisma.users.findMany({
            where: {
                UserID: {
                    in: data.map(u => u.FriendUserID)
                }
            },
        });
        await prisma.$disconnect();
        if (usernamesForData) winston.info(`[Database] Successfully got sent friend requests for ${UserID}`);
        else winston.info(`[Database] User ${UserID} has no sent friend requests`);
        return usernamesForData;
    }

    async getIncomingFriendRequests(UserID: string) {
        winston.info(`[Database] Getting incoming friend requests for ${UserID}`);
        const data = await prisma.friends.findMany({
            where: {
                FriendUserID: UserID,
                IsFriendRequest: true
            }
        });
        const usernamesForData = await prisma.users.findMany({
            where: {
                UserID: {
                    in: data.map(u => u.UserID)
                }
            },
        });
        await prisma.$disconnect();
        if (usernamesForData) winston.info(`[Database] Successfully got incoming friend requests for ${UserID}`);
        else winston.info(`[Database] User ${UserID} has no incoming friend requests`);
        return usernamesForData;
    }

    async deleteFriendRequest(UserID: string, FriendUserID: string) {
        winston.info(`[Database] Deleting friend request from ${UserID} to ${FriendUserID}`);
        await prisma.friends.deleteMany({
            where: {
                UserID: UserID,
                FriendUserID: FriendUserID,
                IsFriendRequest: true
            }
        });
        await prisma.friends.deleteMany({
            where: {
                UserID: FriendUserID,
                FriendUserID: UserID,
                IsFriendRequest: true
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully deleted friend request from ${UserID} to ${FriendUserID}`);
    }

    async deleteFriend(UserID: string, FriendUserID: string) {
        winston.info(`[Database] Deleting friendship between ${UserID} and ${FriendUserID}`);
        await prisma.friends.deleteMany({
            where: {
                UserID: UserID,
                FriendUserID: FriendUserID,
                IsFriendRequest: false
            }
        });
        await prisma.friends.deleteMany({
            where: {
                UserID: FriendUserID,
                FriendUserID: UserID,
                IsFriendRequest: false
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully deleted friendship between ${UserID} and ${FriendUserID}`);
    }

    async deleteUser(UserID: string) {
        winston.info(`[Database] Deleting user ${UserID}`);
        await prisma.users.delete({
            where: {
                UserID: UserID
            }
        });
        await prisma.friends.deleteMany({
            where: {
                OR: [
                    {
                        UserID: UserID
                    },
                    {
                        FriendUserID: UserID
                    }
                ]
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully deleted user ${UserID}`);
    }

    async unlinkUser(UserID: string) {
        winston.info(`[Database] Unlinking user ${UserID}'s Spotify account`);
        await prisma.users.update({
            where: {
                UserID: UserID
            },
            data: {
                RefreshToken: null
            }
        });
        await prisma.$disconnect();
        winston.info(`[Database] Successfully unlinked user ${UserID}`);
    }

    async isFriend(UserID: string, FriendUserID: string) {
        winston.info(`[Database] Checking if ${UserID} is friends with ${FriendUserID}`);
        const data = await prisma.friends.findFirst({
            where: {
                OR: [
                    {
                        UserID: UserID,
                        FriendUserID: FriendUserID,
                        IsFriendRequest: false
                    },
                    {
                        UserID: FriendUserID,
                        FriendUserID: UserID,
                        IsFriendRequest: false
                    }
                ]
            }
        });
        await prisma.$disconnect();
        if (data) winston.info(`[Database] ${UserID} is friends with ${FriendUserID}`);
        else winston.info(`[Database] ${UserID} is not friends with ${FriendUserID}`);
        return data;
    }
}
