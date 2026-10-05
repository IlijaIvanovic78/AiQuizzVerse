import { itemIconUrl } from '../shared/icons';

interface NavLink {
  path: string;
  label: string;
}

export const MAIN_LINKS: NavLink[] = [
  { path: '/home', label: 'Home' },
  { path: '/create', label: 'Create' },
  { path: '/library', label: 'Library' },
  { path: '/paths', label: 'Paths' },
  { path: '/review', label: 'Review' },
  { path: '/friends', label: 'Friends' },
  { path: '/shop', label: 'Shop' },
  { path: '/leaderboard', label: 'Leaderboard' },
];

interface PhoneTab extends NavLink {
  // Tabs without an icon show the player's own hero.
  icon: string | null;
}

export const PHONE_TABS: PhoneTab[] = [
  { path: '/home', label: 'Home', icon: itemIconUrl('shield') },
  { path: '/library', label: 'Library', icon: itemIconUrl('chest') },
  { path: '/paths', label: 'Paths', icon: itemIconUrl('sword') },
  { path: '/review', label: 'Review', icon: itemIconUrl('potion') },
  { path: '/profile', label: 'Profile', icon: null },
];

// On phones the account menu offers the pages that have no tab in the bottom bar.
export const PHONE_MENU_LINKS: NavLink[] = MAIN_LINKS.filter(
  (link) => !PHONE_TABS.some((tab) => tab.path === link.path),
);
