import Loading from '@/components/misc/Loading';
import { FriendListScreen } from '@/helpers/FriendListScreen';
import PartyfyUser from '@/helpers/PartyfyUser';
import { Supabase } from '@/helpers/SupabaseHelper';
import { useEffect, useState } from 'react';
import { FaPlus, FaRegTrashAlt, FaTrash, FaTrashAlt } from 'react-icons/fa';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const List = ({ user, setFriendListScreen } : { user : PartyfyUser, setFriendListScreen: Function } ) => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFriends() {
            const response = await fetch('/api/database/friends?UserID=' + user.getUserID())
            const data = await response.json();
            setLoading(false);
            setFriends(data);
        }

        fetchFriends();
        Supabase
            .channel('List')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Friends' }, (payload: any) => {
                fetchFriends();
            })
            .subscribe();

        return () => {
            Supabase.channel('List').unsubscribe();
        }
    }, []);

    function removeFriend(FriendUserID: string, FriendUsername: string) {
        Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to remove ${FriendUsername} from your friends list?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Remove',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch('/api/database/friends', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        UserID: user.getUserID(),
                        FriendUserID: FriendUserID,
                        action: 'DeleteFriend'
                    }) 
                }).then(response => {
                    if (response.status === 200) {
                        Swal.fire({
                            title: 'Success!',
                            text: `You have removed ${FriendUsername} from your friends list.`,
                            icon: 'success'
                        });
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: `You have not removed ${FriendUsername} from your friends list.`,
                            icon: 'error'
                        });
                    }
                });
            }
        });
    }
    
    return (
        <div className="text-white">
            <h1 className='mt-3 mb-6 text-xl font-semibold'>Friends</h1>
            {
                loading
                ?
                <Loading />
                :
                <div className='overflow-y-scroll max-h-[65vh]'>
                    {
                        friends.length === 0 || !friends
                        ?
                        <div>
                            <h5 className="text-xl text-center text-white">You have no friends yet.</h5>
                            <div className='flex justify-center'>
                                <Button className='mt-4' onClick={() => setFriendListScreen(FriendListScreen.Search)}><FaPlus className="mr-2" /> Add Friends</Button>
                            </div>
                        </div>
                        :
                        friends.map((user, index) => {
                            return (
                                <Card key={index} className="p-2 mt-3 bg-stone-800 border-stone-700">
                                    <div className="flex place-items-center justify-between">
                                        <h3 className="text-lg text-white">{user.Username}</h3>
                                        <Button size="sm" variant="ghost" onClick={() => removeFriend(user.UserID, user.Username)}><FaRegTrashAlt className='text-red-500' /></Button>
                                    </div>
                                </Card>
                            );
                        })
                    }
                </div>
            }
        </div>
    );
}

export default List;