import { FaPaperPlane } from 'react-icons/fa';
import { useState } from 'react';
import { UserProfile } from '@auth0/nextjs-auth0/client';
import { getUserID } from '@/helpers/Utils';
import Swal from 'sweetalert2';
import Loading from '@/components/misc/Loading';

const Search = ({ user } : { user : UserProfile } ) => {
    const [usersReturned, setUsersReturned] = useState([]);
    const [loading, setLoading] = useState(false);

    async function searchUsers(query : string) {
        setLoading(true);
        if (query === '') {
            setLoading(false);
            setUsersReturned([]);
            return;
        }
        const response = await fetch('/api/database/friends?Query=' + query + '&action=search&UserID=' + getUserID(user));
        let data = await response.json();

        // Don't show yourself in search result
        if (data.length > 0) {
            data = data.filter((users : any) => users.UserID != getUserID(user));
            setUsersReturned(data);
        }
        setLoading(false);
    }

    async function sendFriendRequest(FriendUserID: string, FriendUsername: string) {
        let choice = await Swal.fire({
            title: 'Friend Request',
            text: `Send a friend request to ${FriendUsername}?`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes'
        });

        if (choice.isConfirmed) {
            Swal.fire({
                title: 'Sending friend request...',
                timerProgressBar: true,
                didOpen: () => {
                    Swal.showLoading()
                }
            });
            const response = await fetch('/api/database/friends', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    UserID: getUserID(user),
                    FriendUserID: FriendUserID,
                    action: 'SendFriendRequest'
                })
            });
            if (response.ok) {
                await Swal.fire({
                    title: 'Success',
                    text: `Friend request sent to ${FriendUsername} successfully.`,
                    icon: 'success'
                });
            }
        }
    }

    return (
        <div>
            <input onChange={e => searchUsers(e.target.value)} id="usernameSearch" placeholder="Your friend's username..." type="text" className="form-control me-2 w-full p-2"/>
            <div>
                {!loading && usersReturned.map((user, index) => {
                    return (
                        <div key={index} className="card bg-gray-800 p-2 mt-3">
                            <div className="flex align-center justify-between">
                                <h5 className="text-xl me-4 mt-2">{user.Username}</h5>
                                <button className="btn btn-small btn-success" onClick={() => sendFriendRequest(user.UserID, user.Username)}><FaPaperPlane className="me-1"/> Send Request</button>
                            </div>
                        </div>
                    );
                })}
                {
                    loading && <Loading />
                }
            </div>
        </div>
    )
}

export default Search;