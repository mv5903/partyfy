import { FriendListScreen } from '@/helpers/FriendListScreen';
import PartyfyUser from '@/helpers/PartyfyUser';
import { Supabase } from '@/helpers/SupabaseHelper';
import { useEffect } from 'react';
import { FaPlus, FaRegTrashAlt } from 'react-icons/fa';
import { useAlert } from '@/hooks/useAlert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFriendsStore } from '@/stores/useFriendsStore';

const List = ({ user, setFriendListScreen } : { user : PartyfyUser, setFriendListScreen: Function } ) => {
    const alert = useAlert();
    // Use Zustand store for friends data
    const { friends, isLoading, fetchFriends } = useFriendsStore();

    useEffect(() => {
        // Fetch friends (will use cache if available)
        fetchFriends(user.getUserID());

        Supabase
            .channel('List')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Friends' }, (payload: any) => {
                fetchFriends(user.getUserID());
            })
            .subscribe();

        return () => {
            Supabase.channel('List').unsubscribe();
        }
    }, []);

    async function removeFriend(FriendUserID: string, FriendUsername: string) {
        const result = await alert.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to remove ${FriendUsername} from your friends list?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Remove',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            const response = await fetch('/api/database/friends', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    UserID: user.getUserID(),
                    FriendUserID: FriendUserID,
                    action: 'DeleteFriend'
                })
            });

            if (response.status === 200) {
                await alert.fire({
                    title: 'Success!',
                    text: `You have removed ${FriendUsername} from your friends list.`,
                    icon: 'success'
                });
            } else {
                await alert.fire({
                    title: 'Error!',
                    text: `You have not removed ${FriendUsername} from your friends list.`,
                    icon: 'error'
                });
            }
        }
        fetchFriends(user.getUserID());
    }

    return (
        <div className="text-white">
            <div className='overflow-y-scroll max-h-[65vh]'>
                {isLoading && friends.length === 0 ? (
                    <>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Card key={i} className="p-2 mt-3 bg-stone-900 border-stone-700">
                                <div className="flex place-items-center justify-between">
                                    <Skeleton className="h-5 w-32 bg-stone-700" />
                                    <Skeleton className="h-8 w-8 bg-stone-700" />
                                </div>
                            </Card>
                        ))}
                    </>
                ) : friends.length === 0 || !friends ? (
                    <div>
                        <h5 className="text-xl text-center text-white">You have no friends yet.</h5>
                        <div className='flex justify-center'>
                            <Button className='mt-4 bg-white text-black' onClick={() => setFriendListScreen(FriendListScreen.Search)}><FaPlus className="mr-2" /> Add Friends</Button>
                        </div>
                    </div>
                ) : (
                    friends.map((user, index) => {
                        return (
                            <Card key={index} className="p-2 mt-3 bg-stone-900 border-stone-700">
                                <div className="flex place-items-center justify-between">
                                    <h3 className="text-lg text-white">{user.Username}</h3>
                                    <Button size="sm" variant="ghost" onClick={() => removeFriend(user.UserID, user.Username)}><FaRegTrashAlt className='text-red-500' /></Button>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
            <alert.AlertComponent />
        </div>
    );
}

export default List;