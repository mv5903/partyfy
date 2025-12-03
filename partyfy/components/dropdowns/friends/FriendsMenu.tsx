import { useContext, useState, useRef } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { FriendListScreen } from '@/helpers/FriendListScreen';
import { FaPeopleGroup } from 'react-icons/fa6';
import IncomingRequests from './submenus/IncomingRequests';
import List from './submenus/List';
import QR from './submenus/QR';
import Search from './submenus/Search';
import SentRequests from './submenus/SentRequests';

const FriendsMenu = () => {
    const { user } = useContext(UserContext);
    const fontSize = 18;
    const [open, setOpen] = useState(false);
    const [currentScreen, setCurrentScreen] = useState<FriendListScreen>(FriendListScreen.Friends);
    const touchStartY = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEndY = e.changedTouches[0].clientY;
        const swipeDistance = touchEndY - touchStartY.current;

        // If swiped down more than 50px, close the sheet
        if (swipeDistance > 50) {
            setOpen(false);
        }
    };

    const getTitleForScreen = (screen: FriendListScreen) => {
        switch (screen) {
            case FriendListScreen.QR:
                return 'QR Code';
            case FriendListScreen.Friends:
                return '';
            case FriendListScreen.Requests:
                return 'Incoming Requests';
            case FriendListScreen.Sent:
                return 'Outgoing Requests';
            case FriendListScreen.Search:
                return 'Find Someone';
            default:
                return 'Friends';
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="flex align-center mr-2 cursor-pointer mt-2 rounded-lg shadow-md">
                    <FaUserFriends size={30} />
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] bg-stone-900 border-stone-900">
                {/* Pull bar for swipe down */}
                <div
                    className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-stone-600 rounded-full cursor-grab active:cursor-grabbing"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                />

                <SheetHeader className="mt-4">
                    <SheetTitle className="text-white text-xl">Friends {currentScreen != FriendListScreen.Friends && "-"} <i>{getTitleForScreen(currentScreen)}</i></SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 h-full pt-4">
                    <Tabs
                        defaultValue={FriendListScreen.Friends.toString()}
                        onValueChange={(value) => setCurrentScreen(parseInt(value) as FriendListScreen)}
                        className="w-full flex flex-col h-full"
                    >
                        <TabsList className="grid w-full bg-stone-800 text-white" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
                            <TabsTrigger
                                value={FriendListScreen.QR.toString()}
                                className="flex place-items-center gap-2 data-[state=active]:bg-stone-700 data-[state=active]:text-white text-stone-300"
                            >
                                <FaQrcode size={fontSize} />
                            </TabsTrigger>
                            <TabsTrigger
                                value={FriendListScreen.Friends.toString()}
                                className="flex place-items-center gap-2 data-[state=active]:bg-stone-700 data-[state=active]:text-white text-stone-300"
                            >
                                <FaPeopleGroup size={fontSize} />
                            </TabsTrigger>
                            <TabsTrigger
                                value={FriendListScreen.Requests.toString()}
                                className="flex place-items-center gap-2 data-[state=active]:bg-stone-700 data-[state=active]:text-white text-stone-300"
                            >
                                <FaUserPlus size={fontSize} />
                            </TabsTrigger>
                            <TabsTrigger
                                value={FriendListScreen.Sent.toString()}
                                className="flex place-items-center gap-2 data-[state=active]:bg-stone-700 data-[state=active]:text-white text-stone-300"
                            >
                                <FaPaperPlane size={fontSize} />
                            </TabsTrigger>
                            <TabsTrigger
                                value={FriendListScreen.Search.toString()}
                                className="flex place-items-center gap-2 data-[state=active]:bg-stone-700 data-[state=active]:text-white text-stone-300"
                            >
                                <FaSearch size={fontSize} />
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value={FriendListScreen.QR.toString()} className="flex-1 overflow-auto mt-4">
                            <QR user={user} setFriendsListScreen={() => {}} />
                        </TabsContent>
                        <TabsContent value={FriendListScreen.Friends.toString()} className="flex-1 overflow-auto mt-4">
                            <List user={user} setFriendListScreen={() => {}} />
                        </TabsContent>
                        <TabsContent value={FriendListScreen.Requests.toString()} className="flex-1 overflow-auto mt-4">
                            <IncomingRequests user={user} />
                        </TabsContent>
                        <TabsContent value={FriendListScreen.Sent.toString()} className="flex-1 overflow-auto mt-4">
                            <SentRequests user={user} />
                        </TabsContent>
                        <TabsContent value={FriendListScreen.Search.toString()} className="flex-1 overflow-auto mt-4">
                            <Search user={user} />
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default FriendsMenu;