'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  LinearProgress,
  Alert,
  Grid,
  Skeleton,
  Popover,
  Tooltip,
} from '@mui/material';
import { Refresh as RefreshIcon, HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  UserStorageWidgetProps,
  StorageData,
  StorageCardData,
} from '@/app/types/UserStorageWidgetProps';
import { useApiRoutes } from '@/lib/hooks/useApiRoutes';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);
dayjs.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    m: 'a min',
    mm: '%d mins',
    h: 'an hr',
    hh: '%d hrs',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years',
  },
});

// Test data for development
const TEST_DATA: StorageData = {
  size: 11281596360,
  quota: 200000000000,
  date: '2025-06-12T06:27:58.000Z',
  usage: 94,
};

// Utility functions
const convertToFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB', 'TB', 'PB'];
  let u = -1;
  let size = bytes;

  do {
    size /= thresh;
    ++u;
  } while (Math.abs(size) >= thresh && u < units.length - 1);

  return `${size.toFixed(size < 10 ? 2 : 1)} ${units[u]}`;
};

/**
 * Parse storage API `date` as a UTC instant (VOSpace node date for used size / totals).
 * Naive `YYYY-MM-DD …` values are treated as UTC wall time, not local.
 */
const parseStorageApiUtc = (raw: string): dayjs.Dayjs | null => {
  const s = raw.trim();
  if (!s) return null;

  const utcLiteral = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?\s*UTC$/i);
  if (utcLiteral) {
    const stamp = `${utcLiteral[1]} ${utcLiteral[2]}${utcLiteral[3] ?? ''}`;
    const fmt = utcLiteral[3] ? 'YYYY-MM-DD HH:mm:ss.SSS' : 'YYYY-MM-DD HH:mm:ss';
    const d = dayjs.utc(stamp, fmt);
    return d.isValid() ? d : null;
  }

  if (/[zZ]$|[+-]\d{2}:\d{2}$|[+-]\d{4}$/.test(s)) {
    const d = dayjs(s);
    return d.isValid() ? d.utc() : null;
  }

  const naive = s.match(/^(\d{4}-\d{2}-\d{2})([ T])(\d{2}:\d{2}:\d{2})(\.\d+)?$/);
  if (naive) {
    const stamp = `${naive[1]} ${naive[3]}${naive[4] ?? ''}`;
    const fmt = naive[4] ? 'YYYY-MM-DD HH:mm:ss.SSS' : 'YYYY-MM-DD HH:mm:ss';
    const d = dayjs.utc(stamp, fmt);
    return d.isValid() ? d : null;
  }

  const loose = dayjs.utc(s);
  if (loose.isValid()) return loose;

  const localFallback = dayjs(s);
  return localFallback.isValid() ? localFallback : null;
};

const formatStorageDateLocalDefault = (raw: string): string => {
  const instant = parseStorageApiUtc(raw);
  if (!instant) return 'Unknown';

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).format(instant.toDate());
};

/** Relative time since totals were last modified (API instant → browser “now”). */
const formatRelativeStorageModified = (raw: string, nowMs: number): string => {
  const instant = parseStorageApiUtc(raw);
  if (!instant) return 'Unknown';
  return instant.from(dayjs(nowMs));
};

// Storage Card Component
interface StorageCardProps {
  label: string;
  value: string;
  isLoading: boolean;
  isWarning?: boolean;
}

const StorageCard: React.FC<StorageCardProps> = ({ label, value, isLoading, isWarning }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: 2,
        backgroundColor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        p: 2,
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <Typography variant="body2" fontWeight="bold" color="text.primary">
            {label}:
          </Typography>
          <Typography
            variant="body2"
            fontWeight="bold"
            color={isWarning ? 'error.main' : 'primary.main'}
          >
            {value}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export const UserStorageWidgetImpl = React.forwardRef<HTMLDivElement, UserStorageWidgetProps>(
  (
    {
      title = 'User Home Storage',
      isAuthenticated = false,
      name,
      isLoading = false,
      data: externalData,
      errorMessage,
      onRefresh,
      showRefreshButton = true,
      helpUrl,
      helpContent,
      showProgressIndicator = true,
      progressPercentage = 0,
      warningThreshold = 90,
      emptyMessage = 'No storage data available',
      dateFormatter = formatStorageDateLocalDefault,
      fileSizeFormatter = convertToFileSize,
      testMode = false,
    },
    ref,
  ) => {
    const apiRoutes = useApiRoutes();
    const theme = useTheme();
    const [internalData, setInternalData] = useState<StorageData | null>(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalError, setInternalError] = useState<string | undefined>();
    const [helpAnchorEl, setHelpAnchorEl] = useState<HTMLElement | null>(null);
    const [relativeNowMs, setRelativeNowMs] = useState(() => Date.now());

    // Use external data if provided, otherwise use internal data or test data
    const currentData = useMemo(() => {
      if (externalData !== undefined) return externalData;
      if (testMode) return TEST_DATA;
      return internalData;
    }, [externalData, testMode, internalData]);

    // Determine current loading state
    // If we're in controlled mode (parent manages loading), use external isLoading
    // Otherwise use internal loading state
    const currentLoading = isLoading || internalLoading;

    // When loading, don't show data - override currentData
    const displayData = currentLoading ? null : currentData;
    const currentError = externalData !== undefined ? errorMessage : internalError;

    // Card configuration
    const cardConfigs = useMemo(
      () => [
        {
          key: 'size' as keyof StorageData,
          label: 'Used',
          formatter: fileSizeFormatter,
        },
        {
          key: 'quota' as keyof StorageData,
          label: 'Quota',
          formatter: fileSizeFormatter,
        },
        {
          key: 'usage' as keyof StorageData,
          label: 'Usage',
          formatter: (val: number) => `${(val || 0).toFixed(1)}%`,
        },
      ],
      [fileSizeFormatter],
    );

    // Memoized card data
    const cardData: StorageCardData[] = useMemo(() => {
      return cardConfigs.map((config) => ({
        label: config.label,
        value: config.formatter((displayData?.[config.key] as number) ?? 0),
        isWarning:
          config.key === 'usage' &&
          displayData?.usage !== undefined &&
          displayData.usage > warningThreshold,
      }));
    }, [displayData, cardConfigs, warningThreshold]);

    const sizeTotalsModifiedAbsolute = useMemo(() => {
      return displayData?.date ? dateFormatter(displayData.date) : null;
    }, [displayData?.date, dateFormatter]);

    const sizeTotalsModifiedRelative = useMemo(() => {
      return displayData?.date ? formatRelativeStorageModified(displayData.date, relativeNowMs) : null;
    }, [displayData?.date, relativeNowMs]);

    // Internal fetch function
    const fetchStorageData = useCallback(async () => {
      if (!name || name === 'Login') return;

      setInternalLoading(true);
      setInternalError(undefined);

      try {
        // Use server-side API route to avoid CORS issues
        const url = apiRoutes.storage.raw(name);

        console.log('[UserStorageWidget] Fetching storage data:', {
          username: name,
          url,
        });

        const response = await fetch(url, {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        });

        console.log('[UserStorageWidget] Fetch response:', {
          username: name,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
        });

        if (!response.ok) {
          setInternalError(`HTTP ${response.status}`);
          return;
        }

        const parsedData: StorageData = await response.json();

        console.log('[UserStorageWidget] Received storage data:', {
          username: name,
          data: parsedData,
        });

        setInternalData(parsedData);
      } catch (err) {
        console.error('[UserStorageWidget] Storage data fetch error:', {
          username: name,
          error: err,
          errorMessage: err instanceof Error ? err.message : String(err),
        });
        setInternalError('Failed to fetch storage data');
      } finally {
        setInternalLoading(false);
      }
    }, [name, apiRoutes.storage]);

    const handleRefresh = useCallback(() => {
      if (onRefresh) {
        onRefresh();
      } else if (isAuthenticated && name && name !== 'Login') {
        fetchStorageData();
      }
    }, [onRefresh, isAuthenticated, name, fetchStorageData]);

    const handleHelpClick = useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        if (helpUrl) {
          window.open(helpUrl, '_blank', 'noopener,noreferrer');
        } else if (helpContent) {
          setHelpAnchorEl(event.currentTarget);
        }
      },
      [helpUrl, helpContent],
    );

    const handleHelpClose = useCallback(() => {
      setHelpAnchorEl(null);
    }, []);

    // Auto-fetch on mount if authenticated
    useEffect(() => {
      if (externalData === undefined && !testMode && isAuthenticated && name && name !== 'Login') {
        fetchStorageData();
      }
    }, [externalData, testMode, isAuthenticated, name, fetchStorageData]);

    // Clear internal data when user logs out
    useEffect(() => {
      if (!isAuthenticated) {
        setInternalData(null);
        setInternalError(undefined);
      }
    }, [isAuthenticated]);

    useEffect(() => {
      if (!displayData?.date) return;
      setRelativeNowMs(Date.now());

      const intervalId = window.setInterval(() => {
        setRelativeNowMs(Date.now());
      }, 60000);

      return () => {
        window.clearInterval(intervalId);
      };
    }, [displayData?.date]);

    return (
      <Paper
        ref={ref}
        elevation={0}
        variant="outlined"
        sx={{
          position: 'relative',
          padding: theme.spacing(2),
          overflow: 'hidden',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          maxWidth: 600,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          // Better mobile padding
          [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(1.5),
            borderRadius: 2,
          },
        }}
        component="div"
      >
        {/* Error Alert */}
        {currentError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {currentError}
          </Alert>
        )}

        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing(1),
            // Better mobile layout for header
            [theme.breakpoints.down('sm')]: {
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 1,
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              sx={{
                [theme.breakpoints.down('sm')]: {
                  fontSize: theme.typography.body1.fontSize,
                  fontWeight: theme.typography.fontWeightBold,
                },
              }}
            >
              {title}
            </Typography>
            {(helpUrl || helpContent) && (
              <Tooltip title="More information">
                <IconButton size="small" onClick={handleHelpClick} sx={{ p: 0.5 }}>
                  <HelpOutlineIcon sx={{ fontSize: theme.spacing(2.5) }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {showRefreshButton && (
            <Tooltip title="Refresh storage">
              <IconButton
                aria-label="refresh storage"
                onClick={handleRefresh}
                disabled={currentLoading}
                size="small"
                sx={{
                  [theme.breakpoints.down('sm')]: {
                    alignSelf: 'flex-end',
                    mt: -1,
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Progress Bar */}
        {showProgressIndicator && (
          <LinearProgress
            color={currentLoading ? 'primary' : 'success'}
            variant={currentLoading ? 'indeterminate' : 'determinate'}
            value={currentLoading ? undefined : progressPercentage > 0 ? progressPercentage : 100}
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
        )}

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Storage Cards or Empty State */}
          {!displayData && !currentLoading ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                color: theme.palette.text.secondary,
              }}
            >
              <Typography variant="body2">{emptyMessage}</Typography>
            </Box>
          ) : (
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2} direction="column">
                {cardData.map((card, index) => (
                  <Grid size={12} key={index}>
                    <StorageCard
                      label={card.label}
                      value={card.value}
                      isLoading={currentLoading}
                      isWarning={card.isWarning}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* When used size / quota totals last changed (VOSpace node mtime), not “last polled” */}
          {sizeTotalsModifiedRelative &&
            sizeTotalsModifiedRelative !== 'Unknown' &&
            !currentLoading && (
              <Box
                sx={{
                  textAlign: 'center',
                  mt: 'auto',
                  pt: 2,
                  color: theme.palette.text.secondary,
                }}
              >
                <Tooltip
                  title={
                    sizeTotalsModifiedAbsolute
                      ? `${sizeTotalsModifiedAbsolute}`
                      : 'Unknown'
                  }
                  arrow
                >
                  <Typography variant="caption" sx={{ fontSize: '10px' }}>
                    Modified{' '}
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: 'primary.500',
                      }}
                    >
                      {sizeTotalsModifiedRelative}
                    </Typography>
                    {'.'}
                  </Typography>
                </Tooltip>
              </Box>
            )}
        </Box>

        {/* Help Popover */}
        {helpContent && (
          <Popover
            open={Boolean(helpAnchorEl)}
            anchorEl={helpAnchorEl}
            onClose={handleHelpClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
          >
            <Box sx={{ p: 2, maxWidth: 300 }}>
              <Typography variant="subtitle2" gutterBottom>
                User Home Storage
              </Typography>
              <Typography variant="body2">{helpContent}</Typography>
            </Box>
          </Popover>
        )}
      </Paper>
    );
  },
);

UserStorageWidgetImpl.displayName = 'UserStorageWidgetImpl';
