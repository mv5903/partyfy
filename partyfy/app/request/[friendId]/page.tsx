'use client';

import Loading from '@/components/misc/Loading';
import NavigationBar from '@/components/layout/NavigationBar';
import RequestSong from '@/components/request/RequestSong';
import UserContext from '@/providers/UserContext';
import PartyfyUser from '@/helpers/PartyfyUser';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, sessions } from '@prisma/client';
import { useUserStore } from '@/stores/useUserStore';
import { useAlert } from '@/hooks/useAlert';

export default function RequestPage() {
  const alert = useAlert();
  const { user, isLoading } = useUser();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const friendId = params.friendId as string;
  const sessionId = searchParams.get('session');

  // Use Zustand store for user data
  const { partyfyUser, initializeUser, refetchUser: refetchUserStore, isLoading: userStoreLoading } = useUserStore();

  const [currentFriend, setCurrentFriend] = useState<Users | null>(null);
  const [friendLoading, setFriendLoading] = useState(true);
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState<boolean | null>(null);
  const [showFriendInTopBar, setShowFriendInTopBar] = useState<boolean>(false);
  const [queueUsage, setQueueUsage] = useState<any>(null);
  const [temporarySession, setTemporarySession] = useState<sessions | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle authentication
  useEffect(() => {
    const checkAuth = async () => {
      console.log('[RequestPage] checkAuth running:', { user: !!user, isLoading, sessionId });

      // If user is logged in, initialize their data
      if (user) {
        console.log('[RequestPage] User logged in, initializing...');
        await initializeUser(user);
        console.log('[RequestPage] User initialized');
        return;
      }

      // If not logged in and no session, redirect to home
      if (!user && !isLoading && !sessionId) {
        console.log('[RequestPage] No user and no session, redirecting to home');
        router.push('/');
        return;
      }

      // If not logged in but has session, validate it
      if (!user && !isLoading && sessionId) {
        console.log('[RequestPage] Validating session:', sessionId);
        try {
          const response = await fetch(`/api/database/sessions?SessionID=${sessionId}`);
          const sessionData = await response.json();

          if (!sessionData) {
            setAuthError('Session not found. Ask your friend to create a new one.');
            return;
          }

          // Check if session is expired
          const expirationDate = new Date(sessionData.expiration_date);
          if (expirationDate < new Date()) {
            setAuthError(`Session expired at ${expirationDate.toLocaleDateString()} at ${expirationDate.toLocaleTimeString()}. Ask your friend to create a new one.`);
            return;
          }

          console.log('[RequestPage] Session validated successfully');
          setTemporarySession(sessionData);
        } catch (error) {
          console.error('Error validating session:', error);
          setAuthError('Error validating session. Please try again.');
        }
      }
    };

    checkAuth();
  }, [user, isLoading, sessionId, router]);

  // Fetch friend data
  useEffect(() => {
    console.log('[RequestPage] fetchFriend useEffect running:', {
      friendId,
      sessionId,
      user: !!user,
      temporarySession: !!temporarySession,
      partyfyUser: !!partyfyUser
    });

    if (!friendId) {
      console.log('[RequestPage] No friendId, returning');
      return;
    }

    // For temporary sessions, wait for session validation
    if (sessionId && !user && !temporarySession) {
      console.log('[RequestPage] Waiting for session validation');
      return;
    }

    // For logged-in users, wait for partyfyUser
    if (!sessionId && user && !partyfyUser) {
      console.log('[RequestPage] Waiting for partyfyUser');
      return;
    }

    const fetchFriend = async () => {
      console.log('[RequestPage] Starting to fetch friend...');
      setFriendLoading(true);
      try {
        let response;

        // Decode the friendId in case it's URL encoded
        const decodedFriendId = decodeURIComponent(friendId);
        console.log('[RequestPage] Decoded friendId:', decodedFriendId);

        // Check if friendId is a username (starts with @)
        if (decodedFriendId.startsWith('@')) {
          const username = decodedFriendId.substring(1); // Remove @ prefix
          console.log('[RequestPage] Fetching by username:', username);
          response = await fetch(`/api/database/users?Username=${encodeURIComponent(username)}`);
        } else {
          // Assume it's a UserID for backward compatibility
          console.log('[RequestPage] Fetching by UserID:', decodedFriendId);
          response = await fetch(`/api/database/users?UserID=${decodedFriendId}`);
        }

        if (!response.ok) {
          if (user) {
            router.push('/dashboard');
          } else {
            setAuthError('User not found.');
          }
          setFriendLoading(false);
          return;
        }

        const data = await response.json();

        // For temporary sessions, verify the friend matches the session owner
        if (temporarySession && data.UserID !== temporarySession.user_id) {
          setAuthError('This session does not belong to this user.');
          setFriendLoading(false);
          return;
        }

        console.log('[RequestPage] Friend fetched successfully:', data.Username);
        setCurrentFriend(data);
        setFriendLoading(false);
      } catch (error) {
        console.error('[RequestPage] Error fetching friend:', error);
        if (user) {
          router.push('/dashboard');
        } else {
          setAuthError('Error loading user data.');
        }
        setFriendLoading(false);
      }
    };

    fetchFriend();
  }, [friendId, partyfyUser, temporarySession, sessionId, user, router]);

  const handleBackToDashboard = () => {
    if (temporarySession) {
      router.push('/');
    } else {
      router.push('/dashboard');
    }
  };

  const exitSession = () => {
    router.push('/');
  };

  const refetchUser = async () => {
    await refetchUserStore();
  };

  // Debug logging
  console.log('[RequestPage] State:', {
    isLoading,
    friendLoading,
    currentFriend: !!currentFriend,
    user: !!user,
    userStoreLoading,
    partyfyUser: !!partyfyUser,
    sessionId,
    temporarySession: !!temporarySession
  });

  // Show error screen if authentication failed
  if (authError) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen text-white px-6'>
        <div className='flex justify-center mb-8'>
          <img className='object-center rounded-full' src='/logo.png' width="120px" alt="Partyfy Logo" />
        </div>
        <h2 className='text-2xl font-bold mb-4'>Session Error</h2>
        <p className='text-gray-400 text-center mb-8 max-w-md'>{authError}</p>
        <button
          onClick={() => router.push('/')}
          className='bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all'
        >
          Go to Home
        </button>
      </div>
    );
  }

  // Show loading while checking authentication or fetching data
  if (isLoading || friendLoading || !currentFriend) {
    console.log('[RequestPage] Showing loading - reason:', { isLoading, friendLoading, noCurrentFriend: !currentFriend });
    return <Loading />;
  }

  // For logged-in users, wait for user store
  if (user && (userStoreLoading || !partyfyUser)) {
    console.log('[RequestPage] Showing loading - waiting for user store:', { userStoreLoading, noPartyfyUser: !partyfyUser });
    return <Loading />;
  }

  return (
    <main className="text-left z-[2] flex flex-col h-screen mx-2 bg-black">
      {/* Only show NavigationBar for logged-in users */}
      {user && partyfyUser && (
        <NavigationBar
          partyfyUser={partyfyUser}
          setSpotifyAuthenticated={setSpotifyAuthenticated}
          getUser={refetchUser}
          currentFriend={showFriendInTopBar ? currentFriend : null}
          queueUsage={showFriendInTopBar ? queueUsage : null}
        />
      )}
      <UserContext.Provider value={{ user: partyfyUser }}>
        <div className="text-white text-center flex-1 overflow-auto bg-black">
          <RequestSong
            currentFriend={currentFriend}
            setCurrentFriend={handleBackToDashboard}
            temporarySession={temporarySession}
            exitSession={temporarySession ? exitSession : null}
            setShowFriendInTopBar={user ? setShowFriendInTopBar : undefined}
            setQueueUsage={user ? setQueueUsage : undefined}
          />
        </div>
      </UserContext.Provider>
    </main>
  );
}
