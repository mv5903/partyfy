import styles from '../styles/Dashboard.module.css';
import DataTable from './DataTable';
import Settings from './Settings';
import NowPlaying from './NowPlaying';
import { useContext } from 'react';
import UserContext from '../pages/providers/UserContext';

export default function Dashboard() {
    console.log(UserContext);

    const {
        spotifyAuth,
        user
    } = useContext(UserContext);
    return (
        <div className={styles.dashboard}>
            <h2 className="text-center mb-4">Dashboard</h2>
            <div className="d-flex">
                <div className={styles.tables}>
                    <DataTable title="Queue"/>
                    <DataTable title="Recently Played" />
                    <DataTable title="Log" />
                    <Settings />
                </div>
                <NowPlaying />
            </div>
        </div>
    )
}