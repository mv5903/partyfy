import PartyfyUser from '@/helpers/PartyfyUser';
import { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { useAlert } from '@/hooks/useAlert';
import { useNavigationLoader } from '@/hooks/useNavigationLoader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const Search = ({ user } : { user : PartyfyUser } ) => {
    const alert = useAlert();
    const { startLoading, stopLoading } = useNavigationLoader();
    const [usersReturned, setUsersReturned] = useState([]);

    async function searchUsers(query : string) {
        startLoading();
        if (query === '') {
            stopLoading();
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
        stopLoading();
    }

    async function sendFriendRequest(FriendUserID: string, FriendUsername: string) {
        let choice = await alert.fire({
            title: 'Friend Request',
            html: `Send a friend request to <strong>${FriendUsername}</strong>?`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Yes'
        });

        if (choice.isConfirmed) {
            startLoading();
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
            stopLoading();
            if (response.ok) {
                await alert.fire({
                    title: 'Success',
                    text: `Friend request sent to ${FriendUsername} successfully.`,
                    icon: 'success'
                });
            }
        }
    }

    return (
        <div className="text-white">
            <div className='flex justify-center w-3/4 mx-auto'>
                <Input onChange={e => searchUsers(e.target.value)} id="usernameSearch" placeholder="Your friend's username..." type="text" className="bg-stone-800 border-stone-700 text-white"/>
            </div>
            <div>
                {usersReturned.map((user, index) => {
                    return (
                        <Card key={index} className="p-2 mt-3 bg-stone-800 border-stone-700">
                            <div className="flex place-items-center justify-between">
                                <h5 className="text-lg text-white">{user.Username}</h5>
                                <Button size="sm" onClick={() => sendFriendRequest(user.UserID, user.Username)}><FaPaperPlane /></Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
            <alert.AlertComponent />
        </div>
    )
}

export default Search;