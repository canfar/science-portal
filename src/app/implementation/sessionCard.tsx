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
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Flag as FlagIcon,
  Description as LogsIcon,
  Schedule as ExtendIcon,
  Science as JupyterIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import {
  SessionCardProps,
  SessionType,
  SessionStatus,
} from '@/app/types/SessionCardProps';
import React, { useState, useMemo, useCallback } from 'react';
import { EventsModal } from '@/app/components/EventsModal/EventsModal';
import { DeleteSessionModal } from '@/app/components/DeleteSessionModal/DeleteSessionModal';
import { SessionRenewModal } from '@/app/components/SessionRenewModal/SessionRenewModal';

const getSessionIcon = (type: SessionType): React.ReactNode => {
  const iconSize = 24; // Standard icon size
  const iconStyle = { width: iconSize, height: iconSize, objectFit: 'contain' as const };

  switch (type) {
    case 'notebook':
    case 'contributednotebook':
        return <img src="/notebook_icon.jpg" alt="Desktop" style={iconStyle} />;
    case 'desktop':
    case 'contributeddesktop':
      return <img src="/desktop_icon.png" alt="Desktop" style={iconStyle} />;
    case 'carta':
      return <img src="/carta_icon.png" alt="CARTA" style={iconStyle} />;
    case 'contributed':
      return <img src="/contributed_icon.png" alt="Contributed" style={iconStyle} />;
    case 'firefly':
      return <img src="/firefly_icon.png" alt="Firefly" style={iconStyle} />;
    default:
      return <CodeIcon />;
  }
};

const getStatusColor = (
  status: SessionStatus
): 'success' | 'warning' | 'error' | 'default' => {
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
 * Extract project and image name from full container image path
 * Example: "images.canfar.net/skaha/firefly:2025.2" -> "skaha/firefly:2025.2"
 */
const getShortImageName = (fullImagePath: string): string => {
  // Handle undefined, null, or empty values
  if (!fullImagePath) {
    return 'N/A';
  }

  // Split by "/" and take everything after the first part (registry host)
  const parts = fullImagePath.split('/');
  if (parts.length > 1) {
    // Remove the first part (registry host) and join the rest
    return parts.slice(1).join('/');
  }
  // If no "/" found, return as-is
  return fullImagePath;
};

/**
 * Format timestamp to remove seconds and 'Z', and replace 'T' with space
 * Example: "2025-10-17T15:03:29Z" -> "2025-10-17 15:03"
 */
const formatTimestamp = (timestamp: string): string => {
  // Handle undefined, null, or empty values
  if (!timestamp) {
    return 'Pending...';
  }

  // Remove seconds and 'Z' from ISO timestamp, replace 'T' with space
  // Format: YYYY-MM-DDTHH:MM:SSZ -> YYYY-MM-DD HH:MM
  return timestamp.replace(/:\d{2}Z?\s*$/, '').replace('Z', '').replace('T', ' ');
};

export const SessionCardImpl = React.forwardRef<
  HTMLDivElement,
  SessionCardProps
>(
  (
    {
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
      onDelete,
      onShowEvents,
      onShowLogs,
      onExtendTime,
      onClick,
      loading = false,
      isOperating = false,
      // disableHover = true, // Hover effects removed globally
      ...cardProps
    },
    ref
  ) => {
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
      } catch (error) {
        console.error('Error deleting session:', error);
      } finally {
        setIsDeleting(false);
        setShowDeleteModal(false);
      }
    }, [onDelete]);

    const handleExtendClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowRenewModal(true);
    };

    const handleRenewConfirm = useCallback(async (hours: number) => {
      setIsRenewing(true);
      try {
        // Call the actual renew function
        if (onExtendTime) {
          await onExtendTime();
        }
        // Wait a bit to show success state
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error renewing session:', error);
      } finally {
        setIsRenewing(false);
        setTimeout(() => {
          setShowRenewModal(false);
        }, 500);
      }
    }, [onExtendTime]);

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
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
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
          {/* Operating state overlay */}
          {isOperating && (
            <Backdrop
              open={isOperating}
              sx={{
                position: 'absolute',
                zIndex: theme.zIndex.drawer + 1,
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(0, 0, 0, 0.7)'
                  : 'rgba(255, 255, 255, 0.7)',
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
              mb={2}
              sx={{
                [theme.breakpoints.down('sm')]: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 1,
                },
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{
                  minWidth: 0, // Allow flexbox to shrink
                  flex: 1,
                  [theme.breakpoints.down('sm')]: {
                    width: '100%',
                  },
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
                  {getSessionIcon(sessionType)}
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
              </Box>
              <Chip
                label={status}
                color={getStatusColor(status)}
                size="small"
                sx={{
                  fontWeight: theme.typography.fontWeightMedium,
                  flexShrink: 0, // Chip never shrinks
                  [theme.breakpoints.down('sm')]: {
                    alignSelf: 'flex-start',
                    fontSize: theme.typography.caption.fontSize,
                    height: 'auto',
                    minHeight: '24px',
                  },
                }}
              />
            </Box>

            {/* Details Section */}
            <Stack spacing={1} mb={theme.spacing(2)}>
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
                  {getShortImageName(containerImage)}
                </Typography>
              </Box>

              <Box
                display="flex"
                flexDirection="column"
                gap={theme.spacing(0.5)}
              >
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
                gap={theme.spacing(3)}
                sx={{
                  [theme.breakpoints.down('sm')]: {
                    flexDirection: 'column',
                    gap: theme.spacing(1),
                  },
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
                      ? (memoryUsage || 'N/A')
                      : `${memoryUsage || 'N/A'} / ${memoryAllocated}`
                    }
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
                      ? (cpuUsage || 'N/A')
                      : `${cpuUsage || 'N/A'} / ${cpuAllocated}`
                    }
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
                justifyContent: 'flex-start',
                flexWrap: 'wrap', // Allow wrapping on very small screens
                [theme.breakpoints.down('sm')]: {
                  justifyContent: 'space-evenly', // Better distribution on mobile
                  gap: theme.spacing(0.5), // Consistent gap
                  pt: theme.spacing(2), // More padding on mobile
                },
              }}
            >
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
              <Tooltip title="View events">
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
              <Tooltip title="View logs">
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
              <Tooltip title={status === 'Pending' ? "Cannot extend a pending session" : "Extend time"}>
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
          eventsEndpoint={`/api/sessions/${sessionId || sessionName}/events`}
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
          eventsEndpoint={`/api/sessions/${sessionId || sessionName}/logs`}
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
  }
);

SessionCardImpl.displayName = 'SessionCardImpl';
