'use client';

import FriendsMenu from '@/components/dropdowns/friends/FriendsMenu';
import UserQuickAction from '@/components/dropdowns/UserQuickAction';
import { PartyfyProductType } from '@/helpers/PartyfyProductType';
import PartyfyUser from '@/helpers/PartyfyUser';
import UserContext from '@/providers/UserContext';
import { Users } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';

interface NavigationBarProps {
  partyfyUser: PartyfyUser | null;
  isAHost?: boolean;
  setIsAHost?: (value: boolean) => void;
  setSpotifyAuthenticated?: (value: boolean) => void;
  getUser?: () => void;
  currentFriend?: Users | null;
}

export default function NavigationBar({
  partyfyUser,
  isAHost = true,
  setIsAHost = () => {},
  setSpotifyAuthenticated = () => {},
  getUser = () => {},
  currentFriend = null,
}: NavigationBarProps) {
  console.log('[DEBUG] NavigationBar render - currentFriend:', currentFriend?.Username);

  return (
    <nav className='flex justify-between'>
      <div className='flex justfiy-start place-items-center'>
        <AnimatePresence mode="wait">
          <motion.h2
            key={currentFriend ? 'with-friend' : 'without-friend'}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`text-xl m-3 whitespace-nowrap`}
          >
            {currentFriend
              ? `to ${currentFriend.Username}`
              : `${partyfyUser?.db?.Username ?? ''}`
            }
          </motion.h2>
        </AnimatePresence>
        {
          !currentFriend && partyfyUser && partyfyUser.db && partyfyUser.getProductType() == PartyfyProductType.COMMERCIAL &&
          <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
        }
      </div>
      <UserContext.Provider value={{ user: partyfyUser }}>
        <div className="flex align-start">
          <FriendsMenu />
          <UserQuickAction
            isAHost={isAHost}
            setIsAHost={setIsAHost}
            setSpotifyAuthenticated={setSpotifyAuthenticated}
            getUser={getUser}
          />
        </div>
      </UserContext.Provider>
    </nav>
  );
}
