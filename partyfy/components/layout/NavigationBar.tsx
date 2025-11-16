'use client';

import FriendsMenu from '@/components/dropdowns/friends/FriendsMenu';
import UserQuickAction from '@/components/dropdowns/UserQuickAction';
import { PartyfyProductType } from '@/helpers/PartyfyProductType';
import PartyfyUser from '@/helpers/PartyfyUser';
import UserContext from '@/providers/UserContext';

interface NavigationBarProps {
  partyfyUser: PartyfyUser | null;
  isAHost?: boolean;
  setIsAHost?: (value: boolean) => void;
  setSpotifyAuthenticated?: (value: boolean) => void;
  getUser?: () => void;
}

export default function NavigationBar({
  partyfyUser,
  isAHost = true,
  setIsAHost = () => {},
  setSpotifyAuthenticated = () => {},
  getUser = () => {},
}: NavigationBarProps) {
  return (
    <nav className='flex justify-between'>
      <div className='flex justfiy-start place-items-center'>
        <h2 className={`text-2xl m-3`}>{`${partyfyUser?.db?.Username ?? ''}`}</h2>
        {
          partyfyUser && partyfyUser.db && partyfyUser.getProductType() == PartyfyProductType.COMMERCIAL &&
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
