'use client';

import AnchorLink from '@/components/misc/AnchorLink';
import { Button } from '@/components/ui/button';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Redirect authenticated users to dashboard
      router.push('/dashboard');
    }
  }, [user, router]);

  if (isLoading || user) {
    return null; // Show nothing while loading or redirecting
  }

  return (
    <main className='flex flex-col justify-start mt-12 gap-24 h-full w-[85vw] max-w-lg mx-auto'>
      <div className='flex mx-auto'>
        <img className='object-center rounded-full' src='/logo.png' width="100px" alt="Partyfy Logo" />
        <h1 className='text-5xl font-bold text-white self-center ml-4'>Partyfy</h1>
      </div>

      <p className="text-center text-md m-3 leading-normal">
        Add to your friend's Spotify queue without accessing their session directly.
      </p>
      <div className='flex justify-center mt-8'>
        <Button
          className='bg-stone-700'
          size='lg'>
          <AnchorLink
            href="/api/auth/login"
            className="text-white "
            tabIndex={0}
            testId="navbar-login-desktop"
            icon={null}>
            <span className='text-lg text-white'>Log In / Sign Up</span>
          </AnchorLink>
        </Button>
      </div>
    </main>
  );
}
