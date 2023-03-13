import styles from '../styles/Dashboard.module.css';
import DataTable from './DataTable';
import Settings from './Settings';
import NowPlaying from './NowPlaying';

export default function Dashboard({ spotifyAuth, setSpotifyAuthenticated }) {
    console.log(spotifyAuth);

    return (
        <div className={styles.dashboard}>
            <h2 className="text-center mb-4">Dashboard</h2>
            <div className="d-flex">
                <div className={styles.tables}>
                    <DataTable />
                    <DataTable />
                    <DataTable />
                    <Settings />
                </div>
                <NowPlaying spotifyAuth={spotifyAuth} setSpotifyAuthenticated={setSpotifyAuthenticated}/>
            </div>
        </div>
    )
}