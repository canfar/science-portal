'use client';

import React, { useState } from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  LinearProgress,
  Stack,
  useMediaQuery,
  Card,
  CardContent,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { ActiveSessionsWidgetProps } from '@/app/types/ActiveSessionsWidgetProps';
import { SessionCard } from '@/app/components/SessionCard/SessionCard';
import { SessionCheckModal } from '@/app/components/SessionCheckModal/SessionCheckModal';

export function ActiveSessionsWidgetImpl({
  sessions = [],
  operatingSessionIds = new Set(),
  pollingSessionId = null,
  isLoading = false,
  onRefresh,
  title = 'Active Sessions',
  showSessionCount = true,
  maxSessionsToShow,
  emptyMessage = 'No active sessions',
  layout = 'column',
  sessionCardMaxWidth = 400,
}: ActiveSessionsWidgetProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Changed from 'md' to 'sm' for better mobile-first approach
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Determine effective layout based on responsive mode with better breakpoints
  const effectiveLayout =
    layout === 'responsive' ? (isMobile ? 'column' : 'row') : layout;

  // Responsive card width based on viewport
  const responsiveCardMaxWidth = isMobile
    ? '100%' // Full width on mobile
    : isTablet
      ? Math.min(
          typeof sessionCardMaxWidth === 'number' ? sessionCardMaxWidth : 400,
          350
        ) // Smaller max width on tablet
      : sessionCardMaxWidth;

  // Ensure numeric values for minWidth in row layout
  const responsiveMinWidth = isMobile
    ? 280
    : typeof responsiveCardMaxWidth === 'number'
      ? responsiveCardMaxWidth
      : 400;

  const displayTitle =
    showSessionCount && sessions.length > 0
      ? `${title} (${sessions.length})`
      : title;

  const sessionsToDisplay = maxSessionsToShow
    ? sessions.slice(0, maxSessionsToShow)
    : sessions;

  const hasMoreSessions =
    maxSessionsToShow && sessions.length > maxSessionsToShow;

  const handleRefreshClick = () => {
    setShowCheckModal(true);
    setIsChecking(true);

    // Simulate checking process
    setTimeout(() => {
      setIsChecking(false);
      onRefresh?.();
      setTimeout(() => {
        setShowCheckModal(false);
      }, 1000);
    }, 2000);
  };

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        position: 'relative',
        padding: theme.spacing(2),
        overflow: 'hidden',
        borderRadius: theme.shape.borderRadius,
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
          {displayTitle}
        </Typography>
        {onRefresh && (
          <IconButton
            aria-label="refresh"
            onClick={handleRefreshClick}
            disabled={isLoading}
            size="small"
          >
            <RefreshIcon />
          </IconButton>
        )}
      </Box>

      {/* Loading Bar */}
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

      {/* Content - Session Cards */}
      <Box sx={{ marginBottom: theme.spacing(2) }}>
        {isLoading ? (
          // Show skeleton cards during loading
          effectiveLayout === 'column' ? (
            <Stack spacing={2}>
              {[1, 2, 3].map((index) => (
                <SessionCard
                  key={`skeleton-${index}`}
                  sessionType="notebook"
                  sessionName=""
                  status="Running"
                  containerImage=""
                  startedTime=""
                  expiresTime=""
                  memoryAllocated=""
                  cpuAllocated=""
                  loading={true}
                  sx={{
                    maxWidth: responsiveCardMaxWidth,
                    width: isMobile ? '100%' : 'auto',
                  }}
                />
              ))}
            </Stack>
          ) : (
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                overflowY: 'hidden',
                pb: 1,
              }}
            >
              {[1, 2, 3].map((index) => (
                <SessionCard
                  key={`skeleton-${index}`}
                  sessionType="notebook"
                  sessionName=""
                  status="Running"
                  containerImage=""
                  startedTime=""
                  expiresTime=""
                  memoryAllocated=""
                  cpuAllocated=""
                  loading={true}
                  sx={{
                    minWidth: responsiveMinWidth,
                    maxWidth: responsiveCardMaxWidth,
                    flexShrink: 0,
                  }}
                />
              ))}
            </Box>
          )
        ) : sessions.length === 0 ? (
          // Show empty state with subtle gradient background - same size as SessionCard
          <Card
            elevation={0}
            variant="outlined"
            sx={{
              maxWidth: responsiveCardMaxWidth,
              width: isMobile ? '100%' : 'auto',
              border: `1px solid ${theme.palette.divider}`,
              cursor: 'default',
            }}
          >
            <CardContent
              sx={{
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.05) 100%)',
                [theme.breakpoints.down('sm')]: {
                  padding: theme.spacing(2),
                  '&:last-child': {
                    paddingBottom: theme.spacing(2),
                  },
                },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.3)'
                    : 'rgba(0,0,0,0.3)',
                  fontWeight: 400,
                }}
              >
                {emptyMessage}
              </Typography>
            </CardContent>
          </Card>
        ) : effectiveLayout === 'column' ? (
          <Stack spacing={2}>
            {sessionsToDisplay.map((session, index) => (
              <SessionCard
                key={session.sessionName || `session-${index}`}
                {...session}
                isOperating={
                  !!(session.id && operatingSessionIds.has(session.id)) ||
                  !!(session.id && pollingSessionId === session.id && session.status === 'Pending' && !session.connectUrl)
                }
                disableHover={true}
                sx={{
                  maxWidth: responsiveCardMaxWidth,
                  width: isMobile ? '100%' : 'auto', // Full width on mobile
                }}
              />
            ))}
            {hasMoreSessions && (
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ py: 1 }}
              >
                And {sessions.length - maxSessionsToShow} more...
              </Typography>
            )}
          </Stack>
        ) : (
          <Box>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                overflowY: 'hidden',
                pb: 1,
                // Custom scrollbar styling
                '&::-webkit-scrollbar': {
                  height: 8,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: theme.palette.action.hover,
                  borderRadius: 2,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.action.disabled,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: theme.palette.action.selected,
                  },
                },
                // Firefox scrollbar
                scrollbarWidth: 'thin',
                scrollbarColor: `${theme.palette.action.disabled} ${theme.palette.action.hover}`,
              }}
            >
              {sessionsToDisplay.map((session, index) => (
                <SessionCard
                  key={session.sessionName || `session-${index}`}
                  {...session}
                  isOperating={
                    !!(session.id && operatingSessionIds.has(session.id)) ||
                    !!(session.id && pollingSessionId === session.id && session.status === 'Pending' && !session.connectUrl)
                  }
                  disableHover={true}
                  sx={{
                    minWidth: responsiveMinWidth, // Smaller min width on mobile
                    maxWidth: responsiveCardMaxWidth,
                    flexShrink: 0,
                  }}
                />
              ))}
            </Box>
            {hasMoreSessions && (
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ pt: 2 }}
              >
                And {sessions.length - maxSessionsToShow} more...
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Session Check Modal */}
      <SessionCheckModal
        open={showCheckModal}
        onClose={() => setShowCheckModal(false)}
        isChecking={isChecking}
      />
    </Paper>
  );
}
