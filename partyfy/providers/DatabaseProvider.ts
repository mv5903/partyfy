export enum TABLES {
    LOGS,
    QUEUE,
    SETTINGS,
    RECENTLY_PLAYED,
}

export default class DatabaseProvider {
    user_id: string;

    constructor(user_id: string) {
        this.user_id = user_id;
    }
}