'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { usePathname } from 'next/navigation';

const NavBarItem = ({ children, href, className, icon, tabIndex, testId } : { children : any, href : any, className : any, icon : any, tabIndex : any, testId : any }) => {
  const pathname = usePathname();
  const activeClass = 'navbar-item-active';
  const activeClasses = className ? `${className} ${activeClass}` : activeClass;

  return (
    <span className="d-inline-flex align-items-center navbar-item">
      {icon && <FontAwesomeIcon icon={icon} className="mr-3" />}
      <span className={pathname === href ? activeClasses : className} tabIndex={tabIndex} data-testid={testId}>
        {children}
      </span>
    </span>
  );
};

export default NavBarItem;