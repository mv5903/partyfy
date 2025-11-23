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
import { useUserStore } from '@/stores/useUserStore';

export default function RequestPage() {
  const { user, isLoading } = useUser();
  const params = useParams();
  const router = useRouter();
  const friendId = params.friendId as string;

  // Use Zustand store for user data
  const { partyfyUser, initializeUser, refetchUser: refetchUserStore, isLoading: userStoreLoading } = useUserStore();

  const [currentFriend, setCurrentFriend] = useState<Users | null>(null);
  const [friendLoading, setFriendLoading] = useState(true);
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState<boolean | null>(null);
  const [showFriendInTopBar, setShowFriendInTopBar] = useState<boolean>(false);
  const [queueUsage, setQueueUsage] = useState<any>(null);

  // Handle authentication using Zustand store
  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/');
      return;
    }

    if (user) {
      // Use cached user data from Zustand store (async but doesn't need await here)
      initializeUser(user);
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
    await refetchUserStore();
  };

  // Show loading if ANY critical data is missing or still loading
  // This ensures the loading screen shows immediately on navigation
  if (isLoading || !user || userStoreLoading || !partyfyUser || friendLoading || !currentFriend) {
    return <Loading />;
  }

  return (
    <main className="text-left z-[2] flex flex-col h-screen mx-2 bg-black">
      <NavigationBar
        partyfyUser={partyfyUser}
        setSpotifyAuthenticated={setSpotifyAuthenticated}
        getUser={refetchUser}
        currentFriend={showFriendInTopBar ? currentFriend : null}
        queueUsage={showFriendInTopBar ? queueUsage : null}
      />
      <UserContext.Provider value={{ user: partyfyUser }}>
        <div className="text-white text-center flex-1 overflow-auto bg-black">
          <RequestSong
            currentFriend={currentFriend}
            setCurrentFriend={handleBackToDashboard}
            temporarySession={null}
            exitSession={null}
            setShowFriendInTopBar={setShowFriendInTopBar}
            setQueueUsage={setQueueUsage}
          />
        </div>
      </UserContext.Provider>
    </main>
  );
}
