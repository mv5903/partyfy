'use client';

import AnchorLink from '@/components/misc/AnchorLink';
import { Button } from '@/components/ui/button';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Music2, Users, Share2, Smartphone, Sparkles, Zap } from 'lucide-react';
import { FaToggleOff } from 'react-icons/fa';

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
    <main className='flex flex-col min-h-screen'>
      {/* Hero Section */}
      <section className='flex flex-col items-center justify-center px-6 py-20 md:py-32 max-w-6xl mx-auto w-full'>
        <div className='flex items-center justify-center mb-8 animate-wave'>
          <img className='object-center rounded-full shadow-2xl bg-stone-900' src='/logo.png' width="120px" alt="Partyfy Logo" />
        </div>

        <h1 className='text-5xl md:text-7xl font-bold text-white text-center mb-6 bg-clip-text'>
          Partyfy
        </h1>

        <p className="text-xl md:text-2xl text-center text-gray-300 mb-4 max-w-3xl leading-relaxed">
          Share your Spotify queue instantly. No passwords. Full control.
        </p>

        <p className="text-base md:text-lg text-center text-gray-400 mb-12 max-w-2xl">
          Share a QR code or link for one-time sessions, or add friends permanently for ongoing access. You stay in control with a kill switch to disable remote queues anytime.
        </p>

        <div className='flex flex-col sm:flex-row gap-4'>
          <Button
            className='bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all'
            size='lg'>
            <AnchorLink
              href="/api/auth/signup"
              className="text-white"
              tabIndex={0}
              testId="navbar-signup-desktop"
              icon={null}>
              Sign Up Free
            </AnchorLink>
          </Button>
          <Button
            className='bg-transparent border-2 border-gray-600 hover:border-gray-400 text-white px-8 py-6 text-lg font-semibold'
            size='lg'
            variant='outline'>
            <AnchorLink
              href="/api/auth/login"
              className="text-white"
              tabIndex={0}
              testId="navbar-login-desktop"
              icon={null}>
              Log In
            </AnchorLink>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className='px-6 py-20 bg-black/20 backdrop-blur-sm'>
        <div className='max-w-6xl mx-auto'>
          <h2 className='text-3xl md:text-4xl font-bold text-white text-center mb-4'>
            Why Partyfy?
          </h2>
          <p className='text-gray-400 text-center mb-16 max-w-2xl mx-auto'>
            The easiest way to share music control with friends without compromising privacy
          </p>

          <div className='grid md:grid-cols-3 gap-8'>
            <div className='flex flex-col items-center text-center p-6 rounded-lg bg-stone-900/50 backdrop-blur-sm border border-stone-800 hover:border-stone-600 transition-all'>
              <div className='bg-green-600/20 p-4 rounded-full mb-4'>
                <Share2 className='w-8 h-8 text-green-500' />
              </div>
              <h3 className='text-xl font-semibold text-white mb-3'>Flexible Sharing</h3>
              <p className='text-gray-400'>
                Share a QR code or link for temporary sessions, perfect for parties. Or add friends permanently for ongoing access.
              </p>
            </div>

            <div className='flex flex-col items-center text-center p-6 rounded-lg bg-stone-900/50 backdrop-blur-sm border border-stone-800 hover:border-stone-600 transition-all'>
              <div className='bg-purple-600/20 p-4 rounded-full mb-4'>
                <Users className='w-8 h-8 text-purple-500' />
              </div>
              <h3 className='text-xl font-semibold text-white mb-3'>Always In Control</h3>
              <p className='text-gray-400'>
                Kill switch lets you disable remote queues instantly. No password sharing needed. Your account stays secure.
              </p>
            </div>

            <div className='flex flex-col items-center text-center p-6 rounded-lg bg-stone-900/50 backdrop-blur-sm border border-stone-800 hover:border-stone-600 transition-all'>
              <div className='bg-blue-600/20 p-4 rounded-full mb-4'>
                <Zap className='w-8 h-8 text-blue-500' />
              </div>
              <h3 className='text-xl font-semibold text-white mb-3'>Real-Time Updates</h3>
              <p className='text-gray-400'>
                Songs appear in your queue instantly. Watch as your friends add their favorite tracks in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot Section - PLACEHOLDER FOR YOUR SCREENSHOTS */}
      <section className='px-6 py-20'>
        <div className='max-w-6xl mx-auto'>
          <h2 className='text-3xl md:text-4xl font-bold text-white text-center mb-4'>
            See It In Action
          </h2>
          <p className='text-gray-400 text-center mb-16 max-w-2xl mx-auto'>
            Beautiful, intuitive interface designed for seamless music sharing
          </p>

          <div className="flex flex-col gap-8">
            <div className='rounded-lg bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700 p-8  flex items-center justify-center'>
              <div className='text-center flex flex-col gap-3'>
                <p className='text-lg text-white mt-2'><strong>Add from your music</strong></p>
                <img className='object-center rounded-lg shadow-lg w-[80vh]' src='/music.png' alt="Dashboard Screenshot Placeholder" />
              </div>
            </div>

            <div className='rounded-lg bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700 p-8  flex items-center justify-center'>
              <div className='text-center flex flex-col gap-3'>
                <p className='text-lg text-white mt-2'><strong>Add your friends</strong></p>
                <img className='object-center rounded-lg shadow-lg w-[80vh]' src='/friends.gif' alt="Dashboard Screenshot Placeholder" />
              </div>
            </div>

            <div className='rounded-lg bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700 p-8  flex items-center justify-center'>
              <div className='text-center flex flex-col gap-3'>
                <p className='text-lg text-white mt-2'><strong>See your friends' queues</strong></p>
                <img className='object-center rounded-lg shadow-lg w-[80vh]' src='/queue.png' alt="Dashboard Screenshot Placeholder" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='px-6 py-20 bg-black/20 backdrop-blur-sm'>
        <div className='max-w-6xl mx-auto'>
          <h2 className='text-3xl md:text-4xl font-bold text-white text-center mb-16'>
            How It Works
          </h2>

          <div className='grid md:grid-cols-4 gap-8'>
            <div className='flex flex-col items-center text-center'>
              <div className='w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4'>
                1
              </div>
              <h3 className='text-xl font-semibold text-white mb-3'>Connect Spotify</h3>
              <p className='text-gray-400'>
                Sign in with your Spotify account and start your session
              </p>
            </div>

            <div className='flex flex-col items-center text-center'>
              <div className='w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4'>
                2
              </div>
              <h3 className='text-xl font-semibold text-white mb-3'>Choose Your Style</h3>
              <p className='text-gray-400'>
                Share a QR code or link for one-time access, or add friends for permanent access
              </p>
            </div>

            <div className='flex flex-col items-center text-center'>
              <div className='w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4'>
                3
              </div>
              <h3 className='text-xl font-semibold text-white mb-3'>Let Them Queue</h3>
              <p className='text-gray-400'>
                Friends add songs directly to your Spotify queue in real-time
              </p>
            </div>

            <div className='flex flex-col items-center text-center'>
              <div className='w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4'>
                <FaToggleOff className='w-8 h-8' />
              </div>
              <h3 className='text-xl font-semibold text-white mb-3'>Use Kill Switch</h3>
              <p className='text-gray-400'>
                Disable remote access anytime with one tap
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='px-6 py-20'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-3xl md:text-5xl font-bold text-white mb-6'>
            Ready to Share the Music?
          </h2>
          <p className='text-xl text-gray-300 mb-10'>
            Join thousands of users creating the perfect playlist together
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button
              className='bg-green-600 hover:bg-green-700 text-white px-10 py-7 text-xl font-semibold shadow-2xl hover:shadow-green-600/50 transition-all'
              size='lg'>
              <AnchorLink
                href="/api/auth/signup"
                className="text-white"
                tabIndex={0}
                testId="navbar-signup-cta"
                icon={null}>
                Sign Up Free
              </AnchorLink>
            </Button>
            <Button
              className='bg-transparent border-2 border-gray-600 hover:border-gray-400 text-white px-10 py-7 text-xl font-semibold'
              size='lg'
              variant='outline'>
              <AnchorLink
                href="/api/auth/login"
                className="text-white"
                tabIndex={0}
                testId="navbar-login-cta"
                icon={null}>
                Log In
              </AnchorLink>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='px-6 py-8 border-t border-stone-800 mt-auto'>
        <div className='max-w-6xl mx-auto text-center text-gray-500 text-sm'>
          <p>&copy; 2025-2026 Partyfy. Made for music lovers.</p>
        </div>
      </footer>
    </main>
  );
}
