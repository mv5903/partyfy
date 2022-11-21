import Spotify from "./Spotify"
import Wifi from "./Wifi"

export default function Home() {
    return (
        <>
            <div className="home-assistant">
            <div>
                <h1>Welcome!</h1>
            </div>
            <Spotify />
            </div>
            <div className="center">
                <Wifi />
            </div>
        </>
    )
}