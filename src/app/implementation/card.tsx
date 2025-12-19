'use client';

import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  CardActions as MuiCardActions,
  CardHeader as MuiCardHeader,
  CardMedia as MuiCardMedia,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  CardProps,
  CardContentProps,
  CardActionsProps,
  CardHeaderProps,
  CardMediaProps,
} from '@/app/types/CardProps';
import React from 'react';

// Card Implementation
export const CardImpl = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { variant = 'elevated', loading = false, children, className, ...props },
    ref
  ) => {
    if (loading) {
      return (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={200}
          sx={{
            borderRadius: 2,
          }}
        />
      );
    }

    return (
      <MuiCard
        ref={ref}
        variant={variant === 'elevated' ? 'elevation' : variant}
        className={className}
        elevation={0}
        raised={false}
        {...props}
      >
        {children}
      </MuiCard>
    );
  }
);

CardImpl.displayName = 'CardImpl';

// CardContent Implementation
export const CardContentImpl = React.forwardRef<
  HTMLDivElement,
  CardContentProps
>(({ loading = false, children, className, ...props }, ref) => {
  if (loading) {
    return (
      <MuiCardContent ref={ref} className={className} {...props}>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
      </MuiCardContent>
    );
  }

  return (
    <MuiCardContent ref={ref} className={className} {...props}>
      {children}
    </MuiCardContent>
  );
});

CardContentImpl.displayName = 'CardContentImpl';

// CardActions Implementation
export const CardActionsImpl = React.forwardRef<
  HTMLDivElement,
  CardActionsProps
>(({ align = 'left', loading = false, children, className, ...props }, ref) => {
  const theme = useTheme();
  const alignmentStyles = {
    left: { justifyContent: 'flex-start' },
    right: { justifyContent: 'flex-end' },
    center: { justifyContent: 'center' },
    'space-between': { justifyContent: 'space-between' },
  };

  if (loading) {
    return (
      <MuiCardActions
        ref={ref}
        className={className}
        sx={{
          padding: theme.spacing(2),
          ...alignmentStyles[align],
        }}
        {...props}
      >
        <Skeleton variant="rectangular" width={100} height={36} />
        <Skeleton variant="rectangular" width={100} height={36} />
      </MuiCardActions>
    );
  }

  return (
    <MuiCardActions
      ref={ref}
      className={className}
      sx={{
        padding: theme.spacing(2),
        ...alignmentStyles[align],
      }}
      {...props}
    >
      {children}
    </MuiCardActions>
  );
});

CardActionsImpl.displayName = 'CardActionsImpl';

// CardHeader Implementation
export const CardHeaderImpl = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  (
    { title, subheader, loading = false, className, avatar, action, ...props },
    ref
  ) => {
    const theme = useTheme();

    if (loading) {
      return (
        <MuiCardHeader
          ref={ref}
          className={className}
          avatar={
            avatar || <Skeleton variant="circular" width={40} height={40} />
          }
          title={<Skeleton variant="text" width="60%" />}
          subheader={<Skeleton variant="text" width="40%" />}
          action={
            action || <Skeleton variant="circular" width={24} height={24} />
          }
          {...props}
        />
      );
    }

    return (
      <MuiCardHeader
        ref={ref}
        className={className}
        avatar={avatar}
        title={title}
        subheader={subheader}
        action={action}
        sx={{
          '& .MuiCardHeader-title': {
            fontWeight: theme.typography.fontWeightMedium,
          },
          '& .MuiCardHeader-subheader': {
            color: 'text.secondary',
          },
        }}
        {...props}
      />
    );
  }
);

CardHeaderImpl.displayName = 'CardHeaderImpl';

// CardMedia Implementation
export const CardMediaImpl = React.forwardRef<HTMLDivElement, CardMediaProps>(
  (
    {
      component = 'img',
      height = 200,
      loading = false,
      alt,
      className,
      image,
      src,
      autoPlay,
      muted,
      loop,
      controls,
      playsInline,
      ...props
    },
    ref
  ) => {
    if (loading) {
      return (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={height}
          sx={{
            borderRadius: 0,
          }}
        />
      );
    }

    // Use src prop if image is not provided (for backwards compatibility)
    const imageSource = image || src;

    // For video components, pass video-specific props
    const videoProps =
      component === 'video'
        ? {
            autoPlay,
            muted,
            loop,
            controls,
            playsInline,
          }
        : {};

    return (
      <MuiCardMedia
        ref={ref}
        component={component}
        height={height}
        image={imageSource}
        alt={alt}
        className={className}
        sx={{
          ...(typeof height === 'number' && { height: `${height}px` }),
          ...(typeof height === 'string' && { height }),
        }}
        {...videoProps}
        {...props}
      />
    );
  }
);

CardMediaImpl.displayName = 'CardMediaImpl';
