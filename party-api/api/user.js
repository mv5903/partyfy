export class User {
    uri;
    name;
    username;
    image;
    numSongsRequested;

    constructor(uri, name, username, image) {
        this.uri = uri;
        this.name = name;
        this.username = username;
        this.image = image;
        this.numSongsRequested = 0;
    }

    toJSON() {
        return {
            uri: this.uri,
            name: this.name,
            username: this.username,
            image: this.image,
            numSongsRequested: this.numSongsRequested
        }
    }
}