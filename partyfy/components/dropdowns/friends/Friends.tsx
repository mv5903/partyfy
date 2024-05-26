import { useContext, useState } from 'react';
import { FaPaperPlane, FaQrcode, FaSearch, FaUserFriends, FaUserPlus } from 'react-icons/fa';
import { IoMdArrowDropdown } from 'react-icons/io';

import useComponentVisible from '@/hooks/useComponentVisible';
import UserContext from '@/providers/UserContext';


import { FriendListScreen } from '@/helpers/FriendListScreen';
import { FaPeopleGroup } from 'react-icons/fa6';
import IncomingRequests from './submenus/IncomingRequests';
import List from './submenus/List';
import QR from './submenus/QR';
import Search from './submenus/Search';
import SentRequests from './submenus/SentRequests';
import IncomingCount from './submenus/utils/IncomingCount';

const Friends = () => {

    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(true);

    const [friendListScreen, setFriendListScreen] = useState(FriendListScreen.Friends);

    const DEFAULT_SCREEN = FriendListScreen.Friends;

    const { user } = useContext(UserContext);

    const currentFriendListScreen = () => {
        switch (friendListScreen) {
            case FriendListScreen.QR:
                return <QR user={user} setIsComponentVisible={setIsComponentVisible} setFriendsListScreen={setFriendListScreen} />
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
            <div className={`flex align-center mr-2 cursor-pointer ${isComponentVisible ? 'bg-secondary' : 'bg-gray-800'} p-1 rounded mt-2 ps-2`} onClick={() => setIsComponentVisible(!isComponentVisible)}>
                <FaUserFriends size={40} />
                <IoMdArrowDropdown className='mt-2' size={25}/>
            </div>
            {
                isComponentVisible && 
                <div className='z-[3] px-3 py-4 absolute w-full right-0 bg-[#333] rounded-md flex flex-col gap-2 text-xs'>
                    <div role="tablist" className="tabs tabs-boxed tabs-lg mx-auto w-full">
                        <button className={`tab w-1/5 px-4 ${friendListScreen == FriendListScreen.QR ? "tab-active" : ""}`} onClick={() => setFriendListScreen(FriendListScreen.QR)}><FaQrcode className='mx-auto'/></button>
                        <button className={`tab w-1/5 px-4 ${friendListScreen == FriendListScreen.Friends ? "tab-active" : ""}`} onClick={() => setFriendListScreen(FriendListScreen.Friends)}><FaPeopleGroup className='mx-auto' /></button>
                        <button className={`tab w-1/5 px-4 ${friendListScreen == FriendListScreen.Requests ? "tab-active" : ""}`} onClick={() => setFriendListScreen(FriendListScreen.Requests)}><IncomingCount />&nbsp;<FaUserPlus  className='mx-auto' /></button>
                        <button className={`tab w-1/5 px-4 ${friendListScreen == FriendListScreen.Sent ? "tab-active" : ""}`} onClick={() => setFriendListScreen(FriendListScreen.Sent)}><FaPaperPlane  className='mx-auto'/></button>
                        <button className={`tab w-1/5 px-4 ${friendListScreen == FriendListScreen.Search ? "tab-active" : ""}`} onClick={() => setFriendListScreen(FriendListScreen.Search)}><FaSearch  className='mx-auto' /></button>
                    </div>
                    { isComponentVisible && currentFriendListScreen() }
                </div>
            }
        </div>
    );
}

export default Friends;