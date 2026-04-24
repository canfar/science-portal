import type { AppBarLink } from '@/app/types/AppBarProps';
import type { ServiceNavUrls } from '@/lib/config/public-runtime-config';

const SERVICE_MENU_LABEL_TO_KEY: Record<string, keyof ServiceNavUrls> = {
  'Storage Management': 'storageManagement',
  'Group Management': 'groupManagement',
  'Data Publication': 'dataPublication',
  'Science Portal': 'sciencePortal',
  'CADC Search': 'cadcSearch',
  'OpenStack Cloud': 'openstackCloud',
};

/**
 * Replaces hrefs in the AppBar "Services" submenu with runtime `serviceUrls` by menu item label.
 */
export function applyServiceNavUrlsToAppBarLinks(
  links: AppBarLink[],
  serviceUrls: ServiceNavUrls,
): AppBarLink[] {
  return links.map((item) => {
    if (item.label !== 'Services' || !item.menuItems) {
      return item;
    }
    return {
      ...item,
      menuItems: item.menuItems.map((sub) => {
        const key = SERVICE_MENU_LABEL_TO_KEY[sub.label];
        if (key) {
          return { ...sub, href: serviceUrls[key] };
        }
        return sub;
      }),
    };
  });
}
