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

const Friends = () => {

    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(true);

    enum FriendListScreen {
        Friends,
        Requests,
        Sent,
        Search
    }

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
                return <List user={user} isComponentVisible={isComponentVisible}/>
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
        <div className="me-2" ref={ref}>
            <div className={styles.friendsMenuButton} onClick={() => setIsComponentVisible(!isComponentVisible)}>
                <FaUserFriends size={45} className="mb-1" />
                <IoMdArrowDropdown size={25} className="mb-1 ms-1" />
            </div>
            {
                isComponentVisible && 
                <div className={styles.friendsMenu} style={{ top: isMobile ? '7vh' : '4vh' }}>
                    <select onChange={e => setFriendListScreen(FriendListScreen[e.target.value as keyof typeof FriendListScreen])}>
                        {Object.values(FriendListScreen).filter(i => !isNumeric(i)).map((header, index) => {
                            return <option key={index} value={header}>{header}</option>
                        })}
                    </select>
                    { isComponentVisible && currentFriendListScreen() }
                </div>
            }
        </div>
    );
}

export default Friends;