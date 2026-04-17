'use client';

import React, { useMemo } from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  LinearProgress,
  useMediaQuery,
  Stack,
} from '@mui/material';
import { Refresh as RefreshIcon, WarningAmber as WarningAmberIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { PlatformLoadProps } from '../types/PlatformLoadProps';
import { MetricBlock } from '../components/MetricBlock/MetricBlock';
import { PLATFORM_LOAD_DISABLED_MESSAGE } from '@/lib/config/static-platform-load';

/**
 * PlatformLoad implementation component
 */
export const PlatformLoadImpl: React.FC<PlatformLoadProps> = ({
  data,
  isLoading = false,
  onRefresh,
  className,
  title = 'Platform Load',
  showDisabledOverlay = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const effectiveLoading = showDisabledOverlay ? false : isLoading;

  // Memoized to prevent recalculation on every render
  // Only recalculates when the date actually changes
  const formattedLastUpdate = useMemo(() => {
    const dateStr =
      typeof data.lastUpdate === 'string' ? data.lastUpdate : data.lastUpdate.toISOString();
    return dateStr.replace('T', ' ').slice(0, -5) + ' UTC';
  }, [data.lastUpdate]);

  const metricsContent = (
    <>
      {isMobile ? (
        <Stack spacing={2}>
          <MetricBlock
            label="CPU"
            series={data.cpu}
            max={data.maxValues.cpu}
            isLoading={effectiveLoading}
          />
          <MetricBlock
            label="RAM"
            series={data.ram}
            max={data.maxValues.ram}
            isLoading={effectiveLoading}
          />
        </Stack>
      ) : (
        <Stack spacing={1}>
          <MetricBlock
            label="CPU"
            series={data.cpu}
            max={data.maxValues.cpu}
            isLoading={effectiveLoading}
          />
          <MetricBlock
            label="RAM"
            series={data.ram}
            max={data.maxValues.ram}
            isLoading={effectiveLoading}
          />
        </Stack>
      )}
    </>
  );

  return (
    <Paper
      className={className}
      elevation={0}
      variant="outlined"
      sx={{
        position: 'relative',
        padding: theme.spacing(2),
        overflow: 'hidden',
        borderRadius: theme.shape.borderRadius, // Ensure consistent border radius
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
      component="div"
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing(1),
        }}
      >
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {!showDisabledOverlay && (
          <IconButton aria-label="refresh" onClick={onRefresh} disabled={isLoading} size="small">
            <RefreshIcon />
          </IconButton>
        )}
      </Box>

      {/* Loading Bar - Always visible, positioned after title */}
      <LinearProgress
        color={effectiveLoading ? 'primary' : 'success'}
        variant={effectiveLoading ? 'indeterminate' : 'determinate'}
        value={effectiveLoading ? undefined : 100}
        sx={{
          width: '100%',
          height: 4,
          marginBottom: theme.spacing(2),
          borderRadius: 2,
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
          },
        }}
      />

      {/* Content - Responsive MetricBlock layout; blurred when live stats disabled (CADC-15555) */}
      <Box sx={{ marginBottom: theme.spacing(2), position: 'relative' }}>
        {showDisabledOverlay ? (
          <>
            <Box
              sx={{
                filter: 'blur(4px)',
                WebkitFilter: 'blur(4px)',
                opacity: 0.85,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {metricsContent}
            </Box>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                px: 2,
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(0, 0, 0, 0.72)'
                    : 'rgba(255, 255, 255, 0.72)',
                borderRadius: 1,
                zIndex: 5,
              }}
            >
              <WarningAmberIcon
                sx={{
                  color: '#b58900',
                  fontSize: 28,
                  mb: 1.25,
                }}
                aria-hidden
              />
              <Typography
                variant="body1"
                sx={{
                  fontSize: 16,
                  lineHeight: 1.4,
                  color: 'text.primary',
                  fontWeight: 500,
                  maxWidth: '90%',
                }}
              >
                {PLATFORM_LOAD_DISABLED_MESSAGE}
              </Typography>
            </Box>
          </>
        ) : (
          metricsContent
        )}
      </Box>

      {/* Footer */}
      {!showDisabledOverlay && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            [theme.breakpoints.down('sm')]: {
              justifyContent: 'center', // Center text on mobile
            },
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: '10px',
              [theme.breakpoints.down('sm')]: {
                textAlign: 'center',
              },
            }}
          >
            Last update:{' '}
            <Typography
              component="span"
              variant="caption"
              sx={{
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                color: 'primary.500',
              }}
            >
              {formattedLastUpdate}
            </Typography>
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
