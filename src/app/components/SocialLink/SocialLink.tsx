'use client';

import React from 'react';
import { IconButton } from '@/app/components/IconButton/IconButton';
import { Tooltip } from '@/app/components/Tooltip/Tooltip';
import { SvgIconProps } from '@mui/material';

export interface SocialLinkProps {
  href: string;
  icon: React.ReactElement<SvgIconProps>;
  tooltip: string;
  ariaLabel: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SocialLink: React.FC<SocialLinkProps> = ({
  href,
  icon,
  tooltip,
  ariaLabel,
  size = 'lg',
}) => {
  const iconSizeMap = {
    sm: 'small' as const,
    md: 'medium' as const,
    lg: 'large' as const,
  };

  const iconElement = React.cloneElement(icon, {
    fontSize: iconSizeMap[size],
  });

  return (
    <Tooltip title={tooltip} placement="top">
      <IconButton
        aria-label={ariaLabel}
        size={size}
        color="default"
        onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
        sx={{
          '&:hover': {
            color: 'primary.main',
          },
        }}
      >
        {iconElement}
      </IconButton>
    </Tooltip>
  );
};
