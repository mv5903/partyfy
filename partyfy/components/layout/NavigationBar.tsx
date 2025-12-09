'use client';

import FriendsMenu from '@/components/dropdowns/friends/FriendsMenu';
import UserQuickAction from '@/components/dropdowns/UserQuickAction';
import { PartyfyProductType } from '@/helpers/PartyfyProductType';
import PartyfyUser from '@/helpers/PartyfyUser';
import UserContext from '@/providers/UserContext';
import { Users } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueueStatusStore } from '@/stores/useQueueStatusStore';
import { FaCheck, FaSpinner } from 'react-icons/fa';
import { Skeleton } from '@/components/ui/skeleton';

interface NavigationBarProps {
  partyfyUser: PartyfyUser | null;
  isAHost?: boolean;
  setIsAHost?: (value: boolean) => void;
  setSpotifyAuthenticated?: (value: boolean) => void;
  getUser?: () => void;
  currentFriend?: Users | null;
  queueUsage?: any;
  isLoading?: boolean;
}

export default function NavigationBar({
  partyfyUser,
  isAHost = true,
  setIsAHost = () => {},
  setSpotifyAuthenticated = () => {},
  getUser = () => {},
  currentFriend = null,
  queueUsage = null,
  isLoading = false,
}: NavigationBarProps) {
  console.log('[DEBUG] NavigationBar render - currentFriend:', currentFriend?.Username);
  const { status, songName } = useQueueStatusStore();

  if (isLoading) {
    return (
      <nav className='flex justify-between'>
        <div className='flex justify-start place-items-center'>
          <Skeleton className="h-7 w-40 m-3" />
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

  return (
    <nav className='flex justify-between'>
      <div className='flex justfiy-start place-items-center h-12'>
        <AnimatePresence mode="wait">
          <motion.h2
            key={currentFriend ? 'with-friend' : 'without-friend'}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`text-lg m-3 whitespace-nowrap flex items-center gap-2`}
          >
            {currentFriend ? (
              <>
                <span>To {currentFriend.Username}</span>
                {queueUsage && queueUsage.hasRestriction && (
                  <span className="text-md text-stone-400">
                    ({queueUsage.maxQueueCount - queueUsage.currentQueueCount}/{queueUsage.maxQueueCount})
                  </span>
                )}
              </>
            ) : (
              `${partyfyUser?.db?.Username ?? ''}`
            )}
          </motion.h2>
        </AnimatePresence>
        {
          !currentFriend && partyfyUser && partyfyUser.db && partyfyUser.getProductType() == PartyfyProductType.COMMERCIAL &&
          <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
        }
        {/* Queue status indicator */}
        <AnimatePresence>
          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 ml-2"
            >
              {status === 'loading' && (
                <FaSpinner className="animate-spin text-blue-400" size={16} />
              )}
              {status === 'success' && (
                <FaCheck className="text-green-400" size={16} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
