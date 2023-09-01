import { FaCheckCircle } from 'react-icons/fa';
import { GiCancel } from 'react-icons/gi';
import { useEffect, useState } from 'react';
import { UserProfile } from '@auth0/nextjs-auth0/client';
import { getUserID } from '@/helpers/Utils';

import Swal from 'sweetalert2/dist/sweetalert2.js';
import Loading from '@/components/misc/Loading';
import { Supabase } from '@/helpers/SupabaseHelper';

const IncomingRequests = ({ user } : { user : UserProfile } ) => {
    const [usersReturned, setUsersReturned] = useState([]);
    const [loading, setLoading] = useState(true);

    async function fetchRequests() {
        const response = await fetch('/api/database/friends?UserID=' + getUserID(user) + '&action=requests')
        const data = await response.json();
        if (data) {
            setLoading(false);
            setUsersReturned(data);
        }
    }

    useEffect(() => {
        fetchRequests();
        Supabase
            .channel('IncomingRequests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Friends' }, (payload: any) => {
                fetchRequests();
            })
            .subscribe();

        return () => {
            Supabase.channel('IncomingRequests').unsubscribe();
        }
    }, []);

    async function deleteIncomingRequest(FriendUserID: string, FriendUsername: string) {
        let result = await Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to delete your friend request from ${FriendUsername}?`,
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
        fetchRequests();
    }

    async function acceptIncomingRequest(FriendUserID: string, FriendUsername: string) {
        let result = await Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to accept the friend request from ${FriendUsername}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        });

        if (result.isConfirmed) {
            await fetch('/api/database/friends', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    UserID: getUserID(user),
                    FriendID: FriendUserID,
                    action: 'AcceptFriendRequest'
                })
            });
        }
        fetchRequests();
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
                    <h5 className="text-xl text-center">You have no incoming friend requests.</h5>
                </div>
                :
                usersReturned.map((user, index) => {
                    return (
                        <div key={index} className="card bg-gray-800 p-2 mt-3">
                            <div className="flex align-center justify-between">
                                <h5 className="text-xl mr-4 mt-2">{user.Username}</h5>
                                <div className="flex align-center">
                                    <button className="btn btn-small bg-green-8 me-2 mt-1" onClick={() => acceptIncomingRequest(user.UserID, user.Username)}><FaCheckCircle /></button>
                                    <button className="btn btn-small bg-red-8 mt-1" onClick={() => deleteIncomingRequest(user.UserID, user.Username)}><GiCancel /></button>
                                </div>
                            </div>
                        </div>
                    );
                })
        }
    </div>
    )
}

export default IncomingRequests;