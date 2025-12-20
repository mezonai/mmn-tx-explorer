import Link from 'next/link';
import { navGroupItems, NavItem } from '../layout/navigation/nav-items';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../ui/navigation-menu';
import { cn } from '@/lib/utils';
import { useRouteMatcher } from '@/hooks';

function NavbarItem({ item }: { item: NavItem }) {
  const isActive = useRouteMatcher(item.href);
  return (
    <Link
      key={item.href}
      href={item.href}
      target={item.target}
      className={cn(
        'hover:bg-sidebar-accent focus:bg-accent focus:text-accent-foreground hover:text-primary block cursor-pointer space-y-1 rounded-sm px-4 py-3 text-sm leading-none no-underline transition-colors outline-none select-none',
        isActive ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      {item.title}
    </Link>
  );
}

function NavbarMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {navGroupItems.map((item) => (
          <NavigationMenuItem key={item.title} className="relative">
            <NavigationMenuTrigger className="group hover:text-primary text-secondary-foreground flex items-center justify-between gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none select-none">
              {item.title}
            </NavigationMenuTrigger>
            <NavigationMenuContent className="bg-background min-w-56 p-3">
              <div className="flex flex-col">
                {item.items?.map((subItem) => (
                  <NavigationMenuLink asChild key={subItem.title}>
                    <NavbarItem item={subItem} />
                  </NavigationMenuLink>
                ))}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export { NavbarItem, NavbarMenu };
