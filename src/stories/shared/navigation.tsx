import React from 'react';
import StorageIcon from '@mui/icons-material/Storage';
import GroupIcon from '@mui/icons-material/Group';
import PublishIcon from '@mui/icons-material/Publish';
import LinkIcon from '@mui/icons-material/Link';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import SearchIcon from '@mui/icons-material/Search';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import HelpIcon from '@mui/icons-material/Help';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import DocumentationIcon from '@mui/icons-material/Description';
import InfoIcon from '@mui/icons-material/Info';
import DiamondIcon from '@mui/icons-material/Diamond';
import {
  DOCS_URL,
  ABOUT_URL,
  OPEN_SOURCE_URL,
  SUPPORT_EMAIL,
  DISCORD_URL,
  STORAGE_MANAGEMENT_URL,
  GROUP_MANAGEMENT_URL,
  DATA_PUBLICATION_URL,
  SCIENCE_PORTAL_URL,
  CADC_SEARCH_URL,
  OPENSTACK_CLOUD_URL,
  UPDATE_PROFILE_URL,
  RESET_PASSWORD_URL,
  CERTIFICATE_BASE_URL,
} from '@/lib/config/site-config';
// Navigation items structure
export interface NavigationItem {
  label: string;
  icon?: React.ReactElement;
  href?: string;
  menuItems?: NavigationItem[];
  divider?: boolean;
  type: 'link' | 'menu';
}

// Main navigation array
export const navigationItems: NavigationItem[] = [
  {
    label: 'Documentation',
    icon: <DocumentationIcon />,
    href: DOCS_URL,
    type: 'link',
  },
  {
    label: 'Services',
    type: 'menu',
    menuItems: [
      {
        label: 'Storage Management',
        icon: <StorageIcon />,
        href: STORAGE_MANAGEMENT_URL,
        type: 'link',
      },
      {
        label: 'Group Management',
        icon: <GroupIcon />,
        href: GROUP_MANAGEMENT_URL,
        type: 'link',
      },
      {
        label: 'Data Publication',
        icon: <LinkIcon />,
        href: DATA_PUBLICATION_URL,
        type: 'link',
      },
      {
        label: 'Science Portal',
        icon: <ViewInArIcon />,
        href: SCIENCE_PORTAL_URL,
        type: 'link',
      },
      { label: 'CADC Search', icon: <SearchIcon />, href: CADC_SEARCH_URL, type: 'link' },
      {
        label: 'OpenStack Cloud',
        icon: <PowerSettingsNewIcon />,
        href: OPENSTACK_CLOUD_URL,
        type: 'link',
      },
    ],
  },
  {
    label: 'About',
    icon: <InfoIcon />,
    href: ABOUT_URL,
    type: 'link',
  },
  {
    label: 'Open Source',
    icon: <DiamondIcon />,
    href: OPEN_SOURCE_URL,
    type: 'link',
  },
  {
    label: 'Support',
    type: 'menu',
    menuItems: [
      { label: 'Help', icon: <HelpIcon />, href: SUPPORT_EMAIL, type: 'link' },
      {
        label: 'Join us on Discord',
        icon: <ChatIcon />,
        href: DISCORD_URL,
        type: 'link',
      },
    ],
  },
];

// User account menu items
export const userMenuItems: NavigationItem[] = [
  {
    label: 'Update Profile',
    icon: <AccountCircleIcon />,
    href: UPDATE_PROFILE_URL,
    type: 'link',
  },
  {
    label: 'Reset Password',
    icon: <SettingsIcon />,
    href: RESET_PASSWORD_URL,
    type: 'link'
  },
  {
    label: 'Obtain Certificate',
    icon: <PublishIcon />,
    href: CERTIFICATE_BASE_URL, // Will be dynamically overridden in AppBar
    type: 'link',
  },
  {
    label: 'Logout',
    icon: <LogoutIcon />,
    href: '#',
    type: 'link',
    divider: true,
  },
];

// Helper functions to extract specific menu items for backward compatibility
export const getServicesMenuItems = () =>
  navigationItems.find((item) => item.label === 'Services')?.menuItems || [];

export const getSupportMenuItems = () =>
  navigationItems.find((item) => item.label === 'Support')?.menuItems || [];

// CANFAR logo component
export const CanfarLogo = ({ height = 40 }: { height?: number }) => (
  /* eslint-disable-next-line @next/next/no-img-element */
  <img src="/logo.png" alt="CANFAR Logo" style={{ height }} />
);

// SRCNet logo component (for OIDC mode)
export const SRCNetLogo = ({ height = 40 }: { height?: number }) => (
  /* eslint-disable-next-line @next/next/no-img-element */
  <img src="/SRCNetLogo.png" alt="SRCNet Logo" style={{ height }} />
);

// Convert navigation items to AppBar format
export const getAppBarLinks = () =>
  navigationItems.map((item) => ({
    label: item.label,
    href: item.type === 'link' ? item.href : undefined,
    menuItems:
      item.type === 'menu'
        ? item.menuItems?.map((subItem) => ({
            label: subItem.label,
            icon: subItem.icon,
            href: subItem.href,
          }))
        : undefined,
  }));

// Complete navigation structure for AppBar
export const defaultAppBarNavigation = {
  logo: <CanfarLogo />,
  links: getAppBarLinks(),
};

// Navigation structure with user menu for AppBar
export const appBarWithUserMenu = {
  ...defaultAppBarNavigation,
  menuLabel: 'janedoe',
  menuItems: userMenuItems.map((item) => ({
    label: item.label,
    icon: item.icon,
    href: item.href,
    divider: item.divider,
  })),
};
