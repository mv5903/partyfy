import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default class Database {

    async getRecentSongs(OwnerUserID: string){
        return (await prisma.recents.findMany()).reverse();
    }

    async insertRecentSong(OwnerUserID: string, SongID: string, SongName: string, SongArtist: string, SongAlbum: string, SongArt: string, SongExplicit: boolean) {
        return await prisma.recents.create({
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
    }

    async deleteRecentSongs(OwnerUserID: string) {
        return await prisma.recents.deleteMany({
            where: {
                OwnerUserID: OwnerUserID
            }
        });
    }

    async getUser(UserID: string) {
        return await prisma.users.findFirst({
            where: {
                UserID: UserID
            }
        });
    }

    async addNewUser(UserID: string) {
        return await prisma.users.create({
            data: {
                UserID: UserID
            }
        });
    }

    async addUserRefreshToken(UserID: string, RefreshToken: string) {
        return await prisma.users.update({
            where: {
                UserID: UserID
            },
            data: {
                RefreshToken: RefreshToken
            }
        });
    }

    async addUsername(UserID: string, Username: string) {
        try {
            return await prisma.users.update({
                where: {
                    UserID: UserID
                },
                data: {
                    Username: Username
                }
            });
        } catch (err: any) {
            if (err.toString().includes('Cannot insert duplicate key')) {
                return {
                    duplicate: true
                }
            }
        }
    }
}