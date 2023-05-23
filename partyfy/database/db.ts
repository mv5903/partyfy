import * as sql from 'mssql';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default class Database {
    initialized: boolean = false;
    config: sql.config;

    constructor(config: sql.config) {
        this.config = config;
        this.connect();
    }

    async connect() {
        try {
            await sql.connect(this.config);
            this.initialized = true;
        } catch (err) {
            console.error(err);
        }
    }

    async getRecentsSchema() {
        try {
            if (this.initialized) {
                return await sql.query`SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Recents'`;
            }
        } catch (err) {
            console.error(err);
        }
    }

    async getRecentSongs(OwnerUserID: string){
        try {
            if (this.initialized) {
                return await prisma.recents.findMany();
                //return await sql.query`SELECT SongName, SongArtist, SongAlbum, PlayedAt, SongExplicit, SongArt, OwnerUserID, SongID FROM Recents WHERE OwnerUserID = ${OwnerUserID} ORDER BY PlayedAt DESC`;
            }
        } catch (err) {
            console.error(err);
        }
    }

    async insertRecentSong(OwnerUserID: string, SongID: string, SongName: string, SongArtist: string, SongAlbum: string, SongArt: string, SongExplicit: boolean) {
        try {
            if (this.initialized) {
                //return await sql.query`INSERT INTO Recents (OwnerUserID, PlayedAt, SongID, SongName, SongArtist, SongAlbum, SongArt, SongExplicit) VALUES (${OwnerUserID}, CURRENT_TIMESTAMP, ${SongID}, ${SongName}, ${SongArtist}, ${SongAlbum}, ${SongArt}, ${SongExplicit})`;
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
                })
            }
            throw new Error('Database not initialized');
        } catch (err) {
            console.error(err);
        }
    }

    async deleteRecentSong(OwnerUserID: string) {
        try {
            if (this.initialized) {
                return await sql.query`DELETE FROM Recents WHERE OwnerUserID = ${OwnerUserID}`;
            }
            throw new Error('Database not initialized');
        } catch (err) {
            console.error(err);
        }
    }

    async getUser(UserID: string) {
        try {
            if (this.initialized) {
                return await sql.query`SELECT * FROM Users WHERE UserID = ${UserID}`;
            }
            throw new Error('Database not initialized');
        } catch (err) {
            console.error(err);
        }
    }

    async addNewUser(UserID: string) {
        try {
            if (this.initialized) {
                return await sql.query`INSERT INTO Users (UserID) VALUES (${UserID})`;
            }
            throw new Error('Database not initialized');
        } catch (err) {
            console.error(err);
        }
    }

    async addUserRefreshToken(UserID: string, RefreshToken: string) {
        try {
            if (this.initialized) {
                return await sql.query`UPDATE Users SET RefreshToken = ${RefreshToken} WHERE UserID = ${UserID}`;
            }
            throw new Error('Database not initialized');
        } catch (err) {
            console.error(err);
        }
    }

    async addUsername(UserID: string, Username: string) {
        try {
            if (this.initialized) {
                return await sql.query`UPDATE Users SET Username = ${Username} WHERE UserID = ${UserID}`;
            }
            throw new Error('Database not initialized');
        } catch (err: any) {
            if (err.toString().includes('Cannot insert duplicate key')) {
                return {
                    duplicate: true
                }
            }
        }
    }
}