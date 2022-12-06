export class Song {
    id;
    albumart;
    name;
    artists;
    album;
    explicit;
    length;

    constructor(id, albumart, name, artists, album, explicit, length) {
        this.id = id;
        this.albumart = albumart;
        this.name = name;
        this.artists = artists;
        this.album = album;
        this.explicit = explicit;
        this.length = length;
    }

    toJSON() {
        return {
            id: this.id,
            albumart: this.albumart,
            name: this.name,
            artists: this.artists,
            album: this.album,
            explicit: this.explicit,
            length: this.length
        }
    }
}