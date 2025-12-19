'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  CloudDownload as CloudDownloadIcon,
  CloudDone as CloudDoneIcon,
  PlayCircle as PlayCircleIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import type {
  EventsModalProps,
  SessionEvent,
  EventType,
  EventReason,
  UseSessionEventsReturn,
} from '@/app/types/EventsModalProps';
import { getAuthHeader } from '@/lib/auth/token-storage';

/**
 * Parse raw log data into structured events
 */
const parseEventLog = (
  logData: string
): { events: SessionEvent[]; hasParseErrors: boolean } => {
  const lines = logData.trim().split('\n');
  if (lines.length < 2) return { events: [], hasParseErrors: false };

  const events: SessionEvent[] = [];
  let hasParseErrors = false;

  // Skip header line and parse data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse the log line - format: TYPE REASON MESSAGE FIRST-TIME LAST-TIME
    // Using regex to handle spaces in message
    const match = line.match(
      /^(\S+)\s+(\S+)\s+(.*?)\s+(\S+|<nil>)\s+(\S+|<nil>)$/
    );

    if (match) {
      const [, type, reason, message, firstTime, lastTime] = match;

      events.push({
        id: `event-${i}-${Date.now()}`,
        type: type as EventType,
        reason: reason as EventReason,
        message: message.trim(),
        firstTime: firstTime === '<nil>' ? null : firstTime,
        lastTime: lastTime === '<nil>' ? null : lastTime,
      });
    } else {
      // Mark that we had parsing errors but continue trying to parse other lines
      hasParseErrors = true;
      console.warn(`Failed to parse event line ${i}: ${line}`);
    }
  }

  return { events, hasParseErrors };
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: string | null): string => {
  if (!timestamp) return '-';

  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return timestamp;
  }
};

/**
 * Get icon for event reason
 */
const getEventIcon = (reason: EventReason) => {
  switch (reason) {
    case 'Scheduled':
      return <ScheduleIcon fontSize="small" />;
    case 'Pulling':
      return <CloudDownloadIcon fontSize="small" />;
    case 'Pulled':
      return <CloudDoneIcon fontSize="small" />;
    case 'Created':
    case 'Started':
      return <PlayCircleIcon fontSize="small" />;
    case 'Failed':
    case 'BackOff':
    case 'Unhealthy':
      return <ErrorIcon fontSize="small" />;
    default:
      return <FlagIcon fontSize="small" />;
  }
};

/**
 * Get chip color for event type
 */
const getEventTypeColor = (
  type: EventType
): 'success' | 'warning' | 'error' | 'default' => {
  switch (type) {
    case 'Normal':
      return 'success';
    case 'Warning':
      return 'warning';
    case 'Error':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Custom hook for fetching session events
 */
const useSessionEvents = (
  sessionId: string,
  open: boolean,
  eventsEndpoint?: string,
  initialEvents?: SessionEvent[]
): UseSessionEventsReturn => {
  const [events, setEvents] = useState<SessionEvent[]>(initialEvents || []);
  const [rawData, setRawData] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialEvents);
  const [error, setError] = useState<string | null>(null);
  const [parseError, setParseError] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!sessionId || !open) return;

    setLoading(true);
    setError(null);
    setParseError(false);

    try {
      const endpoint =
        eventsEndpoint || `/api/sessions/${sessionId}/logs`;

      const authHeaders = getAuthHeader();

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
          ...authHeaders,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      const data = await response.text();
      setRawData(data); // Store raw data for raw view

      const { events: parsedEvents, hasParseErrors } = parseEventLog(data);
      setEvents(parsedEvents);
      setParseError(hasParseErrors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, open, eventsEndpoint]);

  useEffect(() => {
    if (open && !initialEvents) {
      fetchEvents();
    }
  }, [open, fetchEvents, initialEvents]);

  // Set initial raw data if initialEvents provided (for Storybook)
  useEffect(() => {
    if (initialEvents && !rawData) {
      // Generate mock raw data from initial events
      const header =
        'TYPE     REASON      MESSAGE                                                                                                                        FIRST-TIME             LAST-TIME';
      const lines = initialEvents.map(
        (e) =>
          `${e.type}   ${e.reason}   ${e.message}   ${e.firstTime || '<nil>'}   ${e.lastTime || '<nil>'}`
      );
      setRawData([header, ...lines].join('\n'));
    }
  }, [initialEvents, rawData]);

  return {
    events,
    rawData,
    loading,
    error,
    parseError,
    refresh: fetchEvents,
  };
};

/**
 * EventsModal implementation
 */
export const EventsModalImpl: React.FC<EventsModalProps> = ({
  open,
  sessionId,
  sessionName = 'Session',
  onClose,
  onRefresh,
  eventsEndpoint,
  initialEvents,
  maxEvents = 100,
  showRefreshButton = true,
  autoScroll = false,
  forceRawView = false,
  defaultView = 'table',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [showRawView, setShowRawView] = useState(
    forceRawView || defaultView === 'raw'
  );

  const { events, rawData, loading, error, parseError, refresh } =
    useSessionEvents(sessionId, open, eventsEndpoint, initialEvents);

  // Sort events by timestamp (most recent first)
  const sortedEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => {
        const timeA = a.lastTime || a.firstTime || '';
        const timeB = b.lastTime || b.firstTime || '';
        return timeB.localeCompare(timeA);
      })
      .slice(0, maxEvents);
  }, [events, maxEvents]);

  const handleRefresh = useCallback(() => {
    refresh();
    onRefresh?.();
  }, [refresh, onRefresh]);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && open) {
      const content = document.getElementById('events-modal-content');
      if (content) {
        content.scrollTop = content.scrollHeight;
      }
    }
  }, [sortedEvents, autoScroll, open]);

  // Auto-switch to raw view if parsing errors detected
  useEffect(() => {
    if (parseError && !showRawView) {
      setShowRawView(true);
    }
  }, [parseError, showRawView]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      aria-labelledby="events-modal-title"
    >
      <DialogTitle id="events-modal-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <FlagIcon />
            <Typography variant="h6">
              Container Events - {sessionName}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {showRefreshButton && !loading && (
              <Tooltip title="Refresh events">
                <IconButton
                  onClick={handleRefresh}
                  size="small"
                  aria-label="refresh events"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={onClose} size="small" aria-label="close modal">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent id="events-modal-content" dividers>
        {/* View toggle and parse error warning */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={showRawView}
                onChange={(e) => setShowRawView(e.target.checked)}
                color="primary"
                disabled={forceRawView}
              />
            }
            label={forceRawView ? 'Raw view (parsing disabled)' : 'Raw view'}
          />
          {parseError && !showRawView && !forceRawView && (
            <Alert severity="warning" sx={{ flex: 1, ml: 2 }}>
              Some events could not be parsed. Enable raw view to see all data.
            </Alert>
          )}
        </Box>

        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            py={4}
          >
            <CircularProgress />
          </Box>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button size="small" onClick={handleRefresh} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        )}

        {/* Raw view display */}
        {!loading && !error && showRawView && rawData && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: theme.palette.grey[50],
              ...(theme.palette.mode === 'dark' && {
                backgroundColor: theme.palette.grey[900],
              }),
            }}
          >
            <Typography
              component="pre"
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                m: 0,
              }}
            >
              {rawData}
            </Typography>
          </Paper>
        )}

        {/* Table view display */}
        {!loading && !error && !showRawView && sortedEvents.length === 0 && (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <Typography variant="h6" gutterBottom>
              No events available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No container events have been recorded for this session yet.
            </Typography>
          </Box>
        )}

        {!loading && !error && !showRawView && sortedEvents.length > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Reason</TableCell>
                  {!isTablet && <TableCell>Message</TableCell>}
                  <TableCell>First Time</TableCell>
                  <TableCell>Last Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedEvents.map((event) => (
                  <TableRow key={event.id} hover>
                    <TableCell>
                      <Chip
                        label={event.type}
                        color={getEventTypeColor(event.type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {getEventIcon(event.reason)}
                        <Typography variant="body2">{event.reason}</Typography>
                      </Box>
                    </TableCell>
                    {!isTablet && (
                      <TableCell>
                        <Tooltip title={event.message} placement="top">
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {event.message}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    )}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatTimestamp(event.firstTime)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatTimestamp(event.lastTime)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
