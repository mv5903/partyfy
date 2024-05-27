import Loading from '@/components/misc/Loading';
import { FriendListScreen } from '@/helpers/FriendListScreen';
import PartyfyUser from '@/helpers/PartyfyUser';
import { Supabase } from '@/helpers/SupabaseHelper';
import { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2/dist/sweetalert2.js';

const List = ({ user, isComponentVisible, setFriendListScreen } : { user : PartyfyUser, isComponentVisible: boolean, setFriendListScreen: Function } ) => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFriends() {
            if (!isComponentVisible) return;
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

    if (loading) {
        return (<Loading/>);
    }

    return (
        <div>
            <h1 className='mt-3 mb-6'>Friends</h1>
            {
                friends.length === 0 || !friends
                ?
                <div>
                    <h5 className="text-xl text-center">You have no friends yet.</h5>
                    <div className='flex justify-center'>
                        <button className='btn btn-primary mt-4' onClick={() => setFriendListScreen(FriendListScreen.Search)}>Add a Friend</button>
                    </div>
                </div>
                :
                friends.map((user, index) => {
                    return (
                        <div key={index} className="card bg-[#222] p-2 mt-3">
                            <div className="flex place-items-center justify-between">
                                <h3 className="text-lg">{user.Username}</h3>
                                <button className="btn btn-sm bg-red-8" onClick={() => removeFriend(user.UserID, user.Username)}><FaTrash /></button>
                            </div>
                        </div>
                    );
                })
            }
        </div>
    );
}

export default List;