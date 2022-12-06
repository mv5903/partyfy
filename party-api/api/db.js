import { SECRETS } from './secrets.js';
import { MongoClient } from 'mongodb';

export class DB {
    connectionString;
    dbName;
    db;

    constructor() {
        this.connectionString = SECRETS.DB_CONN_STRING;
        this.dbName = SECRETS.DB_NAME;
        this.connect();
    }

    async connect() {
        this.db = new MongoClient(this.connectionString);
        await this.db.connect();
    }

    async getSongsPlayed() {
        await this.db.connect();
        return await this.db.db(this.dbName).collection('songs_played').find().toArray();
    }

    async getSongRequests() {
        await this.db.connect();
        return await this.db.db(this.dbName).collection('song_requests').find().toArray();
    }

    async getUsers() {
        await this.db.connect();
        return await this.db.db(this.dbName).collection('users').find().toArray();
    }

    async getAllTables() {
        await this.db.connect();
        const tables = {
            songs_played: await this.getSongsPlayed(),
            song_requests: await this.getSongRequests(),
            users: await this.getUsers()
        };
        return tables;
    }

    async addSongPlayed(song) {
        await this.db.connect();
        await this.db.db(this.dbName).collection('songs_played').insertOne(song.toJSON());
    }

    async addSongRequest(song, user) {
        await this.db.connect();
        await this.db.db(this.dbName).collection('song_requests').insertOne({ song: song.toJSON(), user: user.toJSON() });
    }

    async updateUser(user) {
        await this.db.connect();
        await this.db.db(this.dbName).collection('users').updateOne( { uri: user.uri }, { $set: user.toJSON() });
    }
}

/**
 * Installation
 *
 * Change connection string in .env file
 */