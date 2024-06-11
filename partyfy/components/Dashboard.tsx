import { useContext, useEffect } from 'react';
import { isMobile } from 'react-device-detect';

import UserContext from '@/providers/UserContext';
import RequestPage from './request/RequestPage';

import Swal from 'sweetalert2/dist/sweetalert2.js';

const Dashboard = ({ isAHost, setIsAHost } : { isAHost: boolean, setIsAHost: Function }) => {
    const { user } = useContext(UserContext);

    useEffect(() => {
        // When user logs in and is redirected to dashboard, we can store the refresh token in the database.
        function storeRefreshToken() {
            fetch('/api/database/users', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    UserID: user.getUserID(),
                    RefreshToken: user.spotifyAuth.refreshToken
                })
            })
        }

        if (user.spotifyAuth.refreshToken) {
            storeRefreshToken();
        }
    }, []);

    useEffect(() => {
        if (!isMobile) {
            if (localStorage.getItem('betterOnMobileNotification') === null) {
                Swal.fire({
                    title: 'Better on Mobile',
                    text: 'Partyfy is designed with mobile in mind. We encourage you to use this site on your mobile device for a better experience.',
                    icon: 'info',
                    confirmButtonText: 'Ok'
                });
                localStorage.setItem('betterOnMobileNotification', "true");
            }
        }
        // Update last_login column in database
        fetch('/api/database/users', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                UserID: user.getUserID(),
                last_login: true
            })
        })
            .then(res => res.json())
            .catch(err => console.log(err));
    }, []);

    return (
        // <>
        // {
        //      isAHost && !isMobile && 
        //      <>  
        //         <div>
        //             <h3 className="text-center mb-2"><i>Dashboard</i></h3>
        //             <div className="flex flex-row justify-between">
        //                 <div className="flex flex-row justify-between">
        //                     <DataTable title="Queue"/>
        //                     <DataTable title="Recently Played" />
        //                 </div>
        //                 <NowPlaying setIsAHost={setIsAHost} />
        //             </div>
        //         </div>
        //      </>
        // }
        // {
        //     (isAHost === false || isMobile) &&
        //     <>
                <div>
                    <RequestPage />
                </div>
        //      </>
        // }
        // {
        //     isAHost === null && !isMobile &&
        //     <>
        //         <div>
        //             <h3 className="text-center p-4" style={{ marginTop: '20vh' }}>What would you like to do next?</h3>
        //             <div className="flex flex-row justify-center gap-4 m-4">
        //                 <button className="btn btn-secondary disable">Host a Party (coming soon)</button>
        //                 <button className="btn btn-success" onClick={() => setIsAHost(false)}>Request Music</button>
        //             </div>
        //         </div>
        //     </>
        // }
        // </>
    )
}

export default Dashboard;
