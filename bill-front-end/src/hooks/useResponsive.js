import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

const useResponsive = () => {
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getBreakpoint = () => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    if (isLargeDesktop) return 'largeDesktop';
    return 'desktop';
  };

  const getGridColumns = (mobileColumns = 1, tabletColumns = 2, desktopColumns = 3) => {
    if (isMobile) return mobileColumns;
    if (isTablet) return tabletColumns;
    return desktopColumns;
  };

  const getTablePageSize = () => {
    if (isMobile) return 5;
    if (isTablet) return 10;
    return 25;
  };

  const shouldShowSidebar = () => {
    return !isMobile;
  };

  const getModalWidth = () => {
    if (isMobile) return '95%';
    if (isTablet) return '80%';
    return '60%';
  };

  const getCardSpacing = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 3;
  };

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    screenSize,
    breakpoint: getBreakpoint(),
    getGridColumns,
    getTablePageSize,
    shouldShowSidebar,
    getModalWidth,
    getCardSpacing
  };
};

export default useResponsive;