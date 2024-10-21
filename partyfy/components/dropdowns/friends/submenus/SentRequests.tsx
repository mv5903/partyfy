import { useEffect, useState } from 'react';
import { GiCancel } from 'react-icons/gi';

import Loading from '@/components/misc/Loading';
import PartyfyUser from '@/helpers/PartyfyUser';
import { Supabase } from '@/helpers/SupabaseHelper';
import Swal from 'sweetalert2/dist/sweetalert2.js';

const SentRequests = ({ user } : { user : PartyfyUser } ) => {
    const [usersReturned, setUsersReturned] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSentFriendRequests() {
            const response = await fetch('/api/database/friends?UserID=' + user.getUserID() + '&action=sent')
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
                    UserID: user.getUserID(),
                    FriendID: FriendUserID,
                    action: 'DeleteFriendRequest'
                })
            });
        }
    }

    return (
        <div>
            <h1 className='mt-3 mb-6'>Outgoing Requests</h1>
            <div className='overflow-y-scroll max-h-[65vh]'>
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
                                <div key={index} className="card bg-[#222] p-2 mt-3">
                                    <div className="flex place-items-center justify-between">
                                        <h5 className="text-lg">{user.Username}</h5>
                                        <button className="btn btn-sm bg-red-8" onClick={() => cancelFriendRequest(user.UserID, user.Username)}><GiCancel /></button>
                                    </div>
                                </div>
                            );
                        })
                }
            </div>
        </div>
    )
}

export default SentRequests;
