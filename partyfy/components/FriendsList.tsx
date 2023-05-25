import { FaUserFriends, FaPaperPlane } from 'react-icons/fa';
import { IoMdArrowDropdown } from 'react-icons/io';
import { useContext, useEffect, useState } from 'react';
import UserContext from '../pages/providers/UserContext';
import { UserProfile } from '@auth0/nextjs-auth0/client';

import styles from '@/styles/FriendsList.module.css'
import { isMobile } from 'react-device-detect';
import Swal from 'sweetalert2';

const FriendsList = () => {

    enum FriendListScreen {
        Friends,
        Requests,
        Sent,
        Search
    }

    const [visible, setVisible] = useState(false);
    const [friendListScreen, setFriendListScreen] = useState(FriendListScreen.Friends);

    const {
        spotifyAuth,
        user
    } = useContext(UserContext);

    const isNumeric = (val: any) : boolean => {
        return !isNaN(Number(val));
     }

    const currentFriendListScreen = () => {
        switch (friendListScreen) {
            case FriendListScreen.Friends:
                return <FriendsList_Friends user={user} />
            case FriendListScreen.Requests:
                return <FriendsList_Requests user={user} />
            case FriendListScreen.Sent:
                return <FriendsList_Sent user={user} />
            case FriendListScreen.Search:
                return <FriendsList_Search user={user} />
        }
    }

    return (
        <div className="me-2 d-flex flex-row align-items-center">
            <div onClick={() => setVisible(!visible)}>
                <FaUserFriends size={45} className="mb-1" />
                <IoMdArrowDropdown size={25} className="mb-1 ms-1" />
            </div>
            {
                visible && 
                <div className={styles.friendsMenu} style={{ top: isMobile ? '7vh' : '22vh' }}>
                    <select onChange={e => setFriendListScreen(FriendListScreen[e.target.value as keyof typeof FriendListScreen])}>
                        {Object.values(FriendListScreen).filter(i => !isNumeric(i)).map((header, index) => {
                            return <option key={index} value={header}>{header}</option>
                        })}
                    </select>
                    { currentFriendListScreen() }
                </div>
            }
        </div>
    );
}

const FriendsList_Friends = ({ user } : { user : UserProfile } ) => {
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        async function fn() {
            const response = await fetch('/api/database/friends?UserID=' + (user.sub ?? user.user_id))
            const data = await response.json();
            console.log(data);
            setFriends(data);
        }

        fn();
    }, [user])

    return (
        <div>
            {
                friends.length === 0 || !friends
                ?
                <div>
                    <h5 className="text-center">You have no friends yet.</h5>
                </div>
                :
                <div>

                </div>
            }
        </div>
    );
}
const FriendsList_Requests = ({ user } : { user : UserProfile } ) => {
    return (
        <div>
            
        </div>
    )
}
const FriendsList_Sent = ({ user } : { user : UserProfile } ) => {
    return (
        <p>sent</p>
    )
}
const FriendsList_Search = ({ user } : { user : UserProfile } ) => {
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


export default FriendsList;