import { FaTrash } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { UserProfile } from '@auth0/nextjs-auth0/client';
import Swal from 'sweetalert2';

const List = ({ user, isComponentVisible } : { user : UserProfile, isComponentVisible: boolean } ) => {
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        async function fn() {
            if (!isComponentVisible) return;
            const response = await fetch('/api/database/friends?UserID=' + (user.sub ?? user.user_id))
            const data = await response.json();
            setFriends(data);
        }

        fn();
        const interval = setInterval(fn, 2000);
        return () => clearInterval(interval);
    }, [user]);

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
                        UserID: user.sub ?? user.user_id,
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
        <div>
            {
                friends.length === 0 || !friends
                ?
                <div>
                    <h5 className="text-center">You have no friends yet.</h5>
                </div>
                :
                friends.map((user, index) => {
                    return (
                        <div key={index} className="card bg-dark p-2 mt-3">
                            <div className="d-flex flex-row align-items-center justify-content-between">
                                <h5 className="me-4 mt-2">{user.Username}</h5>
                                <button className="btn btn-small btn-danger" onClick={() => removeFriend(user.UserID, user.Username)}><FaTrash className="me-1 mb-1"/></button>
                            </div>
                        </div>
                    );
                })
            }
        </div>
    );
}

export default List;