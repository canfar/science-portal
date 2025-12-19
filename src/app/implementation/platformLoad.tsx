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
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { PlatformLoadProps } from '../types/PlatformLoadProps';
import { MetricBlock } from '../components/MetricBlock/MetricBlock';

/**
 * PlatformLoad implementation component
 */
export const PlatformLoadImpl: React.FC<PlatformLoadProps> = ({
  data,
  isLoading = false,
  onRefresh,
  className,
  title = 'Platform Load',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Memoized to prevent recalculation on every render
  // Only recalculates when the date actually changes
  const formattedLastUpdate = useMemo(() => {
    const dateStr = typeof data.lastUpdate === 'string'
      ? data.lastUpdate
      : data.lastUpdate.toISOString();
    return dateStr.replace('T', ' ').slice(0, -5) + ' UTC';
  }, [data.lastUpdate]);

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
        <IconButton
          aria-label="refresh"
          onClick={onRefresh}
          disabled={isLoading}
          size="small"
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Loading Bar - Always visible, positioned after title */}
      <LinearProgress
        color={isLoading ? 'primary' : 'success'}
        variant={isLoading ? 'indeterminate' : 'determinate'}
        value={isLoading ? undefined : 100}
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

      {/* Content - Responsive MetricBlock layout */}
      <Box sx={{ marginBottom: theme.spacing(2) }}>
        {isMobile ? (
          <Stack spacing={2}>
            <MetricBlock
              label="CPU"
              series={data.cpu}
              max={data.maxValues.cpu}
              isLoading={isLoading}
            />
            <MetricBlock
              label="RAM"
              series={data.ram}
              max={data.maxValues.ram}
              isLoading={isLoading}
            />
            <MetricBlock
              label="Running Instances"
              series={data.instances}
              max={data.maxValues.instances}
              isLoading={isLoading}
            />
          </Stack>
        ) : (
          <Stack spacing={1}>
            <MetricBlock
              label="CPU"
              series={data.cpu}
              max={data.maxValues.cpu}
              isLoading={isLoading}
            />
            <MetricBlock
              label="RAM"
              series={data.ram}
              max={data.maxValues.ram}
              isLoading={isLoading}
            />
            <MetricBlock
              label="Running Instances"
              series={data.instances}
              max={data.maxValues.instances}
              isLoading={isLoading}
            />
          </Stack>
        )}
      </Box>

      {/* Footer */}
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
    </Paper>
  );
};
