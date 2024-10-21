import { useContext, useState } from 'react';
import { FaPaperPlane, FaQrcode, FaSearch, FaUserFriends, FaUserPlus } from 'react-icons/fa';
import { IoMdArrowDropdown, IoMdReturnLeft } from 'react-icons/io';

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

const FriendsMenu = () => {

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

    const icons = [<FaQrcode className='mx-auto'/>, <FaPeopleGroup className='mx-auto'/>, <FaUserPlus className='mx-auto'/>, <FaPaperPlane className='mx-auto'/>, <FaSearch className='mx-auto'/>];

    return (
        <div ref={ref}>
            <div className={`flex align-center mr-2 cursor-pointer p-1 mt-2 ps-2 btn rounded-lg shadow-md text-white ${isComponentVisible ? 'tab-active' : 'bg-primary'}`} onClick={() => setIsComponentVisible(!isComponentVisible)}>
                <FaUserFriends size={40} />
                <IoMdArrowDropdown className='mt-2' size={25}/>
            </div>
            {
                isComponentVisible && 
                <div className='z-[3] px-3 py-4 absolute w-[calc(100%-1rem)] left-0 bg-zinc-800 rounded-md shadow-lg flex flex-col gap-2 text-xs h-[80vh] mx-2'>
                    <div role="tablist" className="tabs tabs-boxed bg-primary tabs-lg mx-auto w-full">
                        {
                        Object.values(FriendListScreen)
                            .filter((value): value is FriendListScreen => typeof value === 'number')
                            .map((screen, index) => {
                            return (
                                <button
                                    key={index}
                                    className={`tab w-1/5 px-4 ${friendListScreen === screen ? "tab-active" : "bg-primary"}`}
                                    onClick={() => setFriendListScreen(screen)}
                                >
                                {icons[index]}
                                </button>
                            );
                            })
                        }
                    </div>
                    {isComponentVisible && currentFriendListScreen()}
                </div>
            }
        </div>
    );
}

export default FriendsMenu;