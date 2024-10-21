import { useContext, useEffect } from 'react';
import { isMobile } from 'react-device-detect';

import UserContext from '@/providers/UserContext';
import RequestPage from './request/RequestPage';

import Swal from 'sweetalert2/dist/sweetalert2.js';

const Dashboard = () => {
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

    return <RequestPage />;
}

export default Dashboard;
