import { FaPaperPlane } from 'react-icons/fa';
import { useState } from 'react';
import { UserProfile } from '@auth0/nextjs-auth0/client';
import Swal from 'sweetalert2';

const Search = ({ user } : { user : UserProfile } ) => {
    const [usersReturned, setUsersReturned] = useState([]);

    async function searchUsers(query : string) {
        if (query === '') {
            setUsersReturned([]);
            return;
        }
        const response = await fetch('/api/database/friends?Query=' + query + '&action=search&UserID=' + (user.sub ?? user.user_id));
        let data = await response.json();

        // Don't show yourself in search result
        if (data.length > 0) {
            data = data.filter((users : any) => users.UserID != (user.sub ?? user.user_id));
            setUsersReturned(data);
        }
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
            const response = await fetch('/api/database/friends', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    UserID: user.sub ?? user.user_id,
                    FriendUserID: FriendUserID,
                    action: 'SendFriendReqest'
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
            <input onChange={e => searchUsers(e.target.value)} id="usernameSearch" placeholder="Your friend's username..." type="text" className="form-control me-2"/>
            <div>
                {usersReturned.map((user, index) => {
                    return (
                        <div key={index} className="card bg-dark p-2 mt-3">
                            <div className="d-flex flex-row align-items-center justify-content-between">
                                <h5 className="me-4 mt-2">{user.Username}</h5>
                                <button className="btn btn-small btn-success" onClick={() => sendFriendRequest(user.UserID, user.Username)}><FaPaperPlane className="me-1"/> Send Request</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default Search;