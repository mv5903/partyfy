'use client';

import Loading from '@/components/misc/Loading';
import RequestSong from '@/components/request/RequestSong';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sessions, Users } from '@prisma/client';
import { useAlert } from '@/hooks/useAlert';

export default function SessionPage() {
  const alert = useAlert();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [activeTemporarySession, setActiveTemporarySession] = useState<sessions | null>(null);
  const [temporarySessionFriend, setTemporarySessionFriend] = useState<Users | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // Show alert loading
      alert.fire({
        title: 'Joining Session',
        text: 'Please wait while we check the session...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false
      });

      try {
        let response = await fetch('/api/database/sessions?SessionID=' + sessionId);
        let data = await response.json();

        // Check if the session exists
        if (!data) {
          await alert.fire({
            title: 'Session Not Found',
            text: 'The session you tried to join does not exist. Ask your friend to create a new one.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
          router.push('/');
          return;
        }

        // Check if the session is active
        const expirationDate = new Date(data.expiration_date);
        if (expirationDate < new Date()) {
          await alert.fire({
            title: 'Session Expired',
            text: `The session you tried to join expired at ${expirationDate.toLocaleDateString()} at ${expirationDate.toLocaleTimeString()}. Ask your friend to create a new one.`,
            icon: 'error',
            confirmButtonText: 'OK'
          });
          router.push('/');
          return;
        }

        // Get the friend's user info
        response = await fetch('/api/database/users?UserID=' + data.user_id);
        if (response.status === 500) {
          router.push('/');
          return;
        }
        let friendData = await response.json();
        if (!friendData) {
          router.push('/');
          return;
        }

        // Cancel alert
        alert.close();
        setTemporarySessionFriend(friendData);
        setActiveTemporarySession(data);
        setLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        await alert.fire({
          title: 'Error',
          text: 'There was an error joining the session.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        router.push('/');
      }
    };

    if (sessionId) {
      checkSession();
    }
  }, [sessionId, router]);

  const exitSession = () => {
    router.push('/');
  };

  if (loading || !activeTemporarySession || !temporarySessionFriend) {
    return <Loading />;
  }

  return (
    <div className='text-white text-center'>
      <RequestSong
        currentFriend={temporarySessionFriend}
        setCurrentFriend={null}
        temporarySession={activeTemporarySession}
        exitSession={exitSession}
      />
      <alert.AlertComponent />
    </div>
  );
}
