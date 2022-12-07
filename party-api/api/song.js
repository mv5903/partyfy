export class Song {
    Album_Art;
    Name;
    Artist;
    Album;
    Length;
    Explicit;
    ID;

    constructor(id, albumart, name, artists, album, explicit, length) {
        this.ID = id;
        this.Album_Art = albumart;
        this.Name = name;
        this.artists = artists;
        this.Album = album;
        this.Explicit = explicit;
        this.Length = length;
    }

    toJSON() {
        return {
            ID: this.ID,
            Album_Art: this.Album_Art,
            Name: this.Name,
            Artists: this.artists,
            Album: this.Album,
            Explicit: this.Explicit === 'true',
            Length: parseInt(this.Length)
        }
    }
}