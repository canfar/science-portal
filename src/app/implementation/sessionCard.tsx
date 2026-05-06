'use client';

import {
  Card as MuiCard,
  CardContent,
  Box,
  Typography,
  IconButton,
  Chip,
  useTheme,
  Skeleton,
  Stack,
  Tooltip,
  CircularProgress,
  Backdrop,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Flag as FlagIcon,
  Description as LogsIcon,
  Schedule as ExtendIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { SessionCardProps, SessionType, SessionStatus } from '@/app/types/SessionCardProps';
import React, { useState, useCallback } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
import { useApiRoutes } from '@/lib/hooks/useApiRoutes';
import { usePublicRuntimeConfig } from '@/lib/providers/PublicRuntimeConfigProvider';
import Image from 'next/image';
import { EventsModal } from '@/app/components/EventsModal/EventsModal';
import { DeleteSessionModal } from '@/app/components/DeleteSessionModal/DeleteSessionModal';
import { SessionRenewModal } from '@/app/components/SessionRenewModal/SessionRenewModal';

const getSessionIcon = (basePath: string, type: SessionType): React.ReactNode => {
  const iconSize = 24; // Standard icon size

  switch (type) {
    case 'notebook':
    case 'contributednotebook':
      return (
        <Image
          src={`${basePath}/notebook_icon.jpg`}
          alt="Notebook"
          width={iconSize}
          height={iconSize}
          style={{ objectFit: 'contain' }}
        />
      );
    case 'desktop':
    case 'contributeddesktop':
      return (
        <Image
          src={`${basePath}/desktop_icon.png`}
          alt="Desktop"
          width={iconSize}
          height={iconSize}
          style={{ objectFit: 'contain' }}
        />
      );
    case 'carta':
      return (
        <Image
          src={`${basePath}/carta_icon.png`}
          alt="CARTA"
          width={iconSize}
          height={iconSize}
          style={{ objectFit: 'contain' }}
        />
      );
    case 'contributed':
      return (
        <Image
          src={`${basePath}/contributed_icon.png`}
          alt="Contributed"
          width={iconSize}
          height={iconSize}
          style={{ objectFit: 'contain' }}
        />
      );
    case 'firefly':
      return (
        <Image
          src={`${basePath}/firefly_icon.png`}
          alt="Firefly"
          width={iconSize}
          height={iconSize}
          style={{ objectFit: 'contain' }}
        />
      );
    default:
      return <CodeIcon />;
  }
};

const getStatusColor = (status: SessionStatus): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'Running':
      return 'success';
    case 'Pending':
      return 'warning';
    case 'Failed':
      return 'error';
    case 'Terminating':
      return 'warning';
    default:
      return 'default';
  }
};

/**
 * Split a full container image path into project and image name.
 * Example: "images.canfar.net/skaha/firefly:2025.2" -> { project: "skaha", image: "firefly:2025.2" }
 */
const parseImagePath = (fullImagePath: string): { project: string; image: string } => {
  if (!fullImagePath) return { project: 'N/A', image: 'N/A' };
  const parts = fullImagePath.split('/');
  if (parts.length >= 3) {
    return { project: parts[1], image: parts.slice(2).join('/') };
  }
  if (parts.length === 2) {
    return { project: parts[0], image: parts[1] };
  }
  return { project: 'N/A', image: parts[0] };
};

/**
 * Skaha returns memory either as bare GB numbers ("1.4", "16") or, occasionally,
 * with a unit suffix ("8G"). Render with a "GB" suffix. Falsy / "<none>" → "N/A".
 */
const formatMemoryUnit = (value: string | undefined): string => {
  if (!value || value === '<none>') return 'N/A';
  if (/[KMGT]$/.test(value)) return `${value}B`;
  if (/^\d+(\.\d+)?$/.test(value)) return `${value}GB`;
  return value;
};

/**
 * Strip any unit suffix; used for the usage side of "usage / allocated" so the
 * unit appears only once at the end (e.g. "1.4 / 16GB").
 */
const stripMemoryUnit = (value: string | undefined): string => {
  if (!value || value === '<none>') return 'N/A';
  return value.replace(/[KMGT]B?$/, '');
};

/** Format ISO timestamp as "YYYY-MM-DD HH:mm" in UTC. */
const formatTimestamp = (timestamp: string): string => {
  if (!timestamp) return 'Pending...';
  const d = dayjs.utc(timestamp);
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : 'Pending...';
};

export const SessionCardImpl = React.forwardRef<HTMLDivElement, SessionCardProps>(
  (
    {
      // Strip custom session-card props so they don't fall through to the DOM
      // via {...cardProps} on <MuiCard>. React warns on unknown DOM attributes.
      id: _id,
      sessionType,
      sessionName,
      sessionId,
      status,
      containerImage,
      startedTime,
      expiresTime,
      memoryUsage,
      memoryAllocated,
      cpuUsage,
      cpuAllocated,
      gpuAllocated,
      isFixedResources,
      connectUrl,
      requestedRAM: _requestedRAM,
      requestedCPU: _requestedCPU,
      requestedGPU: _requestedGPU,
      onDelete,
      onShowEvents,
      onShowLogs,
      onExtendTime,
      onClick,
      loading = false,
      isOperating = false,
      disableHover: _disableHover,
      ...cardProps
    },
    ref,
  ) => {
    const apiRoutes = useApiRoutes();
    const { basePath } = usePublicRuntimeConfig();
    const theme = useTheme();
    const [showEventsModal, setShowEventsModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRenewing, setIsRenewing] = useState(false);

    const handleCardClick = () => {
      // Only allow clicking on Running sessions
      if (status === 'Running') {
        if (onClick) {
          onClick();
        } else if (connectUrl) {
          window.open(connectUrl, '_blank');
        }
      }
    };

    const handleShowEvents = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowEventsModal(true);
      onShowEvents?.();
    };

    const handleShowLogs = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowLogsModal(true);
      onShowLogs?.();
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDeleteModal(true);
    };

    const handleDeleteConfirm = useCallback(async () => {
      setIsDeleting(true);
      try {
        // Call the actual delete function
        if (onDelete) {
          await onDelete();
        }
        // Wait a bit to show the deleting state before closing modal
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch {
        // Swallow — the underlying mutation surfaces the error to the user.
      } finally {
        setIsDeleting(false);
        setShowDeleteModal(false);
      }
    }, [onDelete]);

    const handleExtendClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowRenewModal(true);
    };

    const handleRenewConfirm = useCallback(
      async (_hours: number) => {
        setIsRenewing(true);
        try {
          // Call the actual renew function
          if (onExtendTime) {
            await onExtendTime();
          }
          // Wait a bit to show success state
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch {
          // Swallow — the underlying mutation surfaces the error to the user.
        } finally {
          setIsRenewing(false);
          setTimeout(() => {
            setShowRenewModal(false);
          }, 500);
        }
      },
      [onExtendTime],
    );

    if (loading) {
      return (
        <MuiCard
          ref={ref}
          {...cardProps}
          elevation={0}
          variant="outlined"
          sx={{
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <CardContent>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" width={150} />
                </Box>
                <Skeleton variant="rectangular" width={80} height={24} />
              </Box>
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="100%" />
              <Box display="flex" gap={1} mt={2}>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="circular" width={40} height={40} />
              </Box>
            </Stack>
          </CardContent>
        </MuiCard>
      );
    }

    return (
      <>
        <MuiCard
          ref={ref}
          {...cardProps}
          onClick={handleCardClick}
          elevation={0}
          raised={false}
          variant="outlined"
          sx={{
            cursor: status === 'Running' ? 'pointer' : 'default',
            border: `1px solid ${theme.palette.divider}`,
            position: 'relative',
          }}
        >
          {/* Operating state overlay — kept inside the Card with a low z-index so
              a sticky AppBar above always wins the stacking order. */}
          {isOperating && (
            <Backdrop
              open={isOperating}
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                backgroundColor:
                  theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                borderRadius: theme.shape.borderRadius,
              }}
            >
              <CircularProgress size={40} />
            </Backdrop>
          )}

          <CardContent
            sx={{
              [theme.breakpoints.down('sm')]: {
                padding: theme.spacing(2),
                '&:last-child': {
                  paddingBottom: theme.spacing(2),
                },
              },
            }}
          >
            {/* Header Section */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap={1}
              mb={1.5}
            >
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{
                  minWidth: 0, // Allow flexbox to shrink
                  flex: 1,
                }}
              >
                <Box
                  sx={{
                    color: theme.palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0, // Icon never shrinks
                  }}
                >
                  {getSessionIcon(basePath, sessionType)}
                </Box>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0, // Allow text to shrink
                    [theme.breakpoints.down('sm')]: {
                      fontSize: theme.typography.body1.fontSize,
                    },
                  }}
                >
                  {sessionName}
                </Typography>
              </Box>
              {/* FLEX badge for flexible resources */}
              {isFixedResources === false && (
                <Chip
                  label="FLEX"
                  size="small"
                  sx={{
                    height: '20px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: theme.palette.success.light,
                    color: theme.palette.success.contrastText,
                    flexShrink: 0,
                  }}
                />
              )}
              {/* FIXED badge for fixed-resource sessions */}
              {isFixedResources === true && (
                <Chip
                  label="FIXED"
                  size="small"
                  sx={{
                    height: '20px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: theme.palette.primary.dark,
                    color: theme.palette.primary.contrastText,
                    flexShrink: 0,
                  }}
                />
              )}
            </Box>
            <Divider sx={{ mx: theme.spacing(-2), mb: theme.spacing(1.5) }} />

            {/* Details Section */}
            <Stack spacing={1} mb={theme.spacing(2)}>
              <Box display="flex" justifyContent="flex-end">
                <Chip
                  label={status}
                  color={getStatusColor(status)}
                  size="small"
                  sx={{
                    fontWeight: theme.typography.fontWeightMedium,
                    flexShrink: 0,
                    [theme.breakpoints.down('sm')]: {
                      fontSize: theme.typography.caption.fontSize,
                      height: 'auto',
                      minHeight: '24px',
                    },
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  [theme.breakpoints.up('sm')]: {
                    flexDirection: 'row',
                    alignItems: 'baseline',
                  },
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  component="span"
                  sx={{
                    flexShrink: 0,
                    mr: 1,
                    [theme.breakpoints.down('sm')]: {
                      fontSize: theme.typography.caption.fontSize,
                      marginBottom: '2px',
                    },
                  }}
                >
                  Project:
                </Typography>
                <Typography
                  variant="body2"
                  component="span"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    flex: 1,
                    fontWeight: theme.typography.fontWeightBold,
                    [theme.breakpoints.down('sm')]: {
                      fontSize: theme.typography.caption.fontSize,
                    },
                  }}
                >
                  {parseImagePath(containerImage).project}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  [theme.breakpoints.up('sm')]: {
                    flexDirection: 'row',
                    alignItems: 'baseline',
                  },
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  component="span"
                  sx={{
                    flexShrink: 0,
                    mr: 1,
                    [theme.breakpoints.down('sm')]: {
                      fontSize: theme.typography.caption.fontSize,
                      marginBottom: '2px',
                    },
                  }}
                >
                  Container:
                </Typography>
                <Typography
                  variant="body2"
                  component="span"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    flex: 1,
                    fontWeight: theme.typography.fontWeightBold,
                    [theme.breakpoints.down('sm')]: {
                      fontSize: theme.typography.caption.fontSize,
                    },
                  }}
                  title={containerImage} // Show full text on hover
                >
                  {parseImagePath(containerImage).image}
                </Typography>
              </Box>

              <Box display="flex" flexDirection="column" gap={theme.spacing(0.5)}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="span"
                    sx={{ mr: 1 }}
                  >
                    Started:
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      fontWeight: theme.typography.fontWeightBold,
                      [theme.breakpoints.down('sm')]: {
                        fontSize: theme.typography.caption.fontSize,
                      },
                    }}
                  >
                    {formatTimestamp(startedTime)} UTC
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="span"
                    sx={{ mr: 1 }}
                  >
                    Expires:
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      fontWeight: theme.typography.fontWeightBold,
                      [theme.breakpoints.down('sm')]: {
                        fontSize: theme.typography.caption.fontSize,
                      },
                    }}
                  >
                    {formatTimestamp(expiresTime)} UTC
                  </Typography>
                </Box>
              </Box>

              <Box
                display="flex"
                sx={{
                  flexWrap: 'wrap',
                  columnGap: theme.spacing(3),
                  rowGap: theme.spacing(0.5),
                  // Reserve room for the 2-row worst case (Memory/CPU on row 1, GPU on
                  // row 2) so cards keep the same height regardless of value length.
                  minHeight: theme.spacing(6),
                }}
              >
                <Box
                  sx={{
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    [theme.breakpoints.up('sm')]: {
                      flexDirection: 'row',
                      alignItems: 'baseline',
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="span"
                    sx={{
                      flexShrink: 0,
                      mr: 1,
                      [theme.breakpoints.down('sm')]: {
                        fontSize: theme.typography.caption.fontSize,
                        marginBottom: '2px',
                      },
                    }}
                  >
                    Memory:
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      fontWeight: theme.typography.fontWeightBold,
                      [theme.breakpoints.down('sm')]: {
                        fontSize: theme.typography.caption.fontSize,
                      },
                    }}
                  >
                    {isFixedResources === false
                      ? formatMemoryUnit(memoryUsage)
                      : `${stripMemoryUnit(memoryUsage)} / ${formatMemoryUnit(memoryAllocated)}`}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    [theme.breakpoints.up('sm')]: {
                      flexDirection: 'row',
                      alignItems: 'baseline',
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="span"
                    sx={{
                      flexShrink: 0,
                      mr: 1,
                      [theme.breakpoints.down('sm')]: {
                        fontSize: theme.typography.caption.fontSize,
                        marginBottom: '2px',
                      },
                    }}
                  >
                    CPU:
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      fontWeight: theme.typography.fontWeightBold,
                      [theme.breakpoints.down('sm')]: {
                        fontSize: theme.typography.caption.fontSize,
                      },
                    }}
                  >
                    {isFixedResources === false
                      ? cpuUsage || 'N/A'
                      : `${cpuUsage || 'N/A'} / ${cpuAllocated}`}
                  </Typography>
                </Box>
                {/* Always rendered (visibility-hidden when 0) so the card height
                    doesn't jump between sessions with and without a GPU. */}
                <Box
                  aria-hidden={!gpuAllocated || gpuAllocated === '0' ? true : undefined}
                  sx={{
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    visibility:
                      gpuAllocated && gpuAllocated !== '0' ? 'visible' : 'hidden',
                    [theme.breakpoints.up('sm')]: {
                      flexDirection: 'row',
                      alignItems: 'baseline',
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="span"
                    sx={{
                      flexShrink: 0,
                      mr: 1,
                      [theme.breakpoints.down('sm')]: {
                        fontSize: theme.typography.caption.fontSize,
                        marginBottom: '2px',
                      },
                    }}
                  >
                    GPU:
                  </Typography>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      fontWeight: theme.typography.fontWeightBold,
                      [theme.breakpoints.down('sm')]: {
                        fontSize: theme.typography.caption.fontSize,
                      },
                    }}
                  >
                    {gpuAllocated || '0'}
                  </Typography>
                </Box>
              </Box>
            </Stack>

            {/* Footer Actions */}
            <Box
              display="flex"
              gap={theme.spacing(0.5)}
              sx={{
                borderTop: 1,
                borderColor: theme.palette.divider,
                pt: theme.spacing(1.5),
                mt: theme.spacing(2),
                mx: theme.spacing(-2),
                px: theme.spacing(2),
                justifyContent: 'flex-end',
                flexWrap: 'wrap', // Allow wrapping on very small screens
                [theme.breakpoints.down('sm')]: {
                  justifyContent: 'space-evenly', // Better distribution on mobile
                  gap: theme.spacing(0.5), // Consistent gap
                  pt: theme.spacing(2), // More padding on mobile
                },
              }}
            >
              <Tooltip
                title={status === 'Pending' ? 'Cannot extend a pending session' : 'Extend time'}
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={handleExtendClick}
                    aria-label="Extend time"
                    disabled={status === 'Pending'}
                    sx={{
                      [theme.breakpoints.down('sm')]: {
                        minWidth: '44px',
                        minHeight: '44px',
                      },
                    }}
                  >
                    <ExtendIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="View session logs">
                <IconButton
                  size="small"
                  onClick={handleShowLogs}
                  aria-label="View logs"
                  sx={{
                    [theme.breakpoints.down('sm')]: {
                      minWidth: '44px',
                      minHeight: '44px',
                    },
                  }}
                >
                  <LogsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="View launch info">
                <IconButton
                  size="small"
                  onClick={handleShowEvents}
                  aria-label="View events"
                  sx={{
                    [theme.breakpoints.down('sm')]: {
                      minWidth: '44px',
                      minHeight: '44px',
                    },
                  }}
                >
                  <FlagIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete session">
                <IconButton
                  size="small"
                  onClick={handleDeleteClick}
                  aria-label="Delete session"
                  sx={{
                    [theme.breakpoints.down('sm')]: {
                      minWidth: '44px',
                      minHeight: '44px', // Ensure touch-friendly size on mobile
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </MuiCard>

        {/* Events Modal */}
        <EventsModal
          open={showEventsModal}
          sessionId={sessionId || sessionName}
          sessionName={sessionName}
          onClose={() => setShowEventsModal(false)}
          showRefreshButton={true}
          eventsEndpoint={apiRoutes.sessions.events(sessionId || sessionName)}
        />

        {/* Logs Modal (Raw view only, parsing disabled) */}
        <EventsModal
          open={showLogsModal}
          sessionId={sessionId || sessionName}
          sessionName={`${sessionName} - Logs`}
          onClose={() => setShowLogsModal(false)}
          showRefreshButton={true}
          forceRawView={true}
          defaultView="raw"
          eventsEndpoint={apiRoutes.sessions.logs(sessionId || sessionName)}
        />

        {/* Delete Confirmation Modal */}
        <DeleteSessionModal
          open={showDeleteModal}
          sessionName={sessionName}
          sessionId={sessionId || ''}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />

        {/* Session Renewal Modal */}
        <SessionRenewModal
          open={showRenewModal}
          sessionName={sessionName}
          sessionId={sessionId}
          onClose={() => setShowRenewModal(false)}
          onConfirm={handleRenewConfirm}
          isRenewing={isRenewing}
        />
      </>
    );
  },
);

SessionCardImpl.displayName = 'SessionCardImpl';
