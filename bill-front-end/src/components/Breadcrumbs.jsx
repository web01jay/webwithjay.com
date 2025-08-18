import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbNameMap = {
    '/': 'Dashboard',
    '/products': 'Products',
    '/clients': 'Clients',
    '/invoices': 'Invoices',
  };

  return (
    <Box sx={{ py: 2, px: 3 }}>
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        <Link
          component={RouterLink}
          to="/"
          color="inherit"
          underline="hover"
        >
          Dashboard
        </Link>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const breadcrumbName = breadcrumbNameMap[to] || value;

          return last ? (
            <Typography color="text.primary" key={to}>
              {breadcrumbName}
            </Typography>
          ) : (
            <Link
              component={RouterLink}
              to={to}
              key={to}
              color="inherit"
              underline="hover"
            >
              {breadcrumbName}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;