'use client';

import Loading from '@/components/misc/Loading';
import RequestSong from '@/components/request/RequestSong';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sessions, Users } from '@prisma/client';
import { useAlert } from '@/hooks/useAlert';
import UserContext from '@/providers/UserContext';

export default function SessionPage() {
  const alert = useAlert();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [activeTemporarySession, setActiveTemporarySession] = useState<sessions | null>(null);
  const [temporarySessionFriend, setTemporarySessionFriend] = useState<Users | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      console.log('[Session Page] Checking session:', sessionId);

      // Show alert loading
      alert.fire({
        title: 'Joining Session',
        text: 'Please wait while we check the session...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false
      });

      try {
        console.log('[Session Page] Fetching session from API...');
        let response = await fetch('/api/database/sessions?SessionID=' + sessionId);
        let data = await response.json();
        console.log('[Session Page] Session data:', data);

        // Check if the session exists
        if (!data) {
          alert.close();
          setError('Session Not Found. Ask your friend to create a new one.');
          setLoading(false);
          return;
        }

        // Check if the session is active
        const expirationDate = new Date(data.expiration_date);
        if (expirationDate < new Date()) {
          alert.close();
          setError(`Session expired at ${expirationDate.toLocaleDateString()} at ${expirationDate.toLocaleTimeString()}. Ask your friend to create a new one.`);
          setLoading(false);
          return;
        }

        // Get the friend's user info
        response = await fetch('/api/database/users?UserID=' + data.user_id);
        if (response.status === 500) {
          alert.close();
          setError('Error loading session. Please try again.');
          setLoading(false);
          return;
        }
        let friendData = await response.json();
        if (!friendData) {
          alert.close();
          setError('Could not load user information. Please try again.');
          setLoading(false);
          return;
        }

        // Cancel alert
        alert.close();
        setTemporarySessionFriend(friendData);
        setActiveTemporarySession(data);
        setLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        alert.close();
        setError('There was an error joining the session. Please try again.');
        setLoading(false);
      }
    };

    if (sessionId) {
      checkSession();
    }
  }, [sessionId, router, alert]);

  const exitSession = () => {
    router.push('/');
  };

  if (loading) {
    return <Loading />;
  }

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
