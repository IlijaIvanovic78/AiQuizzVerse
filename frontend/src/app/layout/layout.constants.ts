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

// Phones show Home, Library, Paths, Review and Profile in the bottom tab bar,
// so the account menu offers the remaining pages there.
export const PHONE_MENU_LINKS: NavLink[] = [
  { path: '/create', label: 'Create' },
  { path: '/friends', label: 'Friends' },
  { path: '/shop', label: 'Shop' },
  { path: '/leaderboard', label: 'Leaderboard' },
];

interface PhoneTab extends NavLink {
  // Tabs without an icon show the player's own hero.
  icon: string | null;
}

export const PHONE_TABS: PhoneTab[] = [
  { path: '/home', label: 'Home', icon: '/assets/images/icons/shield.webp' },
  { path: '/library', label: 'Library', icon: '/assets/images/icons/chest.webp' },
  { path: '/paths', label: 'Paths', icon: '/assets/images/icons/sword.webp' },
  { path: '/review', label: 'Review', icon: '/assets/images/icons/potion.webp' },
  { path: '/profile', label: 'Profile', icon: null },
];
