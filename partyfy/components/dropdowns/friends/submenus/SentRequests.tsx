import { useEffect, useState } from 'react';
import { FaRegTrashAlt } from 'react-icons/fa';

import PartyfyUser from '@/helpers/PartyfyUser';
import { Supabase } from '@/helpers/SupabaseHelper';
import { useAlert } from '@/hooks/useAlert';
import { useNavigationLoader } from '@/hooks/useNavigationLoader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFriendRequestsStore } from '@/stores/useFriendRequestsStore';

const SentRequests = ({ user } : { user : PartyfyUser } ) => {
    const alert = useAlert();
    const { startLoading, stopLoading } = useNavigationLoader();
    // Use Zustand store for sent requests data
    const { sentRequests: usersReturned, isLoadingSent: loading, fetchSentRequests } = useFriendRequestsStore();

    useEffect(() => {
        // Fetch sent requests (will use cache if available)
        fetchSentRequests(user.getUserID());

        Supabase
            .channel('SentRequests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Friends' }, (payload: any) => {
                fetchSentRequests(user.getUserID());
            })
            .subscribe();

        return () => {
            Supabase.channel('SentRequests').unsubscribe();
        }
    }, []);

    // Handle loading states with navigation loader
    useEffect(() => {
        if (loading && usersReturned.length === 0) {
            startLoading();
        } else {
            stopLoading();
        }
    }, [loading, usersReturned, startLoading, stopLoading]);

    async function cancelFriendRequest(FriendUserID: string, FriendUsername: string) {
        let result = await alert.fire({
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
        fetchSentRequests(user.getUserID(), false);
    }

    return (
        <div className="text-white">
            <div className='overflow-y-scroll max-h-[65vh]'>
                {
                    usersReturned.length === 0 || !usersReturned
                    ?
                    <div>
                        <h5 className="text-xl text-center text-white">You have not sent any friend requests.</h5>
                    </div>
                    :
                    usersReturned.map((user, index) => {
                            return (
                                <Card key={index} className="p-2 mt-3 bg-stone-800 border-stone-700">
                                    <div className="flex place-items-center justify-between">
                                        <h5 className="text-lg text-white">{user.Username}</h5>
                                        <Button size="sm" variant="ghost" onClick={() => cancelFriendRequest(user.UserID, user.Username)}><FaRegTrashAlt className='text-red-500' /></Button>
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

export default SentRequests;
