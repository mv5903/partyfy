import { use, useContext, useEffect, useState } from "react";
import { TiRefresh } from "react-icons/ti";
import { isMobile } from "react-device-detect";
import { getUserID } from '@/helpers/Utils';
import UserContext from '@/providers/UserContext';
import Loading from "../misc/Loading";
import UserRequest from "./UserRequest";

const RequestPage = () => {

    const {
        spotifyAuth,
        user
    } = useContext(UserContext);

    const [isUnattendedQueuesEnabled, setIsUnattendedQueuesEnabled] = useState(null);
    const [friendsList, setFriendsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentFriend, setCurrentFriend] = useState(null);

    async function displayFriends() {
        if (currentFriend) return;
        const response = await fetch('/api/database/friends?UserID=' + getUserID(user))
        let data = await response.json();
        // Show users who have functionality enabled first
        data = data.sort((a: any, b: any) => b.UnattendedQueues - a.UnattendedQueues);
        setLoading(false);
        setFriendsList(data);
    }

    useEffect(() => {
        setLoading(true);
        displayFriends();
    }, [user]);

    useEffect(() => {
        async function fn() {
            if (currentFriend) return;
            const response = await fetch('/api/database/unattendedqueues?UserID=' + getUserID(user));
            const data = await response.json();
            if (data) {
                if (data.UnattendedQueues === null) {
                    setIsUnattendedQueuesEnabled(false);
                } else {
                    setIsUnattendedQueuesEnabled(data.UnattendedQueues);
                }
            }
        }

        fn();
    }, [user]);

    async function unattendedQueues() {
        const response = await fetch('/api/database/unattendedqueues', {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                UserID: getUserID(user),
                enable: !isUnattendedQueuesEnabled
            })
        });
        if (response.ok) {
            setIsUnattendedQueuesEnabled(!isUnattendedQueuesEnabled);
        }
    }

    useEffect(() => {
        const interval = setInterval(displayFriends, 1000);
        return () => clearInterval(interval);
    });

    return (
        <div>
            {
                isMobile && !currentFriend &&
                <div className="text-center">
                    {
                        isUnattendedQueuesEnabled === null 
                        ?
                        <Loading />
                        :
                        <button className={`btn m-2 ${isUnattendedQueuesEnabled ? "btn-success" : "btn-warning"}`} onClick={() => unattendedQueues()}>{isUnattendedQueuesEnabled ? "Unattended Queues Enabled. Disable..." : "Allow Unattended Queues from Others"}</button>
                    }
                    <h3>OR</h3>
                </div>
            }
            <div className="text-center mt-4 ms-2 me-2">
                {
                    loading &&
                    <Loading />
                }
                {
                    !loading && friendsList.length === 0 &&
                    <h3>No friends found. Add some through the friends menu.</h3>
                }
                {
                    !currentFriend && !loading && friendsList.length > 0 &&
                    <div>
                        <div className="d-flex flex-row align-items-center">
                            <h3 className="me-3">Choose a friend to request a song from:</h3>
                            <button className="btn btn-primary" onClick={() => displayFriends()}><TiRefresh size={30} /></button>
                        </div>
                        <div className="d-flex flex-wrap flex-column justify-content-center mt-4">
                            {
                                friendsList.map((friend: any, index: number) => {
                                    return (
                                        <button key={index} onClick={() => setCurrentFriend(friend)} disabled={ friend.UnattendedQueues !== true } className={`btn text-center mt-3 ${friend.UnattendedQueues === true ? 'btn-success' : 'btn-secondary'}`} style={{ opacity: friend.UnattendedQueues === true ? '1' : '.35' }} >{friend.Username + `${friend.UnattendedQueues === true ? '' : ' (not enabled)'}`}</button>
                                    )
                                })
                            }
                        </div>
                    </div>
                }
                {
                    currentFriend != null &&
                    <UserRequest currentFriend={currentFriend} setCurrentFriend={setCurrentFriend} />
                }
            </div>
        </div>
    );
}

export default RequestPage;