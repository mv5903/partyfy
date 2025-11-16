import Loading from '@/components/misc/Loading';
import PartyfyUser from '@/helpers/PartyfyUser';
import { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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
        <div className="text-white">
            <h1 className='mt-3 mb-6 text-xl font-semibold'>Find Someone</h1>
            <div className='flex justify-center'>
                <Input onChange={e => searchUsers(e.target.value)} id="usernameSearch" placeholder="Your friend's username..." type="text" className="bg-stone-800 border-stone-700 text-white"/>
            </div>
            <div>
                {!loading && usersReturned.map((user, index) => {
                    return (
                        <Card key={index} className="p-2 mt-3 bg-stone-800 border-stone-700">
                            <div className="flex place-items-center justify-between">
                                <h5 className="text-lg text-white">{user.Username}</h5>
                                <Button size="sm" onClick={() => sendFriendRequest(user.UserID, user.Username)}><FaPaperPlane /></Button>
                            </div>
                        </Card>
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