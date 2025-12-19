'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import { BarChartHorizontalProps } from '../types/BarChartHorizontalProps';
import { tokens } from '../design-system/tokens';

/**
 * Custom legend component with theme-aware styling
 * Memoized to prevent re-renders when legend items haven't changed
 */
const CustomLegend: React.FC<{
  items: Array<{ key: string; label: string; color: string }>;
  position: 'top' | 'bottom';
}> = React.memo(({ items, position }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        paddingLeft: {
          xs: theme.spacing(2), // 16px on mobile
          sm: theme.spacing(4), // 32px on tablet
          md: '180px', // original value on desktop
        },
        marginBottom: position === 'bottom' ? theme.spacing(2) : 0,
        marginTop: position === 'top' ? theme.spacing(2) : 0,
      }}
    >
      {items.map((item, index) => (
        <Box
          key={item.key}
          sx={{
            display: 'flex',
            alignItems: 'center',
            marginRight: index < items.length - 1 ? theme.spacing(3) : 0,
          }}
        >
          <Box
            sx={{
              width: '14px',
              height: '14px',
              backgroundColor: item.color,
              marginRight: theme.spacing(1),
              borderRadius: tokens.borderRadius.smCSS,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color:
                theme.palette.mode === 'light'
                  ? tokens.colors.text.secondary.light
                  : tokens.colors.text.secondary.dark,
            }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
});

CustomLegend.displayName = 'CustomLegend';

/**
 * BarChartHorizontal implementation component
 */
// Memoized to prevent re-renders when parent re-renders
// BarChartHorizontal only needs to re-render when its props change
export const BarChartHorizontalImpl: React.FC<BarChartHorizontalProps> =
  React.memo(
    ({
      data,
      title,
      total,
      height = 80,
      width = '100%',
      maxWidth = '650px',
      barSize = 35,
      borderRadius = 6,
      legend = { show: true, position: 'bottom' },
      colors = {},
      axes = { showXAxis: true, showYAxis: true },
      className,
      style,
      stackKeys = ['used', 'free'],
      margin = { top: 5, right: 30, left: 20, bottom: 5 },
    }) => {
      const theme = useTheme();
      const isDarkMode = theme.palette.mode === 'dark';

      // Memoized total calculation to prevent recalculation on every render
      const calculatedTotal = useMemo(() => {
        return (
          total ||
          data.reduce((sum, item) => {
            return (
              sum +
              stackKeys.reduce((segmentSum, key) => {
                return (
                  segmentSum + (typeof item[key] === 'number' ? item[key] : 0)
                );
              }, 0)
            );
          }, 0)
        );
      }, [total, data, stackKeys]);

      // Memoized colors to prevent object recreation on every render
      const chartColors = useMemo(() => {
        const defaultColors = {
          used: isDarkMode
            ? tokens.colors.primary[600]
            : tokens.colors.primary[700],
          free: tokens.colors.neutral[300],
          headless: tokens.colors.neutral[400],
        };
        return { ...defaultColors, ...colors };
      }, [isDarkMode, colors]);

      // Memoized legend items to prevent recreation on every render
      const legendItems = useMemo(() => {
        return (
          legend.items || [
            {
              key: 'used',
              label: 'used',
              color: chartColors.used,
            },
            {
              key: 'free',
              label: 'free',
              color: chartColors.free,
            },
          ]
        );
      }, [legend.items, chartColors]);

      // Memoized X axis ticks to prevent recreation on every render
      const xAxisTicks = useMemo(() => {
        const defaultTicks = [0, 500, 1000, 1500, 2000, calculatedTotal];
        return (
          axes.xAxisTicks ||
          defaultTicks.filter((tick) => tick <= calculatedTotal)
        );
      }, [axes.xAxisTicks, calculatedTotal]);

      // Text colors based on theme
      const textColor = isDarkMode
        ? tokens.colors.text.primary.dark
        : tokens.colors.text.primary.light;
      const secondaryTextColor = isDarkMode
        ? tokens.colors.text.secondary.dark
        : tokens.colors.text.secondary.light;
      const tickColor = isDarkMode
        ? tokens.colors.neutral[600]
        : tokens.colors.neutral[500];

      return (
        <Box
          className={className}
          sx={{
            width: '100%',
            maxWidth: {
              xs: '100%', // Full width on mobile
              sm: '500px', // Smaller on tablet
              md: maxWidth, // Use prop value on desktop
            },
            fontFamily: tokens.typography.fontFamily.primary,
            padding: {
              xs: theme.spacing(1), // Less padding on mobile
              sm: theme.spacing(2), // Normal padding on larger screens
            },
            ...style,
          }}
        >
          {title && (
            <Typography
              variant="body1"
              sx={{
                color: textColor,
                fontWeight: tokens.typography.fontWeight.medium,
                marginBottom: theme.spacing(2),
              }}
            >
              {title}
            </Typography>
          )}

          {legend.show && legend.position === 'top' && (
            <CustomLegend
              items={legendItems.map((item) => ({
                ...item,
                color: item.color!,
              }))}
              position="top"
            />
          )}

          <Box sx={{ width: '100%', height }}>
            <ResponsiveContainer width={width} height="100%">
              <BarChart layout="vertical" data={data} margin={margin}>
                {axes.showXAxis && (
                  <XAxis
                    type="number"
                    domain={[0, calculatedTotal]}
                    ticks={xAxisTicks}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: tickColor, fontSize: 12 }}
                    tickFormatter={axes.xAxisFormatter}
                  />
                )}

                {axes.showYAxis && (
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={{
                      stroke: tokens.colors.border.light,
                      strokeWidth: 1,
                    }}
                    tickLine={false}
                    width={60}
                    tick={{
                      fill: secondaryTextColor,
                      fontSize: 14,
                      dx: -10,
                    }}
                  />
                )}

                {stackKeys.map((key, index) => {
                  const isLast = index === stackKeys.length - 1;
                  const color =
                    chartColors[key as keyof typeof chartColors] ||
                    tokens.colors.neutral[400];

                  return (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={color}
                      stackId="a"
                      barSize={barSize}
                      radius={
                        isLast ? [0, borderRadius, borderRadius, 0] : undefined
                      }
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {legend.show && legend.position === 'bottom' && (
            <CustomLegend
              items={legendItems.map((item) => ({
                ...item,
                color: item.color!,
              }))}
              position="bottom"
            />
          )}
        </Box>
      );
    }
  );

BarChartHorizontalImpl.displayName = 'BarChartHorizontalImpl';
