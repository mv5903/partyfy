import styles from '../styles/Dashboard.module.css';
import DataTable from './DataTable';
import Settings from './Settings';
import NowPlaying from './NowPlaying';
import { useContext, useEffect, useState } from 'react';
import UserContext from '../pages/providers/UserContext';

export default function Dashboard() {
    const {
        spotifyAuth,
        user
    } = useContext(UserContext);

    const [isAHost, setIsAHost] = useState(null);

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
        <>
        {
             isAHost &&
             <>  
                <div className={styles.dashboard}>
                    <h3 className="text-center mb-4"><i>Dashboard</i></h3>
                    <div className="d-flex flex-row justify-content-between">
                        <div className={styles.tables}>
                            <DataTable title="Queue"/>
                            <DataTable title="Recently Played" />
                        </div>
                        <NowPlaying setIsAHost={setIsAHost} />
                    </div>
                </div>
             </>
        }
        {
            isAHost === false &&
            <>
                <div className={styles.dashboard}>
                    <h3 className="text-center mb-4"><i>Dashboard</i></h3>
                    <div className="d-flex flex-row justify-content-between">
                        User wants to request music 
                    </div>
                </div>
             </>
        }
        {
            isAHost === null &&
            <>
                <div className={styles.dashboard}>
                    <h3 className="text-center mb-4">What would you like to do next?</h3>
                    <div className="d-flex flex-row justify-content-between">
                        <button className="btn btn-success" onClick={() => setIsAHost(true)}>Host a Party</button>
                        <button className="btn btn-success" onClick={() => setIsAHost(false)}>Request Music</button>
                    </div>
                </div>
            </>
        }
        </>
        
    )
}