'use client';

import React, { useMemo } from 'react';
import { Box, Skeleton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { MetricBlockProps } from '../types/MetricBlockProps';
import { BarChartHorizontal } from '../components/BarChartHorizontal/BarChartHorizontal';

/**
 * MetricBlock implementation component
 */
// Memoized to prevent re-renders when parent re-renders
// MetricBlock only needs to re-render when its props change
export const MetricBlockImpl: React.FC<MetricBlockProps> = React.memo(
  ({ label, series, max, isLoading = false, className }) => {
    const theme = useTheme();

    // Memoized calculations to prevent recalculation on every render
    const displayTitle = useMemo(() => {
      // Format based on label type
      if (label === 'CPU') {
        return `Available CPUs: ${series.free} / ${max}`;
      } else if (label === 'RAM') {
        // Values are already in GB from the API
        return `Available RAM: ${series.free}GB / ${max}GB`;
      } else {
        // Instances - show total
        return `Running Instances: ${Math.round(max)}`;
      }
    }, [series.used, series.free, max, label]);

    // Define colors based on metric type
    const chartColors = useMemo(() => {
      if (label === 'CPU') {
        // Teal colors for CPU
        return {
          used: '#008B8B', // Dark cyan/teal
          free: theme.palette.grey[300],
        };
      } else if (label === 'RAM') {
        // Orange colors for RAM
        return {
          used: '#FF8C00', // Dark orange
          free: theme.palette.grey[300],
        };
      } else {
        // Blue colors for Running Instances
        return {
          used: '#1E3A8A', // Navy blue for session
          free: '#3B82F6', // Blue for desktopApp
          headless: '#60A5FA', // Light blue for headless
        };
      }
    }, [label, theme]);

    // Define legend items based on metric type
    const legendItems = useMemo(() => {
      if (label === 'Running Instances') {
        // For instances, we need to handle multiple segments
        return [
          { key: 'used', label: 'session', color: '#1E3A8A' },
          { key: 'free', label: 'desktopApp', color: '#3B82F6' },
          { key: 'headless', label: 'headless', color: '#60A5FA' },
        ];
      } else {
        // For CPU and RAM
        return [
          { key: 'used', label: 'used', color: chartColors.used },
          { key: 'free', label: 'free', color: chartColors.free },
        ];
      }
    }, [label, chartColors]);

    // Define stack keys based on metric type
    const stackKeys = useMemo(() => {
      if (
        label === 'Running Instances' &&
        'headless' in series &&
        series.headless
      ) {
        return ['used', 'free', 'headless'];
      } else {
        return ['used', 'free'];
      }
    }, [label, series]);

    return (
      <Box className={className} sx={{ marginBottom: theme.spacing(2) }}>
        {isLoading ? (
          <Skeleton
            variant="rectangular"
            width="100%"
            height={60}
            sx={{
              borderRadius: 1,
            }}
          />
        ) : (
          <BarChartHorizontal
            title={displayTitle}
            data={[series]}
            total={max}
            height={60}
            barSize={25}
            colors={chartColors}
            legend={{
              show: true,
              position: 'top',
              items: legendItems,
            }}
            stackKeys={stackKeys}
            margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
          />
        )}
      </Box>
    );
  }
);

MetricBlockImpl.displayName = 'MetricBlockImpl';
