import { useContext, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { getUserID } from '@/helpers/Utils';

import DataTable from './host/DataTable';
import NowPlaying from './host/NowPlaying';
import UserContext from '@/providers/UserContext';
import RequestPage from './request/RequestPage';

import styles from '@/styles/Dashboard.module.css';

const Dashboard = ({ isAHost, setIsAHost } : { isAHost: boolean, setIsAHost: Function }) => {
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
                    UserID: getUserID(user),
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
             isAHost && !isMobile && 
             <>  
                <div className={styles.dashboard}>
                    <h3 className="text-center mb-2"><i>Dashboard</i></h3>
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
            (isAHost === false || isMobile) &&
            <>
                <div className={styles.dashboard}>
                    <RequestPage />
                </div>
             </>
        }
        {
            isAHost === null && !isMobile &&
            <>
                <div className={styles.dashboard}>
                    <h3 className="text-center p-4" style={{ marginTop: '20vh' }}>What would you like to do next?</h3>
                    <div className="d-flex flex-row justify-content-center gap-4 m-4">
                        <button className="btn btn-secondary disable">Host a Party (coming soon)</button>
                        <button className="btn btn-success" onClick={() => setIsAHost(false)}>Request Music</button>
                    </div>
                </div>
            </>
        }
        </>
    )
}

export default Dashboard;
