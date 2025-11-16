'use client';

import Loading from '@/components/misc/Loading';
import NavigationBar from '@/components/layout/NavigationBar';
import RequestSong from '@/components/request/RequestSong';
import UserContext from '@/providers/UserContext';
import PartyfyUser from '@/helpers/PartyfyUser';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users } from '@prisma/client';

export default function RequestPage() {
  const { user, isLoading } = useUser();
  const params = useParams();
  const router = useRouter();
  const friendId = params.friendId as string;

  const [partyfyUser, setPartyfyUser] = useState<PartyfyUser | null>(null);
  const [currentFriend, setCurrentFriend] = useState<Users | null>(null);
  const [friendLoading, setFriendLoading] = useState(true);
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState<boolean | null>(null);

  // Handle authentication
  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/');
      return;
    }

    if (user) {
      const handleSpotifyAuth = async () => {
        let pUser = new PartyfyUser(user);
        setPartyfyUser(pUser);
        await pUser.fillUserInfoFromDB();
      };
      handleSpotifyAuth();
    }
  }, [user, isLoading, router]);

  // Fetch friend data
  useEffect(() => {
    if (!friendId || !partyfyUser) return;

    const fetchFriend = async () => {
      try {
        const response = await fetch(`/api/database/users?UserID=${friendId}`);
        if (!response.ok) {
          router.push('/dashboard');
          return;
        }
        const data = await response.json();
        setCurrentFriend(data);
        setFriendLoading(false);
      } catch (error) {
        console.error('Error fetching friend:', error);
        router.push('/dashboard');
      }
    };

    fetchFriend();
  }, [friendId, partyfyUser, router]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const refetchUser = async () => {
    if (!partyfyUser) return;
    await partyfyUser.refetchUser();
    setPartyfyUser(partyfyUser);
  };

  if (isLoading || !user || friendLoading || !currentFriend) {
    return <Loading />;
  }

  return (
    <main className="text-left z-[2] flex flex-col h-screen mx-2">
      <NavigationBar
        partyfyUser={partyfyUser}
        setSpotifyAuthenticated={setSpotifyAuthenticated}
        getUser={refetchUser}
      />
      <UserContext.Provider value={{ user: partyfyUser }}>
        <div className="text-white text-center flex-1 overflow-auto">
          <RequestSong
            currentFriend={currentFriend}
            setCurrentFriend={handleBackToDashboard}
            temporarySession={null}
            exitSession={null}
          />
        </div>
      </UserContext.Provider>
    </main>
  );
}
