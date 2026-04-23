import { SidebarItemsType } from './types';
import SidebarNavListItem from './SidebarNavListItem';
import SidebarNavList from './SidebarNavList';

interface ReduceChildRoutesProps {
  depth: number;
  page: SidebarItemsType;
  items: JSX.Element[];
  currentRoute: string;
  onClick: () => void;
}

const reduceChildRoutes = ({
  items,
  page,
  depth,
  currentRoute,
  onClick
}: ReduceChildRoutesProps): JSX.Element[] => {
  const isActive = currentRoute === page.href;

  if (page.children) {
    const isOpen = page.children.find((children) => children.href === currentRoute);

    items.push(
      <SidebarNavListItem
        depth={depth}
        icon={page.icon}
        key={page.title}
        badge={page.badge}
        open={!!isOpen}
        title={page.title}
        href={page.href}
        isActive={isActive}
        id={page.id}
        onClick={onClick}>
        <SidebarNavList depth={depth + 1} pages={page.children} onClick={onClick} />
      </SidebarNavListItem>
    );
  } else {
    items.push(
      <SidebarNavListItem
        depth={depth}
        href={page.href}
        icon={page.icon}
        key={page.title}
        badge={page.badge}
        title={page.title}
        isActive={isActive}
        id={page.id}
        onClick={onClick}
      />
    );
  }

  return items;
};

export default reduceChildRoutes;
