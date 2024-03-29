import { FaUserFriends } from 'react-icons/fa';
import { IoMdArrowDropdown } from 'react-icons/io';
import { useContext, useState } from 'react';
import { isMobile } from 'react-device-detect';

import UserContext from '@/providers/UserContext';
import useComponentVisible from '@/hooks/useComponentVisible';

import styles from '@/styles/FriendsList.module.css';

import List from './submenus/List';
import IncomingRequests from './submenus/IncomingRequests';
import SentRequests from './submenus/SentRequests';
import Search from './submenus/Search';
import IncomingCount from './submenus/utils/IncomingCount';
import { Radio, RadioGroup } from 'react-radio-group';
import { FriendListScreen } from '@/helpers/FriendListScreen';

const Friends = () => {

    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(true);

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
                return <List user={user} isComponentVisible={isComponentVisible} setFriendListScreen={setFriendListScreen} />
            case FriendListScreen.Requests:
                return <IncomingRequests user={user} />
            case FriendListScreen.Sent:
                return <SentRequests user={user} />
            case FriendListScreen.Search:
                return <Search user={user} />
        }
    }

    if (!isComponentVisible && user && friendListScreen !== DEFAULT_SCREEN) {
        setFriendListScreen(DEFAULT_SCREEN);
    }

    return (
        <div ref={ref}>
            <div className={`flex align-center mr-2 cursor-pointer ${isComponentVisible ? 'bg-secondary' : 'bg-gray-800'} p-1 rounded mt-2 ps-2 ${styles.friendsMenuButton}`} onClick={() => setIsComponentVisible(!isComponentVisible)}>
                <FaUserFriends size={40} />
                <IoMdArrowDropdown className='mt-2' size={25}/>
            </div>
            {
                isComponentVisible && 
                <div className={styles.friendsMenu}>
                    <div className="btn-group flex-nowrap justify-center w-full">
                        <button className={`btn px-4 ${friendListScreen == FriendListScreen.Friends ? "btn-active" : ""}`} onClick={() => setFriendListScreen(FriendListScreen.Friends)}>Friends</button>
                        <button className={`btn px-4 ${friendListScreen == FriendListScreen.Requests ? "btn-active" : ""}`} onClick={() => setFriendListScreen(FriendListScreen.Requests)}><IncomingCount user={user}/>&nbsp;Requests</button>
                        <button className={`btn px-4 ${friendListScreen == FriendListScreen.Sent ? "btn-active" : ""}`} onClick={() => setFriendListScreen(FriendListScreen.Sent)}>Sent</button>
                        <button className={`btn px-4 ${friendListScreen == FriendListScreen.Search ? "btn-active" : ""}`} onClick={() => setFriendListScreen(FriendListScreen.Search)}>Search</button>
                    </div>
                    { isComponentVisible && currentFriendListScreen() }
                </div>
            }
        </div>
    );
}

export default Friends;