import { use, useContext, useEffect, useState } from "react";
import { TiRefresh } from "react-icons/ti";
import { isMobile } from "react-device-detect";
import { getUserID } from '@/helpers/Utils';
import UserContext from '@/providers/UserContext';
import Loading from "../misc/Loading";
import UserRequest from "./UserRequest";
import Swal from 'sweetalert2';
import { Users } from "@prisma/client";

const RequestPage = () => {

    const {
        spotifyAuth,
        user
    } = useContext(UserContext);

    const [isUnattendedQueuesEnabled, setIsUnattendedQueuesEnabled] = useState(null);
    const [friendsList, setFriendsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentFriend, setCurrentFriend] = useState<Users>(null);

    const [uqLoading, setUQLoading] = useState(false);

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
        setUQLoading(true);
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
        setUQLoading(false);
        if (response.ok) {
            setIsUnattendedQueuesEnabled(!isUnattendedQueuesEnabled);
        }
    }

    useEffect(() => {
        const interval = setInterval(displayFriends, 1000);
        return () => clearInterval(interval);
    });

    return (
        <div className="my-12">
            {
                !currentFriend &&
                <div className="text-center">
                    {
                        isUnattendedQueuesEnabled === null || uqLoading
                        ?
                        <Loading />
                        :
                        <button className={`btn m-2 ${isUnattendedQueuesEnabled ? "btn-success" : "btn-warning"}`} onClick={() => unattendedQueues()}>{isUnattendedQueuesEnabled ? "Unattended Queues: Enabled" : "Unattended Queues: Disabled"}</button>
                    }
                    <h3 className="mt-10">OR</h3>
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
                        <h3 className="text-3xl me-3">Add to:</h3>
                        <h6 className="text-gray-600 mt-3"><i>Refreshes every 2 seconds</i></h6>
                        <div className="flex flex-col justify-center mt-4">
                            {
                                friendsList.map((friend: any, index: number) => {
                                    return (
                                        <button key={index} onClick={() => setCurrentFriend(friend)} disabled={ friend.UnattendedQueues !== true } className={`btn text-center mt-3 ${friend.UnattendedQueues === true ? 'btn-primary' : 'bg-slate-6'}`} style={{ opacity: friend.UnattendedQueues === true ? '1' : '.35' }} >{friend.Username + `${friend.UnattendedQueues === true ? '' : ' (not enabled)'}`}</button>
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