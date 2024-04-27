# Partyfy

### Installation
- iOS: On the App Store - [Partyfy - Queue Management](https://apps.apple.com/us/app/partyfy-queue-management/id6463042237)
- Android: Install the PWA by visiting [the mobile website](https://partyfy.mattvandenberg.com/) and adding it to your home screen
- Other devices: Visit [Partyfy on the Web](https://partyfy.mattvandenberg.com/)

Notice how you'll never need to install an update since the iOS app is just a wrapper for the PWA thanks to [PWA Builder](https://www.pwabuilder.com/). This means that you'll always have the latest version of Partyfy, no matter what device you're on.

### Features
- **Queue Management**: Add songs to their queue just by adding your friends and asking them to turn on *unattended queues*. This allows you to add songs to your friend's queue without them having to do anything. This is perfect for parties, road trips, or any other situation where you want to share the music selection with others.
- **Queue from Anywhere**: Add songs to the queue from any device, whether it's a phone, tablet, or computer. Add from Spotify search, your playlists, or liked songs (coming soon). 
- **Queue Visibility**: See the queue in real-time, with the ability to see the next 20 upcoming songs.
- **One-time QR Code (Beta, initial release 4/27/24)**: Generate a QR code that your friends can scan to join the queue, or copy the link. This will be useful for parties where you don't want to add everyone as a friend or need people to sign up.

### Upcoming Features
I'm a solo developer finishing college and I have a part-time job, so I can't work on these as fast as I want to. Here are some of the features I have planned for the future (I will update this list as I complete them):
- **Back Button**: Use your device's back button to go back to the previous page. Currently, you have to use the back button in the app, and using your device's back button will cause unexpected behavior.
- **Liked Songs**: Add songs to the queue from your liked songs. (Development finished, awaiting Spotify API approval)
- **Previously Queued Songs**: See the songs that have already been played in the queue.

### Known Free Account Limitations
When linking a Spotify free account, functionality is limited (I have no control over this):
- Friends of a free account user cannot add songs to the queue.
- Friends of a free account user cannot see the queue.

### Limitations
Unfortunately, some of the most requested features are currently impossible due to the current version of Spotify's API. They currently do not provide endpoints for the following actions:
1. Deleting an item from the queue
2. Rearranging items in the queue
3. Keeping the queue just the queue, not a combination of the queue (which is always at the top, luckily) and items that will play next based on the playlist content is being streamed from.

### Stack
For those who are curious, here is a general overview of the stack used to create this application:
- Frontend: React with Typescript
- Backend: Node.js with Express using the Next.js framework
- Database: Vercel's PostgreSQL database with Prisma ORM for Typescript
- Authentication: Auth0
- Hosting: Vercel
