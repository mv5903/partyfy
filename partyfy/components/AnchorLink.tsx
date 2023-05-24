import React from 'react';

import NavBarItem from './NavBarItem';

const AnchorLink = ({ children, href, className, icon, tabIndex, testId } : { children : string, href : string, className : string, icon : any, tabIndex : any, testId : any }) => {
  return (
    <a href={href}>
      <NavBarItem href={href} className={className} icon={icon} tabIndex={tabIndex} testId={testId}>
        {children}
      </NavBarItem>
    </a>
  );
};

export default AnchorLink;
