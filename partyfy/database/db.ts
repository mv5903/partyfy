import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default class Database {

    async getRecentSongs(OwnerUserID: string){
        const data = (await prisma.recents.findMany()).reverse();
        await prisma.$disconnect();
        return data;
    }

    async insertRecentSong(OwnerUserID: string, SongID: string, SongName: string, SongArtist: string, SongAlbum: string, SongArt: string, SongExplicit: boolean) {
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
        return data;
    }

    async deleteRecentSongs(OwnerUserID: string) {
        const data = await prisma.recents.deleteMany({
            where: {
                OwnerUserID: OwnerUserID
            }
        });
        await prisma.$disconnect();
        return data;
    }

    async getUser(UserID: string) {
        const data = await prisma.users.findFirst({
            where: {
                UserID: UserID
            }
        });
        await prisma.$disconnect();
        return data;
    }

    async addNewUser(UserID: string) {
        const data = await prisma.users.create({
            data: {
                UserID: UserID
            }
        });
        await prisma.$disconnect();
        return data;
    }

    async addUserRefreshToken(UserID: string, RefreshToken: string) {
        const data = await prisma.users.update({
            where: {
                UserID: UserID
            },
            data: {
                RefreshToken: RefreshToken
            }
        });
        await prisma.$disconnect();
        return data;
    }

    async addUsername(UserID: string, Username: string) {
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
            return data;
        } catch (err: any) {
            if (err.toString().includes('Cannot insert duplicate key')) {
                return {
                    duplicate: true
                }
            }
        }
    }

    async enableUnattendedQueues(UserID: string) {
        const data = await prisma.users.update({
            where: {
                UserID: UserID
            },
            data: {
                UnattendedQueues: true
            }
        });
        await prisma.$disconnect();
        return data;
    }

    async disableUnattendedQueues(UserID: string) {
        const data = await prisma.users.update({
            where: {
                UserID: UserID
            },
            data: {
                UnattendedQueues: false
            }
        });
        await prisma.$disconnect();
        return data;
    }

    async getUnattendedQueues(UserID: string) {
        const data = await prisma.users.findFirst({
            where: {
                UserID: UserID
            },
            select: {
                UnattendedQueues: true
            }
        });
        await prisma.$disconnect();
        return data;
    }

    async searchForUsers(UserID: string, Query: string) {
        // Ignore all users that are either friends with [UserID] or have an outgoing friend request already
        const userFriendRelations = await prisma.friends.findMany({
            where: {
                UserID: UserID
            },
            select: {
                FriendUserID: true
            }
        });
        let friends = userFriendRelations.map(u => u.FriendUserID);

        const data = await prisma.users.findMany({
            where: {
                Username: {
                    contains: Query,
                },
                UserID: {
                    notIn: friends
                }
            }
        });
        await prisma.$disconnect();
        return data;
    }

    // [UserID] sends [FriendUserID] a friend request. Appears in [FriendUserID]'s requests page.
    async addFriendRequest(UserID: string, FriendUserID: string) {
        const data = await prisma.friends.create({
            data: {
                UserID: UserID,
                FriendUserID: FriendUserID,
                IsFriendRequest: true
            }
        });
        await prisma.$disconnect();
        return data;
    }

    // [FriendUserID] accepts [UserID]'s friend request.
    async acceptFriendRequest(UserID: string, FriendUserID: string) {
        await prisma.friends.create({
            data: {
                UserID: FriendUserID,
                FriendUserID: UserID,
                IsFriendRequest: false,
            }
        });
        await prisma.friends.updateMany({
            where: {
                UserID: UserID
            },
            data: {
                IsFriendRequest: false
            }
        });
        await prisma.$disconnect();
    }

    async getFriends(UserID: string) {
        const data = await prisma.friends.findMany({
            where: {
                UserID: UserID,
                IsFriendRequest: false
            }
        });
        await prisma.$disconnect();
        return data;
    }

    async getSentFriendRequests(UserID: string) {
        const data = await prisma.friends.findMany({
            where: {
                UserID: UserID,
                IsFriendRequest: true
            }
        });
        await prisma.$disconnect();
        return data;
    }

    // Delete [UserID]'s friendship with [FriendUserID].
    // Delete [FriendUserID]'s friendship with [UserID]
    async removeFriend(UserID: string, FriendUserID: string) {
        await prisma.friends.deleteMany({
            where: {
                UserID: UserID,
                FriendUserID: FriendUserID
            }
        });
        await prisma.friends.deleteMany({
            where: {
                UserID: FriendUserID,
                FriendUserID: UserID
            }
        });
        await prisma.$disconnect();
    }
}
