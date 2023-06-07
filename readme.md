## Party Screen with song requests!

This is a simple party screen that allows you to request songs to be played at the party. It is a simple web app that uses the Spotify API to search for songs and add them to a playlist. It allows users to easily request songs to be played at the party, which are added to the owner's Spotify queue. 

This project also aims to be a great replacement to Spotify's Group Session functionality, which in my opinion, is very annoying. It requires the user to keep sending invites, frequent disconnections, music skipping back and forth in time, and much more.

Because this application only relies on one person playing music on Spotify, outside users can easily view and add to their queue very easily.

## Limitations
Sadly some of the most requested features are currently impossible due to the current version of Spotify's API. They currently do not provide endpoints for the following actions:
1. Deleting an item from the queue
2. Rearranging items in the queue
3. Keeping the queue just the queue, not a combination of the queue (which is always at the top, luckily) and items that will play next based on the playlist content is being streamed from.

These items will be implemented as soon as I hear back from Spotify and have access to this. Thank you for understanding.

# Initial Release 5/29/23: v2.0
### You can now set up "unattended queues" and send requests to your friends
Have both of your friends sign into the app, set up a username, authenticate with Spotify, then add your friends through the friends icon on the top right. Be sure to enable "unattended queues", which will allow your friends to search Spotify for a song and add it to your queue.

## Why can't I queue anything?
The page to get my app into production mode on Spotify's Developer Dashboard is currently broken, so the app may not work as intended. I aplogogize and will get that working as soon as I can.

