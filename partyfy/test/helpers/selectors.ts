/**
 * Test selectors based on translation keys.
 * These match the structure in i18n/en-US.json
 *
 * Usage:
 * import { selectors } from './helpers/selectors';
 * await page.getByTestId(selectors.buttons.save).click();
 */

export const selectors = {
  // Common buttons
  buttons: {
    save: 'common.buttons.save',
    cancel: 'common.buttons.cancel',
    ok: 'common.buttons.ok',
    yes: 'common.buttons.yes',
    no: 'common.buttons.no',
    create: 'common.buttons.create',
    delete: 'common.buttons.delete',
    remove: 'common.buttons.remove',
    addIt: 'common.buttons.addIt',
    goBack: 'common.buttons.goBack',
    grantPermission: 'common.buttons.grantPermission',
  },

  // Pages
  landing: {
    title: 'pages.landing.title',
    description: 'pages.landing.description',
    loginButton: 'pages.landing.loginButton',
  },

  dashboard: {
    almostReady: 'pages.dashboard.almostReady',
    authenticateSpotify: 'pages.dashboard.authenticateSpotify',
  },

  // Request component
  request: {
    controlling: 'components.request.controlling',
    queueQuotaRemaining: 'components.request.queueQuotaRemaining',
    queueQuotaTimeRemaining: 'components.request.queueQuotaTimeRemaining',
    addSong: 'components.request.addSong',
    tabs: {
      search: 'components.request.tabs.search',
      yourMusic: 'components.request.tabs.yourMusic',
      session: 'components.request.tabs.session',
    },
  },

  // Select friend component
  selectFriend: {
    addTo: 'components.selectFriend.addTo',
    noFriends: 'components.selectFriend.noFriends',
    remoteQueuesEnabled: 'components.selectFriend.remoteQueuesEnabled',
    remoteQueuesDisabled: 'components.selectFriend.remoteQueuesDisabled',
    commercialOptions: 'components.selectFriend.commercialOptions',
    queueLimit: 'components.selectFriend.queueLimit',
  },

  // Friends component
  friends: {
    title: 'components.friends.title',
    findSomeone: 'components.friends.findSomeone',
    incomingRequests: 'components.friends.incomingRequests',
    outgoingRequests: 'components.friends.outgoingRequests',
    noFriends: 'components.friends.noFriends',
    addFriends: 'components.friends.addFriends',
  },

  // QR component
  qr: {
    title: 'components.qr.title',
    scanPrompt: 'components.qr.scanPrompt',
    createPrompt: 'components.qr.createPrompt',
  },

  // Settings
  settings: {
    title: 'components.settings.title',
    deleteAccount: 'components.settings.deleteAccount',
    changeUsername: 'components.settings.changeUsername',
    unlinkSpotify: 'components.settings.unlinkSpotify',
    logout: 'components.settings.logout',
  },

  // Host component
  host: {
    options: 'components.host.options',
    nowPlaying: 'components.host.nowPlaying',
    upNext: 'components.host.upNext',
    recentlyPlayed: 'components.host.recentlyPlayed',
    clearQueue: 'components.host.clearQueue',
    clearRecentlyPlayed: 'components.host.clearRecentlyPlayed',
  },

  // Session component
  session: {
    noActiveSession: 'components.session.noActiveSession',
    autoRefresh: 'components.session.autoRefresh',
    nothingPlaying: 'components.session.nothingPlaying',
    next: 'components.session.next',
    noQueue: 'components.session.noQueue',
  },

  // Playlists
  playlists: {
    yourMusic: 'components.playlists.yourMusic',
    noSongsQueued: 'components.playlists.noSongsQueued',
    endOfList: 'components.playlists.endOfList',
    emptyPlaylist: 'components.playlists.emptyPlaylist',
  },
} as const;

/**
 * Type-safe selector getter
 */
export type SelectorPath = typeof selectors;

/**
 * Helper to get nested selector value
 */
export function getSelector(path: string): string {
  return path;
}
