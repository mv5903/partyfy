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
    <div className='mt-[25%]'>
      <main className='flex flex-col justify-start gap-12 h-[90vh] w-[85vw] max-w-lg mx-auto'>
        <div className='flex mx-auto'>
          <img className='object-center' src='/logo.png' width="200px" alt="Partyfy Logo" />
        </div>
        <p className="text-center text-md m-3 leading-normal">
          Add to your friend's Spotify queue without accessing their session directly.
        </p>
        <div className='flex justify-center mt-8'>
          <Button
           size='lg'>
            <AnchorLink
              href="/api/auth/login"
              className="text-white "
              tabIndex={0}
              testId="navbar-login-desktop"
              icon={null}>
              <span className='text-lg'>Log In / Sign Up</span>
            </AnchorLink>
          </Button>
        </div>
      </main>
    </div>
  );
}
