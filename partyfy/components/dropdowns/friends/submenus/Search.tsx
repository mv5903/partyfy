import Loading from '@/components/misc/Loading';
import PartyfyUser from '@/helpers/PartyfyUser';
import { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import Swal from 'sweetalert2/dist/sweetalert2.js';

const Search = ({ user } : { user : PartyfyUser } ) => {
    const [usersReturned, setUsersReturned] = useState([]);
    const [loading, setLoading] = useState(false);

    async function searchUsers(query : string) {
        setLoading(true);
        if (query === '') {
            setLoading(false);
            setUsersReturned([]);
            return;
        }
        const response = await fetch('/api/database/friends?Query=' + query + '&action=search&UserID=' + user.getUserID());
        let data = await response.json();

        // Don't show yourself in search result
        if (data.length > 0) {
            data = data.filter((users : any) => users.UserID != user.getUserID());
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
                    UserID: user.getUserID(),
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
            <h1 className='mt-3 mb-6'>Find Someone</h1>
            <div className='flex justify-center'>
                <input onChange={e => searchUsers(e.target.value)} id="usernameSearch" placeholder="Your friend's username..." type="text" className="textarea textarea-primary me-2 w-full p-2"/>
            </div>
            <div>
                {!loading && usersReturned.map((user, index) => {
                    return (
                        <div key={index} className="card bg-primary p-2 mt-3">
                            <div className="flex place-items-center justify-between">
                                <h5 className="text-lg">{user.Username}</h5>
                                <button className="btn btn-sm btn-success" onClick={() => sendFriendRequest(user.UserID, user.Username)}><FaPaperPlane className="me-1"/> Send Request</button>
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