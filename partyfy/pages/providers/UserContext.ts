import Database from "@/database/db";
import { UserProfile } from "@auth0/nextjs-auth0/client";
import { createContext } from "react";
import { SpotifyAuth } from "../helpers/SpotifyAuth";


let x: {spotifyAuth: SpotifyAuth | undefined, user: UserProfile | undefined, username: string | undefined } = 
{
    spotifyAuth: new SpotifyAuth(''),
    user: undefined,
    username: undefined
} 

const UserContext = createContext(x);

export default UserContext;
