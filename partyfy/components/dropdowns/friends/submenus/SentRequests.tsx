import { GiCancel } from 'react-icons/gi';
import { useEffect, useState } from 'react';
import { UserProfile } from '@auth0/nextjs-auth0/client';

import Swal from 'sweetalert2';
import Loading from '@/components/misc/Loading';

const SentRequests = ({ user } : { user : UserProfile } ) => {
    const [usersReturned, setUsersReturned] = useState([]);
    const [loading, setLoading] = useState(true);

    async function loadSentFriendRequests() {
        const response = await fetch('/api/database/friends?UserID=' + (user.sub ?? user.user_id) + '&action=sent')
        const data = await response.json();
        if (data) {
            setLoading(false);
            setUsersReturned(data);
        }
    }
    
    useEffect(() => { 
        const interval = setInterval(loadSentFriendRequests, 2000);
        return () => clearInterval(interval);
    }, [user]);

    async function cancelFriendRequest(FriendUserID: string, FriendUsername: string) {
        let result = await Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to cancel your friend request to ${FriendUsername}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        });

        if (result.isConfirmed) {
            await fetch('/api/database/friends', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    UserID: user.sub ?? user.user_id,
                    FriendID: FriendUserID,
                    action: 'DeleteFriendRequest'
                })
            });
            loadSentFriendRequests();
        }
    }

    return (
        <div>
            {
                loading 
                ?
                <Loading />
                :
                    usersReturned.length === 0 || !usersReturned
                    ?
                    <div>
                        <h5 className="text-center">You have no sent friend requests.</h5>
                    </div>
                    :
                    usersReturned.map((user, index) => {
                        return (
                            <div key={index} className="card bg-dark p-2 mt-3">
                                <div className="d-flex flex-row align-items-center justify-content-between">
                                    <h5 className="me-4 mt-2">{user.Username}</h5>
                                    <button className="btn btn-small btn-danger" onClick={() => cancelFriendRequest(user.UserID, user.Username)}><GiCancel className="me-1 mb-1"/>Cancel</button>
                                </div>
                            </div>
                        );
                    })
            }
        </div>
    )
}

export default SentRequests;