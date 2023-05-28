import { FaUserFriends, FaPaperPlane, FaCheckCircle, FaTrash } from 'react-icons/fa';
import { GiCancel } from 'react-icons/gi';
import { IoMdArrowDropdown } from 'react-icons/io';
import { useContext, useEffect, useState, forwardRef } from 'react';
import UserContext from '../providers/UserContext';
import { UserProfile } from '@auth0/nextjs-auth0/client';

import styles from '@/styles/FriendsList.module.css'
import { isMobile } from 'react-device-detect';
import Swal from 'sweetalert2';
import Loading from './Loading';
const FriendsList = () => {

    enum FriendListScreen {
        Friends,
        Requests,
        Sent,
        Search
    }

    const [visible, setVisible] = useState(false);
    const [friendListScreen, setFriendListScreen] = useState(FriendListScreen.Friends);

    const DEFAULT_SCREEN = FriendListScreen.Friends;

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

    if (!visible && user && friendListScreen !== DEFAULT_SCREEN) {
        setFriendListScreen(DEFAULT_SCREEN);
    }

    return (
        <div className="me-2 d-flex flex-row align-items-center">
            <div onClick={() => setVisible(!visible)}>
                <FaUserFriends size={45} className="mb-1" />
                <IoMdArrowDropdown size={25} className="mb-1 ms-1" />
            </div>
            {
                visible && 
                <div className={styles.friendsMenu} style={{ top: isMobile ? '7vh' : '4vh' }}>
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
const FriendsList_Requests = ({ user } : { user : UserProfile } ) => {
    const [usersReturned, setUsersReturned] = useState([]);
    const [loading, setLoading] = useState(true);

    async function fetchRequests() {
        const response = await fetch('/api/database/friends?UserID=' + (user.sub ?? user.user_id) + '&action=requests')
        const data = await response.json();
        if (data) {
            setLoading(false);
            setUsersReturned(data);
        }
    }

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 2000);
        return () => clearInterval(interval);
    }, [user]);

    async function deleteIncomingRequest(FriendUserID: string, FriendUsername: string) {
        let result = await Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to delete your friend request from ${FriendUsername}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        });

        if (result.isConfirmed) {
            await fetch('/api/database/friends', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    UserID: user.sub ?? user.user_id,
                    FriendID: FriendUserID,
                    action: 'DeleteFriendRequest'
                })
            });
        }
        fetchRequests();
    }

    async function acceptIncomingRequest(FriendUserID: string, FriendUsername: string) {
        let result = await Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to accept the friend request from ${FriendUsername}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        });

        if (result.isConfirmed) {
            await fetch('/api/database/friends', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    UserID: user.sub ?? user.user_id,
                    FriendID: FriendUserID,
                    action: 'AcceptFriendRequest'
                })
            });
        }
        fetchRequests();
    }

    return (
        <div>
        {
            loading 
            ?
            <Loading />
            :
                usersReturned.length === 0 || !usersReturned
                ?
                <div>
                    <h5 className="text-center">You have no sent friend requests.</h5>
                </div>
                :
                usersReturned.map((user, index) => {
                    return (
                        <div key={index} className="card bg-dark p-2 mt-3">
                            <div className="d-flex flex-row align-items-center justify-content-between">
                                <h5 className="me-4 mt-2">{user.Username}</h5>
                                <div className="d-flex flex-row align-items-center">
                                    <button className="btn btn-small btn-success me-2" onClick={() => acceptIncomingRequest(user.UserID, user.Username)}><FaCheckCircle /></button>
                                    <button className="btn btn-small btn-danger" onClick={() => deleteIncomingRequest(user.UserID, user.Username)}><GiCancel /></button>
                                </div>
                            </div>
                        </div>
                    );
                })
        }
    </div>
    )
}
const FriendsList_Sent = ({ user } : { user : UserProfile } ) => {
    const [usersReturned, setUsersReturned] = useState([]);
    const [loading, setLoading] = useState(true);

    async function loadSentFriendRequests() {
        const response = await fetch('/api/database/friends?UserID=' + (user.sub ?? user.user_id) + '&action=sent')
        const data = await response.json();
        if (data) {
            setLoading(false);
            setUsersReturned(data);
        }
    }
    
    useEffect(() => { 
        const interval = setInterval(loadSentFriendRequests, 2000);
        return () => clearInterval(interval);
    }, [user]);

    async function cancelFriendRequest(FriendUserID: string, FriendUsername: string) {
        let result = await Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to cancel your friend request to ${FriendUsername}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        });

        if (result.isConfirmed) {
            await fetch('/api/database/friends', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    UserID: user.sub ?? user.user_id,
                    FriendID: FriendUserID,
                    action: 'DeleteFriendRequest'
                })
            });
            loadSentFriendRequests();
        }
    }

    return (
        <div>
            {
                loading 
                ?
                <Loading />
                :
                    usersReturned.length === 0 || !usersReturned
                    ?
                    <div>
                        <h5 className="text-center">You have no sent friend requests.</h5>
                    </div>
                    :
                    usersReturned.map((user, index) => {
                        return (
                            <div key={index} className="card bg-dark p-2 mt-3">
                                <div className="d-flex flex-row align-items-center justify-content-between">
                                    <h5 className="me-4 mt-2">{user.Username}</h5>
                                    <button className="btn btn-small btn-danger" onClick={() => cancelFriendRequest(user.UserID, user.Username)}><GiCancel className="me-1 mb-1"/>Cancel</button>
                                </div>
                            </div>
                        );
                    })
            }
        </div>
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