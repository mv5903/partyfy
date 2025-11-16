import { useContext, useState } from 'react';
import { FaPaperPlane, FaQrcode, FaSearch, FaUserFriends, FaUserPlus } from 'react-icons/fa';
import UserContext from '@/providers/UserContext';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { FriendListScreen } from '@/helpers/FriendListScreen';
import { FaPeopleGroup } from 'react-icons/fa6';
import IncomingRequests from './submenus/IncomingRequests';
import List from './submenus/List';
import QR from './submenus/QR';
import Search from './submenus/Search';
import SentRequests from './submenus/SentRequests';

const FriendsMenu = () => {
    const [friendListScreen, setFriendListScreen] = useState(FriendListScreen.Friends);
    const { user } = useContext(UserContext);

    const currentFriendListScreen = () => {
        switch (friendListScreen) {
            case FriendListScreen.QR:
                return <QR user={user} setFriendsListScreen={setFriendListScreen} />
            case FriendListScreen.Friends:
                return <List user={user} setFriendListScreen={setFriendListScreen} />
            case FriendListScreen.Requests:
                return <IncomingRequests user={user} />
            case FriendListScreen.Sent:
                return <SentRequests user={user} />
            case FriendListScreen.Search:
                return <Search user={user} />
        }
    }

    const fontSize = 18;
    const icons = [<FaQrcode size={fontSize}/>, <FaPeopleGroup size={fontSize} />, <FaUserPlus size={fontSize} />, <FaPaperPlane size={fontSize} />, <FaSearch size={fontSize} />];

    return (
        <Sheet onOpenChange={(open) => {
            if (!open) {
                setFriendListScreen(FriendListScreen.Friends);
            }
        }}>
            <SheetTrigger asChild>
                <Button className="flex align-center mr-2 cursor-pointer mt-2 rounded-lg shadow-md">
                    <FaUserFriends size={fontSize + 12} />
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] bg-stone-900 border-stone-700">
                <SheetHeader>
                    <SheetTitle className="text-white">Friends</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 h-full pt-4">
                    <div className="flex bg-stone-900 w-full gap-1">
                        {
                            Object.values(FriendListScreen)
                                .filter((value): value is FriendListScreen => typeof value === 'number')
                                .map((screen, index) => {
                                    return (
                                        <button
                                            key={index}
                                            className={`flex-1 flex items-center justify-center p-2 rounded-md text-white transition-colors ${friendListScreen === screen ? "bg-stone-700" : "bg-stone-800 hover:bg-stone-700"}`}
                                            onClick={() => setFriendListScreen(screen)}
                                        >
                                        {icons[index]}
                                        </button>
                                    );
                            })
                        }
                    </div>
                    <div className="flex-1 overflow-auto">
                        {currentFriendListScreen()}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default FriendsMenu;