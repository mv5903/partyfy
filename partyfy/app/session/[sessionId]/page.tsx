'use client';

import Loading from '@/components/misc/Loading';
import RequestSong from '@/components/request/RequestSong';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sessions, Users } from '@prisma/client';
import { useAlert } from '@/hooks/useAlert';
import { useNavigationLoader } from '@/hooks/useNavigationLoader';
import UserContext from '@/providers/UserContext';

export default function SessionPage() {
  const alert = useAlert();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { startLoading, stopLoading } = useNavigationLoader();

  const [activeTemporarySession, setActiveTemporarySession] = useState<sessions | null>(null);
  const [temporarySessionFriend, setTemporarySessionFriend] = useState<Users | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      console.log('[Session Page] Checking session:', sessionId);

      // Start loading
      startLoading();

      try {
        console.log('[Session Page] Fetching session from API...');
        let response = await fetch('/api/database/sessions?SessionID=' + sessionId);
        let data = await response.json();
        console.log('[Session Page] Session data:', data);

        // Check if the session exists
        if (!data) {
          stopLoading();
          setError('Session Not Found. Ask your friend to create a new one.');
          return;
        }

        // Check if the session is active
        const expirationDate = new Date(data.expiration_date);
        if (expirationDate < new Date()) {
          stopLoading();
          setError(`Session expired at ${expirationDate.toLocaleDateString()} at ${expirationDate.toLocaleTimeString()}. Ask your friend to create a new one.`);
          return;
        }

        // Get the friend's user info
        response = await fetch('/api/database/users?UserID=' + data.user_id);
        if (response.status === 500) {
          stopLoading();
          setError('Error loading session. Please try again.');
          return;
        }
        let friendData = await response.json();
        if (!friendData) {
          stopLoading();
          setError('Could not load user information. Please try again.');
          return;
        }

        // Stop loading
        stopLoading();
        setTemporarySessionFriend(friendData);
        setActiveTemporarySession(data);
      } catch (error) {
        console.error('Error checking session:', error);
        stopLoading();
        setError('There was an error joining the session. Please try again.');
      }
    };

    if (sessionId) {
      checkSession();
    }
  }, [sessionId, router, alert, startLoading, stopLoading]);

  const exitSession = () => {
    router.push('/');
  };

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen text-white px-6'>
        <div className='flex justify-center mb-8'>
          <img className='object-center rounded-full' src='/logo.png' width="120px" alt="Partyfy Logo" />
        </div>
        <h2 className='text-2xl font-bold mb-4'>Session Error</h2>
        <p className='text-gray-400 text-center mb-8 max-w-md'>{error}</p>
        <button
          onClick={() => router.push('/')}
          className='bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all'
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (!activeTemporarySession || !temporarySessionFriend) {
    return <Loading />;
  }

  return (
    <UserContext.Provider value={{ user: null }}>
      <div className='text-white text-center'>
        <RequestSong
          currentFriend={temporarySessionFriend}
          setCurrentFriend={null}
          temporarySession={activeTemporarySession}
          exitSession={exitSession}
        />
        <alert.AlertComponent />
      </div>
    </UserContext.Provider>
  );
}
