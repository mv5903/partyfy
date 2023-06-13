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
import { Radio, RadioGroup } from 'react-radio-group';

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

    function setFriendListScreenHelper(e: FriendListScreen) {
        document.querySelector('.active')?.classList.remove('active');
        setFriendListScreen(e);
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
                    <RadioGroup data-toggle="buttons" className="d-flex flex-row justify-content-between btn-group btn-group-toggle" name="friends" selectedValue={friendListScreen} onChange={e => setFriendListScreenHelper(e)}>
                        <label className="btn btn-dark active">
                            <Radio value={FriendListScreen.Friends} className="d-none" />Friends
                        </label>
                        <label className="btn btn-dark">
                            <Radio value={FriendListScreen.Requests} className="d-none" />Requests
                        </label>
                        <label className="btn btn-dark">
                            <Radio value={FriendListScreen.Sent} className="d-none" />Sent
                        </label>
                        <label className="btn btn-dark">
                            <Radio value={FriendListScreen.Search} className="d-none" />Search
                        </label>
                    </RadioGroup>
                    { isComponentVisible && currentFriendListScreen() }
                </div>
            }
        </div>
    );
}

export default Friends;