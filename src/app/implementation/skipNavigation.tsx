'use client';

import React from 'react';
import { Box, Link } from '@mui/material';
import { SkipNavigationProps } from '@/app/types/SkipNavigationProps';

export const SkipNavigationImpl: React.FC<SkipNavigationProps> = ({
  skipToId = 'main-content',
  label = 'Skip to main content',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetElement = document.getElementById(skipToId);
    if (targetElement) {
      targetElement.tabIndex = -1;
      targetElement.focus();
      targetElement.scrollIntoView();
    }
  };

  return (
    <Box
      component="nav"
      aria-label="Skip navigation"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: (theme) => theme.zIndex.tooltip + 1, // Above everything else
      }}
    >
      <Link
        href={`#${skipToId}`}
        onClick={handleClick}
        sx={{
          position: 'absolute',
          left: '-10000px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          textDecoration: 'none',
          padding: 2,
          borderRadius: 1,
          fontSize: '1rem',
          fontWeight: 'medium',

          // When focused, make it visible
          '&:focus': {
            position: 'fixed',
            left: '8px',
            top: '8px',
            width: 'auto',
            height: 'auto',
            overflow: 'visible',
            zIndex: (theme) => theme.zIndex.tooltip + 1,
            boxShadow: (theme) => theme.shadows[4],
            outline: '2px solid',
            outlineColor: 'primary.dark',
            outlineOffset: '2px',
          },

          // Ensure good contrast on hover
          '&:hover': {
            backgroundColor: 'primary.dark',
            textDecoration: 'underline',
          },

          // High contrast mode support
          '@media (prefers-contrast: high)': {
            '&:focus': {
              outline: '3px solid',
              outlineOffset: '3px',
            },
          },
        }}
      >
        {label}
      </Link>
    </Box>
  );
};
