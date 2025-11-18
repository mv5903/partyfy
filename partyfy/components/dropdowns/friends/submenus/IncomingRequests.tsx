import { useEffect, useState } from 'react';
import { FaCheckCircle, FaRegCheckCircle, FaRegTrashAlt } from 'react-icons/fa';

import Loading from '@/components/misc/Loading';
import PartyfyUser from '@/helpers/PartyfyUser';
import { Supabase } from '@/helpers/SupabaseHelper';
import { useAlert } from '@/hooks/useAlert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFriendRequestsStore } from '@/stores/useFriendRequestsStore';

const IncomingRequests = ({ user } : { user : PartyfyUser } ) => {
    const alert = useAlert();
    // Use Zustand store for incoming requests data
    const { incomingRequests: usersReturned, isLoadingIncoming: loading, fetchIncomingRequests } = useFriendRequestsStore();

    useEffect(() => {
        // Fetch incoming requests (will use cache if available)
        fetchIncomingRequests(user.getUserID());

        Supabase
            .channel('IncomingRequests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Friends' }, (payload: any) => {
                fetchIncomingRequests(user.getUserID());
            })
            .subscribe();

        return () => {
            Supabase.channel('IncomingRequests').unsubscribe();
        }
    }, []);

    async function deleteIncomingRequest(FriendUserID: string, FriendUsername: string) {
        let result = await alert.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to delete your friend request from ${FriendUsername}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        });
        alert.showLoading();

        if (result.isConfirmed) {
            let response = await fetch('/api/database/friends', {
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
            let data = await response.json();
            if (response.status !== 200) {
                alert.fire({
                    title: 'Error',
                    text: data.message || 'An error occurred while deleting the friend request.',
                    icon: 'error'
                });
                return;
            }
        }
        fetchIncomingRequests(user.getUserID());
        alert.fire({
            title: 'Friend request deleted',
            icon: 'success'
        })
    }

    async function acceptIncomingRequest(FriendUserID: string, FriendUsername: string) {
        let result = await alert.fire({
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
                    UserID: user.getUserID(),
                    FriendID: FriendUserID,
                    action: 'AcceptFriendRequest'
                })
            });
        }
        fetchIncomingRequests(user.getUserID(), false);
    }

    return (
        <div className="text-white">
            <h1 className='mt-3 mb-6 text-xl font-semibold'>Incoming Requests</h1>
            <div className='overflow-y-scroll max-h-[65vh]'>
            {
                loading && usersReturned.length === 0
                ?
                <Loading />
                :
                    usersReturned.length === 0 || !usersReturned
                    ?
                    <div>
                        <h5 className="text-xl text-center text-white">You have no incoming friend requests.</h5>
                    </div>
                    :
                    usersReturned.map((user, index) => {
                        return (
                            <Card key={index} className="p-2 mt-3 bg-stone-800 border-stone-700">
                                <div className="flex place-items-center justify-between">
                                    <h5 className="text-lg text-white">{user.Username}</h5>
                                    <div className="flex align-center gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => acceptIncomingRequest(user.UserID, user.Username)}><FaRegCheckCircle className='text-green-500' /></Button>
                                        <Button size="sm" variant="ghost" onClick={() => deleteIncomingRequest(user.UserID, user.Username)}><FaRegTrashAlt className='text-red-500' /></Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
            }
            </div>
            <alert.AlertComponent />
    </div>
    )
}

export default IncomingRequests;