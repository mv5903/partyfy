import styles from '../styles/Dashboard.module.css';
import DataTable from './DataTable';
import Settings from './Settings';
import NowPlaying from './NowPlaying';
import { useContext, useEffect } from 'react';
import UserContext from '../pages/providers/UserContext';

export default function Dashboard() {
    const {
        spotifyAuth,
        user
    } = useContext(UserContext);

    useEffect(() => {
        // When user logs in and is redirected to dashboard, we can store the refresh token in the database.
        function storeRefreshToken() {
            fetch('/api/database/users', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    UserID: user.sub ?? user.user_id,
                    RefreshToken: spotifyAuth.refreshToken
                })
            })
        }

        if (spotifyAuth.refreshToken) {
            storeRefreshToken();
        }
    }, []);

    return (
        <div className={styles.dashboard}>
            <h3 className="text-center mb-4"><i>Dashboard</i></h3>
            <div className="d-flex flex-row justify-content-between">
                <div className={styles.tables}>
                    <DataTable title="Queue"/>
                    <DataTable title="Recently Played" />
                </div>
                <NowPlaying />
            </div>
        </div>
    )
}