import { GiCancel } from 'react-icons/gi';
import { useEffect, useState } from 'react';
import { UserProfile } from '@auth0/nextjs-auth0/client';
import { getUserID } from '@/helpers/Utils';

import Swal from 'sweetalert2/dist/sweetalert2.js';
import Loading from '@/components/misc/Loading';
import { Supabase } from '@/helpers/SupabaseHelper';

const SentRequests = ({ user } : { user : UserProfile } ) => {
    const [usersReturned, setUsersReturned] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSentFriendRequests() {
            const response = await fetch('/api/database/friends?UserID=' + getUserID(user) + '&action=sent')
            const data = await response.json();
            if (data) {
                setLoading(false);
                setUsersReturned(data);
            }
        }
        
        loadSentFriendRequests();
        Supabase
            .channel('SentRequests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Friends' }, (payload: any) => {
                loadSentFriendRequests();
            })
            .subscribe();

        return () => {
            Supabase.channel('SentRequests').unsubscribe();
        }
    }, []);

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
                    UserID: getUserID(user),
                    FriendID: FriendUserID,
                    action: 'DeleteFriendRequest'
                })
            });
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
                        <h5 className="text-xl text-center">You have not sent any friend requests.</h5>
                    </div>
                    :
                    usersReturned.map((user, index) => {
                        return (
                            <div key={index} className="card bg-gray-800 p-2 mt-3">
                                <div className="flex place-items-center justify-between">
                                    <h5 className="text-lg">{user.Username}</h5>
                                    <button className="btn btn-sm bg-red-8" onClick={() => cancelFriendRequest(user.UserID, user.Username)}><GiCancel /></button>
                                </div>
                            </div>
                        );
                    })
            }
        </div>
    )
}

export default SentRequests;
