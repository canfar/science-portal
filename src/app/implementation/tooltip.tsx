'use client';

import { Tooltip as MuiTooltip, useTheme } from '@mui/material';
import { TooltipProps } from '@/app/types/TooltipProps';
import React from 'react';
import type { Theme } from '@mui/material/styles';
import '@/app/theme/createTheme';

export const TooltipImpl: React.FC<TooltipProps> = ({
  onClick,
  clickable = false,
  children,
  placement = 'top',
  arrow = false,
  enterDelay = 100,
  leaveDelay = 0,
  ...props
}) => {
  const theme = useTheme() as Theme;

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  const tooltipStyles = {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    borderRadius: `${theme.shape.borderRadius}px`,
    backgroundColor:
      theme.palette.mode === 'dark'
        ? theme.palette.grey[700]
        : theme.palette.grey[800],
    color: theme.palette.common.white,
    padding: theme.spacing(1, 1.5),
    maxWidth: '300px',
    boxShadow: theme.shadows[4],
    lineHeight: '1.5',
    border:
      theme.palette.mode === 'dark'
        ? `1px solid ${theme.palette.divider}`
        : 'none',
    ...(theme.palette.mode === 'light' && {
      backgroundColor: theme.palette.grey[800],
    }),
    '& .MuiTooltip-arrow': {
      color:
        theme.palette.mode === 'dark'
          ? theme.palette.grey[700]
          : theme.palette.grey[800],
      '&::before': {
        border:
          theme.palette.mode === 'dark'
            ? `1px solid ${theme.palette.divider}`
            : 'none',
      },
    },
  };

  const popperStyles = {
    zIndex: theme.zIndex.tooltip,
    '& .MuiTooltip-tooltip': {
      transition: theme.transitions.create(['opacity', 'transform'], {
        duration: theme.transitions.duration.shorter,
        easing: theme.transitions.easing.easeOut,
      }),
    },
  };

  const tooltipComponent = (
    <MuiTooltip
      placement={placement}
      arrow={arrow}
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      componentsProps={{
        tooltip: {
          sx: tooltipStyles,
        },
        popper: {
          sx: popperStyles,
        },
      }}
      TransitionProps={{
        timeout: {
          enter: 200,
          exit: 100,
        },
      }}
      {...props}
    >
      {children}
    </MuiTooltip>
  );

  if (clickable && React.isValidElement(children)) {
    const wrappedChild = (
      <span
        onClick={handleClick}
        style={{ cursor: 'pointer', display: 'inline-flex' }}
      >
        {children}
      </span>
    );

    return React.cloneElement(tooltipComponent, {
      children: wrappedChild,
    });
  }

  return tooltipComponent;
};
