'use client';

import React, { useState } from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { ActiveSessionsWidgetProps } from '@/app/types/ActiveSessionsWidgetProps';
import { SessionCard } from '@/app/components/SessionCard/SessionCard';
import { SessionCheckModal } from '@/app/components/SessionCheckModal/SessionCheckModal';

const SESSION_CARD_MIN = 320;
const SESSION_CARD_MAX = 460;

const gridSx = {
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, minmax(${SESSION_CARD_MIN}px, 1fr))`,
  gap: 2,
  alignItems: 'start',
} as const;

const cardSx = {
  width: '100%',
  maxWidth: SESSION_CARD_MAX,
};

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
}: ActiveSessionsWidgetProps) {
  const theme = useTheme();
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const displayTitle =
    showSessionCount && sessions.length > 0 ? `${title} (${sessions.length})` : title;

  const sessionsToDisplay = maxSessionsToShow ? sessions.slice(0, maxSessionsToShow) : sessions;

  const hasMoreSessions = maxSessionsToShow && sessions.length > maxSessionsToShow;

  const handleRefreshClick = () => {
    setShowCheckModal(true);
    setIsChecking(true);

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
          <Box sx={gridSx}>
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
                sx={cardSx}
              />
            ))}
          </Box>
        ) : sessions.length === 0 ? (
          <Card
            elevation={0}
            variant="outlined"
            sx={{
              ...cardSx,
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
                background:
                  theme.palette.mode === 'dark'
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
                  color:
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                  fontWeight: 400,
                }}
              >
                {emptyMessage}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Box sx={gridSx}>
              {sessionsToDisplay.map((session, index) => (
                <SessionCard
                  key={session.sessionName || `session-${index}`}
                  {...session}
                  isOperating={
                    !!(session.id && operatingSessionIds.has(session.id)) ||
                    !!(
                      session.id &&
                      pollingSessionId === session.id &&
                      session.status === 'Pending' &&
                      !session.connectUrl
                    )
                  }
                  disableHover={true}
                  sx={cardSx}
                />
              ))}
            </Box>
            {hasMoreSessions && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ pt: 2 }}>
                And {sessions.length - maxSessionsToShow} more...
              </Typography>
            )}
          </>
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
