'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  MenuItem,
  Button,
  Alert,
  Divider,
  Grid,
  Tooltip,
  SelectChangeEvent,
  useTheme,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Skeleton,
  Stack,
} from '@mui/material';
import { HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs';
import { Select } from '@/app/components/Select/Select';
import { TextField } from '@/app/components/TextField/TextField';
import { Card, CardContent } from '@/app/components/Card';
import { CanfarRange } from '@/app/components/CanfarRange/CanfarRange';
import {
  SessionLaunchFormProps,
  SessionFormData,
  SessionType,
} from '@/app/types/SessionLaunchFormProps';
import { getProjectNames } from '@/lib/utils/image-parser';
import {
  DEFAULT_CORES_NUMBER,
  DEFAULT_RAM_NUMBER,
  supportsCustomResources,
  DESKTOP_TYPE,
  FIREFLY_TYPE,
  NOTEBOOK_TYPE,
  SKAHA_PROJECT,
} from '@/lib/config/constants';
import { startsWithNumber } from '@/lib/utils/validation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  const theme = useTheme();

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`session-tabpanel-${index}`}
      aria-labelledby={`session-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: theme.spacing(3) }}>{children}</Box>}
    </div>
  );
}

const DEFAULT_MEMORY_OPTIONS = [
  1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 26, 28, 30, 32, 36, 40, 44, 48, 56, 64,
  80, 92, 112, 128, 140, 170, 192,
];
const DEFAULT_CORE_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 1);

// Read experimental feature flag from env
const USE_EXPERIMENTAL_FEATURES = process.env.NEXT_PUBLIC_EXPERIMENTAL === 'true';

export const SessionLaunchFormImpl = React.forwardRef<
  HTMLDivElement,
  SessionLaunchFormProps
>(
  (
    {
      onLaunch,
      onReset,
      onSessionTypeChange,
      imagesByType = {},
      repositoryHosts = ['images-rc.canfar.net'],
      memoryOptions,
      coreOptions,
      gpuOptions,
      defaultValues = {
        type: NOTEBOOK_TYPE,
        project: SKAHA_PROJECT,
        containerImage: '', // Will be auto-selected from imagesByType when data loads
        sessionName: 'notebook1',
        memory: DEFAULT_RAM_NUMBER,
        cores: DEFAULT_CORES_NUMBER,
        gpus: 0,
      },
      isLoading = false,
      errorMessage,
      activeSessions = [],
    },
    ref
  ) => {
    const theme = useTheme();

    // URL query parameters for deep linking
    const [urlParams, setUrlParams] = useQueryStates(
      {
        tab: parseAsInteger.withDefault(0), // 0 = Standard, 1 = Advanced
        type: parseAsString.withDefault(defaultValues.type || NOTEBOOK_TYPE),
        project: parseAsString.withDefault(defaultValues.project || SKAHA_PROJECT),
        image: parseAsString.withDefault(defaultValues.containerImage || ''), // Will be auto-selected
        name: parseAsString.withDefault(defaultValues.sessionName || ''),
        memory: parseAsInteger, // Nullable - only present for Fixed resources
        cores: parseAsInteger, // Nullable - only present for Fixed resources
        gpus: parseAsInteger, // Nullable - only present for Fixed resources
      },
      {
        history: 'replace', // Use replace to avoid cluttering browser history
      }
    );

    // Initialize tab from URL parameter
    const [tabValue, setTabValue] = useState(urlParams.tab);

    // Initialize resource type based on presence of cores/memory/gpus in URL
    const initialResourceType = (urlParams.cores !== null || urlParams.memory !== null || urlParams.gpus !== null) ? 'fixed' : 'flexible';
    const [resourceType, setResourceType] = useState<'flexible' | 'fixed'>(initialResourceType);

    const [formData, setFormData] = useState<SessionFormData>({
      type: urlParams.type as SessionType,
      project: urlParams.project,
      containerImage: urlParams.image,
      sessionName: urlParams.name || defaultValues.sessionName || 'notebook1',
      memory: urlParams.memory ?? defaultValues.memory ?? DEFAULT_RAM_NUMBER,
      cores: urlParams.cores ?? defaultValues.cores ?? DEFAULT_CORES_NUMBER,
      gpus: urlParams.gpus ?? defaultValues.gpus ?? 0,
      resourceType: initialResourceType, // Track resource type
      // Advanced tab fields
      repositoryHost: repositoryHosts.find(host => host && typeof host === 'string') || 'images-rc.canfar.net',
      image: '',
      repositoryAuthUsername: '',
      repositoryAuthSecret: '',
    });

    // Get available projects for the selected session type
    const availableProjects = useMemo(() => {
      const imagesForType = imagesByType[formData.type];
      if (!imagesForType) return [];
      return getProjectNames(imagesForType);
    }, [imagesByType, formData.type]);

    // Get available images for the selected type and project
    // Filter by the primary repository host (first in repositoryHosts array)
    const availableImages = useMemo(() => {
      const imagesForType = imagesByType[formData.type];
      if (!imagesForType || !formData.project) return [];
      const imagesForProject = imagesForType[formData.project];
      if (!imagesForProject) return [];

      // Filter images to only show those from the primary repository host
      const validHosts = repositoryHosts.filter(host => host && typeof host === 'string');
      const primaryHost = validHosts[0];
      if (!primaryHost) return imagesForProject;

      return imagesForProject.filter(img => img.registry === primaryHost);
    }, [imagesByType, formData.type, formData.project, repositoryHosts]);

    // Check if the selected session type supports resource configuration
    // firefly and desktop don't support custom resource allocation
    const supportsResourceConfig = useMemo(() => {
      return supportsCustomResources(formData.type);
    }, [formData.type]);

    // Memoize just the count, not the entire array
    const activeSessionsCount = useMemo(() => activeSessions.length, [activeSessions.length]);

    // Generate the next available session name based on active sessions
    const generateSessionName = useCallback((sessionType: string): string => {
      // Count all active sessions (regardless of type) to determine the next counter
      // The counter starts at activeSessionsCount + 1
      const counter = activeSessionsCount + 1;

      return `${sessionType}${counter}`;
    }, [activeSessionsCount]);

    // Update session name when active sessions count changes or type changes
    // Auto-generate session name when type changes or on mount
    useEffect(() => {
      const newSessionName = generateSessionName(formData.type);
      setFormData((prev) => ({
        ...prev,
        sessionName: newSessionName,
      }));
      setUrlParams({ name: newSessionName });
    }, [activeSessionsCount, generateSessionName, formData.type, setUrlParams]);

    // Auto-select default image when images load or type/project changes
    useEffect(() => {
      // Only auto-select if no image is currently selected or if the current image is invalid
      if (!imagesByType || Object.keys(imagesByType).length === 0) return;

      const imagesForType = imagesByType[formData.type];
      if (!imagesForType) return;

      const imagesForProject = imagesForType[formData.project];
      if (!imagesForProject || imagesForProject.length === 0) return;

      // Check if current containerImage is valid for the current type/project
      const currentImageValid = imagesForProject.some(img => img.id === formData.containerImage);

      // If no image selected or current image is invalid, select the first available image
      if (!formData.containerImage || !currentImageValid) {
        const firstImage = imagesForProject[0];
        setFormData((prev) => ({
          ...prev,
          containerImage: firstImage.id,
        }));
        setUrlParams({ image: firstImage.id });
      }
    }, [imagesByType, formData.type, formData.project, formData.containerImage, setUrlParams]);

    // Update repositoryHost when repositoryHosts changes (API loads)
    useEffect(() => {
      const validHosts = repositoryHosts.filter(host => host && typeof host === 'string');
      if (validHosts.length > 0) {
        // Update if no host is set OR if current host is the fallback value
        // This ensures we use the API value instead of the fallback
        const isFallbackValue = formData.repositoryHost === 'images-rc.canfar.net';
        const needsUpdate = !formData.repositoryHost || isFallbackValue;

        if (needsUpdate && validHosts[0] !== formData.repositoryHost) {
          setFormData((prev) => ({
            ...prev,
            repositoryHost: validHosts[0],
          }));
        }
      }
    }, [repositoryHosts, formData.repositoryHost]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
      setUrlParams({ tab: newValue });
    };

    const handleFieldChange = useCallback(
      (field: keyof SessionFormData) =>
        (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const value = field === 'memory' || field === 'cores' || field === 'gpus'
            ? Number(event.target.value)
            : event.target.value;

          setFormData((prev) => ({
            ...prev,
            [field]: value,
          }));

          // Sync session name to URL
          if (field === 'sessionName') {
            setUrlParams({ name: value as string });
          }
        },
      [setUrlParams]
    );

    const handleSelectChange = useCallback(
      (field: keyof SessionFormData) => (event: SelectChangeEvent) => {
        const value = field === 'memory' || field === 'cores' || field === 'gpus'
          ? Number(event.target.value)
          : event.target.value;

        setFormData((prev) => {
          const newData = { ...prev, [field]: value };

          // Reset dependent fields when session type changes
          if (field === 'type' && typeof value === 'string') {
            newData.project = SKAHA_PROJECT; // Set to default project
            newData.containerImage = ''; // Will be auto-selected by useEffect
            // Automatically update session name based on the new type
            newData.sessionName = generateSessionName(value);
          }

          // Reset container image when project changes
          if (field === 'project') {
            newData.containerImage = '';
          }

          return newData;
        });

        // Update URL parameters
        if (field === 'type') {
          const newType = value as string;
          // If switching to firefly or desktop, clear resource params
          if (newType === FIREFLY_TYPE || newType === DESKTOP_TYPE) {
            setUrlParams({ type: newType, project: SKAHA_PROJECT, image: '', cores: null, memory: null, gpus: null });
            setResourceType('flexible'); // Reset to flexible
          } else {
            setUrlParams({ type: newType, project: SKAHA_PROJECT, image: '' });
          }
        } else if (field === 'project') {
          setUrlParams({ project: value as string, image: '' });
        } else if (field === 'containerImage') {
          setUrlParams({ image: value as string });
        } else if (field === 'memory') {
          setUrlParams({ memory: value as number });
        } else if (field === 'cores') {
          setUrlParams({ cores: value as number });
        } else if (field === 'gpus') {
          setUrlParams({ gpus: value as number });
        }

        // Notify parent component when session type changes
        if (field === 'type' && onSessionTypeChange && typeof value === 'string') {
          onSessionTypeChange(value);
        }
      },
      [onSessionTypeChange, generateSessionName, setUrlParams]
    );

    const handleSubmit = useCallback(
      async (event: React.FormEvent) => {
        event.preventDefault();
        if (onLaunch) {
          await onLaunch(formData);
        }
      },
      [formData, onLaunch]
    );

    const handleReset = useCallback(() => {
      setFormData({
        type: defaultValues.type || NOTEBOOK_TYPE,
        project: defaultValues.project || SKAHA_PROJECT,
        containerImage: '', // Will be auto-selected by useEffect
        sessionName: defaultValues.sessionName || 'notebook1',
        memory: defaultValues.memory || DEFAULT_RAM_NUMBER,
        cores: defaultValues.cores || DEFAULT_CORES_NUMBER,
        gpus: defaultValues.gpus ?? 0,
        // Advanced tab fields
        repositoryHost: repositoryHosts.find(host => host && typeof host === 'string') || 'images-rc.canfar.net',
        image: '',
        repositoryAuthUsername: '',
        repositoryAuthSecret: '',
      });
      setResourceType('flexible');
      setTabValue(0);

      // Reset URL parameters to defaults
      setUrlParams({
        tab: 0,
        type: defaultValues.type || NOTEBOOK_TYPE,
        project: defaultValues.project || SKAHA_PROJECT,
        image: '', // Will be auto-selected by useEffect
        name: defaultValues.sessionName || 'notebook1',
        cores: null, // Flexible = no cores/memory/gpus in URL
        memory: null,
        gpus: null,
      });

      if (onReset) {
        onReset();
      }
    }, [defaultValues, onReset, repositoryHosts, setUrlParams]);

    const handleResourceTypeChange = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const newResourceType = event.target.value as 'flexible' | 'fixed';
      setResourceType(newResourceType);

      // Update formData with new resource type
      setFormData((prev) => ({
        ...prev,
        resourceType: newResourceType,
      }));

      // If switching to Flexible, unset cores, memory, and gpus from URL
      if (newResourceType === 'flexible') {
        setUrlParams({ cores: null, memory: null, gpus: null });
      } else {
        // If switching to Fixed, set the current form values to URL
        setUrlParams({ cores: formData.cores, memory: formData.memory, gpus: formData.gpus ?? 0 });
      }
    };

    const handleRangeChange = useCallback(
      (field: 'memory' | 'cores' | 'gpus') => (value: number) => {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
        setUrlParams({ [field]: value });
      },
      [setUrlParams]
    );

    // Input change handlers with startsWithNumber validation
    const handleInputChange = useCallback(
      (field: 'memory' | 'cores' | 'gpus', availableOptions: number[]) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
          const maybeNumber = Number(event.target.value);
          const maxValue = availableOptions[availableOptions.length - 1];

          // Allow typing if value is positive, <= max, and starts with a valid option
          if (
            maybeNumber > 0 &&
            maybeNumber <= maxValue &&
            availableOptions.some((num) => startsWithNumber(maybeNumber, num))
          ) {
            setFormData((prev) => ({
              ...prev,
              [field]: maybeNumber,
            }));
          }
        },
      []
    );

    // Input blur handlers - validate exact match
    const handleInputBlur = useCallback(
      (field: 'memory' | 'cores' | 'gpus', availableOptions: number[], defaultValue: number) =>
        (event: React.FocusEvent<HTMLInputElement>) => {
          const maybeNumber = Number(event.target.value);
          const maxValue = availableOptions[availableOptions.length - 1];

          // If value doesn't exist exactly in available options, reset to default
          if (
            !(
              maybeNumber > 0 &&
              maybeNumber <= maxValue &&
              availableOptions.includes(maybeNumber)
            )
          ) {
            setFormData((prev) => ({
              ...prev,
              [field]: defaultValue,
            }));
          } else {
            // Update URL with valid value
            setUrlParams({ [field]: maybeNumber });
          }
        },
      [setUrlParams]
    );

    // Helper component for the help icon tooltip
    const HelpIcon = ({ title }: { title: string }) => (
      <Tooltip title={title} placement="top">
        <HelpOutlineIcon
          fontSize="small"
          sx={{
            ml: 0.5,
            color: theme.palette.primary.main,
            cursor: 'help',
            verticalAlign: 'middle',
          }}
        />
      </Tooltip>
    );

    return (
      <Card ref={ref} elevation={0}>
        <CardContent
          sx={{
            // Better mobile padding
            [theme.breakpoints.down('sm')]: {
              padding: theme.spacing(1.5),
              '&:last-child': {
                paddingBottom: theme.spacing(1.5),
              },
            },
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: theme.palette.divider }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="session launch tabs"
              variant="fullWidth"
              sx={{
                // Better mobile tab handling
                [theme.breakpoints.down('sm')]: {
                  minHeight: 40,
                  '& .MuiTab-root': {
                    minHeight: 40,
                    padding: theme.spacing(1, 1.5),
                    fontSize: theme.typography.body2.fontSize,
                  },
                },
                // Use scrollable tabs for very small screens if needed
                [theme.breakpoints.down('xs')]: {
                  variant: 'scrollable',
                  scrollButtons: 'auto',
                },
              }}
            >
              <Tab
                label="Standard"
                id="session-tab-0"
                aria-controls="session-tabpanel-0"
              />
              <Tab
                label="Advanced"
                id="session-tab-1"
                aria-controls="session-tabpanel-1"
              />
            </Tabs>
          </Box>

          {errorMessage && (
            <Alert severity="error" sx={{ mt: theme.spacing(2) }}>
              {errorMessage}
            </Alert>
          )}

          {isLoading ? (
            // Skeleton loading state
            <Box sx={{ pt: theme.spacing(3) }}>
              <Stack spacing={2.5}>
                {/* Type field skeleton */}
                <Grid container alignItems="center" spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Skeleton variant="text" width="60%" height={20} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                  </Grid>
                </Grid>

                {/* Project field skeleton */}
                <Grid container alignItems="center" spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Skeleton variant="text" width="60%" height={20} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                  </Grid>
                </Grid>

                {/* Container Image field skeleton */}
                <Grid container alignItems="center" spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Skeleton variant="text" width="80%" height={20} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                  </Grid>
                </Grid>

                {/* Session Name field skeleton */}
                <Grid container alignItems="center" spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Skeleton variant="text" width="70%" height={20} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                  </Grid>
                </Grid>

                {/* Resources field skeleton */}
                <Grid container alignItems="center" spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Skeleton variant="text" width="60%" height={20} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 1 }} />
                      <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 1 }} />
                    </Box>
                  </Grid>
                </Grid>

                {/* Buttons skeleton */}
                <Grid container spacing={2} sx={{ mt: theme.spacing(3) }}>
                  <Grid size={{ xs: 12, sm: 4 }} />
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Box sx={{ display: 'flex', gap: theme.spacing(2) }}>
                      <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                      <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                    </Box>
                  </Grid>
                </Grid>
              </Stack>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <TabPanel value={tabValue} index={0}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing(2.5),
                }}
              >
                {/* Type field */}
                <Grid container alignItems="center" spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormLabel
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      type
                      <HelpIcon title="Select the type of session to launch" />
                    </FormLabel>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Select
                      id="session-type"
                      value={formData.type}
                      onChange={
                        handleSelectChange('type') as React.ComponentProps<
                          typeof Select
                        >['onChange']
                      }
                      disabled={isLoading}
                      fullWidth
                      size="sm"
                    >
                      <MenuItem value="notebook">notebook</MenuItem>
                      <MenuItem value="desktop">desktop</MenuItem>
                      <MenuItem value="carta">carta</MenuItem>
                      <MenuItem value="contributed">contributed</MenuItem>
                      <MenuItem value="firefly">firefly</MenuItem>
                    </Select>
                  </Grid>
                </Grid>

                {/* Project field */}
                <Grid container alignItems="center" spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormLabel
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      project
                      <HelpIcon title="Select your project allocation" />
                    </FormLabel>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Select
                      id="session-project"
                      value={formData.project}
                      onChange={
                        handleSelectChange('project') as React.ComponentProps<
                          typeof Select
                        >['onChange']
                      }
                      disabled={isLoading || availableProjects.length === 0}
                      fullWidth
                      size="sm"
                    >
                      <MenuItem value="">
                        <em>Select project</em>
                      </MenuItem>
                      {availableProjects.map((project) => (
                        <MenuItem key={project} value={project}>
                          {project}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                </Grid>

                {/* Container Image field */}
                <Grid container alignItems="center" spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormLabel
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      container image
                      <HelpIcon title="Select the container image for your session" />
                    </FormLabel>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Select
                      id="session-image"
                      value={formData.containerImage}
                      onChange={
                        handleSelectChange(
                          'containerImage'
                        ) as React.ComponentProps<typeof Select>['onChange']
                      }
                      disabled={isLoading || !formData.project || availableImages.length === 0}
                      fullWidth
                      size="sm"
                    >
                      <MenuItem value="">
                        <em>Select image</em>
                      </MenuItem>
                      {availableImages.map((image) => (
                        <MenuItem key={image.id} value={image.id}>
                          {image.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                </Grid>

                {/* Session Name field */}
                <Grid container alignItems="center" spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormLabel
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      session name
                      <HelpIcon title="Enter a unique name for your session (max 15 characters)" />
                    </FormLabel>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      id="session-name"
                      value={formData.sessionName}
                      onChange={handleFieldChange('sessionName')}
                      disabled={isLoading}
                      inputProps={{ maxLength: 15 }}
                      placeholder="Enter session name"
                      fullWidth
                      size="sm"
                    />
                  </Grid>
                </Grid>

                {/* Resources field - only show for session types that support it */}
                {supportsResourceConfig && (
                  <Grid container alignItems="center" spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormLabel
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      >
                        resources
                      </FormLabel>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <FormControl component="fieldset">
                        <RadioGroup
                          row
                          value={resourceType}
                          onChange={handleResourceTypeChange}
                        >
                          <FormControlLabel
                            value="flexible"
                            control={<Radio size="small" />}
                            label="Flexible"
                            disabled={isLoading}
                            sx={{ mr: 1 }}
                          />
                          <HelpIcon title="Flexible resources allow dynamic allocation based on availability" />
                          <FormControlLabel
                            value="fixed"
                            control={<Radio size="small" />}
                            label="Fixed"
                            disabled={isLoading}
                            sx={{ ml: 2, mr: 1 }}
                          />
                          <HelpIcon title="Fixed resources guarantee specific CPU and memory allocation" />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                  </Grid>
                )}

                {/* Conditional Memory, CPU, and GPU fields when Fixed is selected and supported */}
                {supportsResourceConfig && resourceType === 'fixed' && (
                  <Grid container alignItems="flex-start" spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      {/* Empty grid for alignment */}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      {USE_EXPERIMENTAL_FEATURES ? (
                        <Grid container spacing={2}>
                          {/* Memory Column */}
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <FormLabel
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 400,
                                mb: 1,
                                display: 'block',
                              }}
                            >
                              Memory (GB)
                            </FormLabel>
                            <CanfarRange
                              value={formData.memory}
                              range={memoryOptions || DEFAULT_MEMORY_OPTIONS}
                              onChange={handleRangeChange('memory')}
                              disabled={isLoading}
                              label="Memory (GB)"
                            />
                            <TextField
                              type="number"
                              value={formData.memory}
                              onChange={handleInputChange('memory', memoryOptions || DEFAULT_MEMORY_OPTIONS)}
                              onBlur={handleInputBlur('memory', memoryOptions || DEFAULT_MEMORY_OPTIONS, DEFAULT_RAM_NUMBER)}
                              disabled={isLoading}
                              inputProps={{
                                min: 1,
                                max: (memoryOptions || DEFAULT_MEMORY_OPTIONS)[(memoryOptions || DEFAULT_MEMORY_OPTIONS).length - 1],
                              }}
                              fullWidth
                              size="sm"
                              sx={{ mt: 1 }}
                            />
                          </Grid>

                          {/* CPU Cores Column */}
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <FormLabel
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 400,
                                mb: 1,
                                display: 'block',
                              }}
                            >
                              CPU Cores
                            </FormLabel>
                            <CanfarRange
                              value={formData.cores}
                              range={coreOptions || DEFAULT_CORE_OPTIONS}
                              onChange={handleRangeChange('cores')}
                              disabled={isLoading}
                              label="CPU Cores"
                            />
                            <TextField
                              type="number"
                              value={formData.cores}
                              onChange={handleInputChange('cores', coreOptions || DEFAULT_CORE_OPTIONS)}
                              onBlur={handleInputBlur('cores', coreOptions || DEFAULT_CORE_OPTIONS, DEFAULT_CORES_NUMBER)}
                              disabled={isLoading}
                              inputProps={{
                                min: 1,
                                max: (coreOptions || DEFAULT_CORE_OPTIONS)[(coreOptions || DEFAULT_CORE_OPTIONS).length - 1],
                              }}
                              fullWidth
                              size="sm"
                              sx={{ mt: 1 }}
                            />
                          </Grid>

                          {/* GPU Column */}
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <FormLabel
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 400,
                                mb: 1,
                                display: 'block',
                              }}
                            >
                              GPU
                            </FormLabel>
                            <CanfarRange
                              value={formData.gpus || 0}
                              range={gpuOptions || [0]}
                              onChange={handleRangeChange('gpus')}
                              disabled={isLoading}
                              label="GPU"
                            />
                            <TextField
                              type="number"
                              value={formData.gpus || 0}
                              onChange={handleInputChange('gpus', gpuOptions || [0])}
                              onBlur={handleInputBlur('gpus', gpuOptions || [0], 0)}
                              disabled={isLoading}
                              inputProps={{
                                min: 0,
                                max: gpuOptions?.[gpuOptions.length - 1] || 0,
                              }}
                              fullWidth
                              size="sm"
                              sx={{ mt: 1 }}
                            />
                          </Grid>
                        </Grid>
                      ) : (
                        <Grid container spacing={2}>
                          {/* Memory Column */}
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <FormLabel
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 400,
                                mb: 1,
                                display: 'block',
                              }}
                            >
                              Memory (GB)
                            </FormLabel>
                            <Select
                              id="session-memory"
                              value={String(formData.memory)}
                              onChange={
                                handleSelectChange('memory') as React.ComponentProps<
                                  typeof Select
                                >['onChange']
                              }
                              disabled={isLoading}
                              fullWidth
                              size="sm"
                            >
                              {(memoryOptions || DEFAULT_MEMORY_OPTIONS).map(
                                (mem) => (
                                  <MenuItem key={mem} value={String(mem)}>
                                    {mem}
                                  </MenuItem>
                                )
                              )}
                            </Select>
                          </Grid>

                          {/* CPU Cores Column */}
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <FormLabel
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 400,
                                mb: 1,
                                display: 'block',
                              }}
                            >
                              CPU Cores
                            </FormLabel>
                            <Select
                              id="session-cores"
                              value={String(formData.cores)}
                              onChange={
                                handleSelectChange('cores') as React.ComponentProps<
                                  typeof Select
                                >['onChange']
                              }
                              disabled={isLoading}
                              fullWidth
                              size="sm"
                            >
                              {(coreOptions || DEFAULT_CORE_OPTIONS).map((core) => (
                                <MenuItem key={core} value={String(core)}>
                                  {core}
                                </MenuItem>
                              ))}
                            </Select>
                          </Grid>

                          {/* GPU Column */}
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <FormLabel
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 400,
                                mb: 1,
                                display: 'block',
                              }}
                            >
                              GPU
                            </FormLabel>
                            <Select
                              id="session-gpus"
                              value={String(formData.gpus || 0)}
                              onChange={
                                handleSelectChange('gpus') as React.ComponentProps<
                                  typeof Select
                                >['onChange']
                              }
                              disabled={isLoading}
                              fullWidth
                              size="sm"
                            >
                              {/* Always show "None" option first */}
                              <MenuItem value="0">None</MenuItem>
                              {/* Then show other GPU options if available */}
                              {gpuOptions?.filter(gpu => gpu > 0).map((gpu) => (
                                <MenuItem key={gpu} value={String(gpu)}>
                                  {gpu}
                                </MenuItem>
                              ))}
                            </Select>
                          </Grid>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                )}
              </Box>

              {/* Buttons */}
              <Grid container spacing={2} sx={{ mt: theme.spacing(3) }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  {/* Empty grid for alignment */}
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Box sx={{ display: 'flex', gap: theme.spacing(2) }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="small"
                      disabled={isLoading || !formData.project || !formData.containerImage}
                    >
                      Launch
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
                      onClick={handleReset}
                      disabled={isLoading}
                    >
                      Reset
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box>
                {/* Image access section */}
                <Box sx={{ mb: theme.spacing(4) }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 500,
                      mb: theme.spacing(1),
                      ml: theme.spacing(2),
                    }}
                  >
                    Image access
                  </Typography>
                  <Divider sx={{ mb: theme.spacing(3) }} />
                  <Box sx={{ px: theme.spacing(2) }}>
                    {/* Container image field */}
                    <Grid
                      container
                      alignItems="center"
                      spacing={2}
                      sx={{ mb: 2 }}
                    >
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormLabel
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          container image
                          <HelpIcon title="Specify a custom container image path" />
                        </FormLabel>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Select
                          id="repository-host"
                          value={formData.repositoryHost || repositoryHosts.find(h => h && typeof h === 'string') || 'images-rc.canfar.net'}
                          onChange={
                            handleSelectChange(
                              'repositoryHost'
                            ) as React.ComponentProps<typeof Select>['onChange']
                          }
                          disabled={isLoading}
                          fullWidth
                          size="sm"
                        >
                          {repositoryHosts.filter(host => host && typeof host === 'string').length > 0 ? (
                            repositoryHosts
                              .filter(host => host && typeof host === 'string')
                              .map((host) => (
                                <MenuItem key={host} value={host}>
                                  {host}
                                </MenuItem>
                              ))
                          ) : (
                            <MenuItem value="images-rc.canfar.net">
                              images-rc.canfar.net
                            </MenuItem>
                          )}
                        </Select>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 5 }}>
                        <TextField
                          id="image"
                          value={formData.image}
                          onChange={handleFieldChange('image')}
                          disabled={isLoading}
                          fullWidth
                          size="sm"
                          placeholder="project/example-image:1.0.0"
                        />
                      </Grid>
                    </Grid>

                    {/* Repository username field */}
                    <Grid
                      container
                      alignItems="center"
                      spacing={2}
                      sx={{ mb: 2 }}
                    >
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormLabel
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          repository username
                          <HelpIcon title="Username for private repository access" />
                        </FormLabel>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                          id="repository-username"
                          value={formData.repositoryAuthUsername}
                          onChange={handleFieldChange('repositoryAuthUsername')}
                          disabled={isLoading}
                          fullWidth
                          size="sm"
                          placeholder="Repository username"
                          autoComplete="username"
                        />
                      </Grid>
                    </Grid>

                    {/* Repository secret field */}
                    <Grid container alignItems="center" spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormLabel
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          repository secret
                          <HelpIcon title="Password or token for private repository" />
                        </FormLabel>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                          id="repository-secret"
                          type="password"
                          value={formData.repositoryAuthSecret}
                          onChange={handleFieldChange('repositoryAuthSecret')}
                          disabled={isLoading}
                          fullWidth
                          size="sm"
                          placeholder="Repository secret"
                          autoComplete="current-password"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Box>

                {/* Launch session section */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 500,
                      mb: theme.spacing(1),
                      ml: theme.spacing(2),
                    }}
                  >
                    Launch session
                  </Typography>
                  <Divider sx={{ mb: theme.spacing(3) }} />
                  <Box sx={{ px: theme.spacing(2) }}>
                    {/* Type field */}
                    <Grid
                      container
                      alignItems="center"
                      spacing={2}
                      sx={{ mb: 2 }}
                    >
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormLabel
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          type
                          <HelpIcon title="Select the type of session to launch" />
                        </FormLabel>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <Select
                          id="advanced-session-type"
                          value={formData.type}
                          onChange={
                            handleSelectChange('type') as React.ComponentProps<
                              typeof Select
                            >['onChange']
                          }
                          disabled={isLoading}
                          fullWidth
                          size="sm"
                        >
                          <MenuItem value="notebook">notebook</MenuItem>
                          <MenuItem value="desktop">desktop</MenuItem>
                          <MenuItem value="carta">carta</MenuItem>
                          <MenuItem value="contributed">contributed</MenuItem>
                          <MenuItem value="firefly">firefly</MenuItem>
                        </Select>
                      </Grid>
                    </Grid>

                    {/* Session name field */}
                    <Grid
                      container
                      alignItems="center"
                      spacing={2}
                      sx={{ mb: 2 }}
                    >
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormLabel
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          session name
                          <HelpIcon title="Choose a unique name for your session (max 15 characters)" />
                        </FormLabel>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                          id="advanced-session-name"
                          value={formData.sessionName}
                          onChange={handleFieldChange('sessionName')}
                          disabled={isLoading}
                          fullWidth
                          size="sm"
                          inputProps={{ maxLength: 15 }}
                          placeholder="Enter session name"
                        />
                      </Grid>
                    </Grid>

                    {/* Resources field - only show for session types that support it */}
                    {supportsResourceConfig && (
                      <>
                        <Grid
                          container
                          alignItems="center"
                          spacing={2}
                          sx={{ mb: 2 }}
                        >
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <FormLabel
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: 500,
                              }}
                            >
                              resources
                            </FormLabel>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 8 }}>
                            <FormControl component="fieldset">
                              <RadioGroup
                                row
                                value={resourceType}
                                onChange={handleResourceTypeChange}
                              >
                                <FormControlLabel
                                  value="flexible"
                                  control={<Radio size="small" />}
                                  label="Flexible"
                                  disabled={isLoading}
                                  sx={{ mr: 1 }}
                                />
                                <HelpIcon title="Flexible resources allow dynamic allocation based on availability" />
                                <FormControlLabel
                                  value="fixed"
                                  control={<Radio size="small" />}
                                  label="Fixed"
                                  disabled={isLoading}
                                  sx={{ ml: 2, mr: 1 }}
                                />
                                <HelpIcon title="Fixed resources guarantee specific CPU and memory allocation" />
                              </RadioGroup>
                            </FormControl>
                          </Grid>
                        </Grid>

                        {/* Conditional Memory, CPU, and GPU fields when Fixed is selected */}
                        {resourceType === 'fixed' && (
                          <Grid container alignItems="flex-start" spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              {/* Empty grid for alignment */}
                            </Grid>
                            <Grid size={{ xs: 12, sm: 8 }}>
                              {USE_EXPERIMENTAL_FEATURES ? (
                                <Grid container spacing={2}>
                                  {/* Memory Column */}
                                  <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormLabel
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                        mb: 1,
                                        display: 'block',
                                      }}
                                    >
                                      Memory (GB)
                                    </FormLabel>
                                    <CanfarRange
                                      value={formData.memory}
                                      range={memoryOptions || DEFAULT_MEMORY_OPTIONS}
                                      onChange={handleRangeChange('memory')}
                                      disabled={isLoading}
                                      label="Memory (GB)"
                                    />
                                    <TextField
                                      type="number"
                                      value={formData.memory}
                                      onChange={handleInputChange('memory', memoryOptions || DEFAULT_MEMORY_OPTIONS)}
                                      onBlur={handleInputBlur('memory', memoryOptions || DEFAULT_MEMORY_OPTIONS, DEFAULT_RAM_NUMBER)}
                                      disabled={isLoading}
                                      inputProps={{
                                        min: 1,
                                        max: (memoryOptions || DEFAULT_MEMORY_OPTIONS)[(memoryOptions || DEFAULT_MEMORY_OPTIONS).length - 1],
                                      }}
                                      fullWidth
                                      size="sm"
                                      sx={{ mt: 1 }}
                                    />
                                  </Grid>

                                  {/* CPU Cores Column */}
                                  <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormLabel
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                        mb: 1,
                                        display: 'block',
                                      }}
                                    >
                                      CPU Cores
                                    </FormLabel>
                                    <CanfarRange
                                      value={formData.cores}
                                      range={coreOptions || DEFAULT_CORE_OPTIONS}
                                      onChange={handleRangeChange('cores')}
                                      disabled={isLoading}
                                      label="CPU Cores"
                                    />
                                    <TextField
                                      type="number"
                                      value={formData.cores}
                                      onChange={handleInputChange('cores', coreOptions || DEFAULT_CORE_OPTIONS)}
                                      onBlur={handleInputBlur('cores', coreOptions || DEFAULT_CORE_OPTIONS, DEFAULT_CORES_NUMBER)}
                                      disabled={isLoading}
                                      inputProps={{
                                        min: 1,
                                        max: (coreOptions || DEFAULT_CORE_OPTIONS)[(coreOptions || DEFAULT_CORE_OPTIONS).length - 1],
                                      }}
                                      fullWidth
                                      size="sm"
                                      sx={{ mt: 1 }}
                                    />
                                  </Grid>

                                  {/* GPU Column */}
                                  <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormLabel
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                        mb: 1,
                                        display: 'block',
                                      }}
                                    >
                                      GPU
                                    </FormLabel>
                                    <CanfarRange
                                      value={formData.gpus || 0}
                                      range={gpuOptions || [0]}
                                      onChange={handleRangeChange('gpus')}
                                      disabled={isLoading}
                                      label="GPU"
                                    />
                                    <TextField
                                      type="number"
                                      value={formData.gpus || 0}
                                      onChange={handleInputChange('gpus', gpuOptions || [0])}
                                      onBlur={handleInputBlur('gpus', gpuOptions || [0], 0)}
                                      disabled={isLoading}
                                      inputProps={{
                                        min: 0,
                                        max: gpuOptions?.[gpuOptions.length - 1] || 0,
                                      }}
                                      fullWidth
                                      size="sm"
                                      sx={{ mt: 1 }}
                                    />
                                  </Grid>
                                </Grid>
                              ) : (
                                <Grid container spacing={2}>
                                  {/* Memory Column */}
                                  <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormLabel
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                        mb: 1,
                                        display: 'block',
                                      }}
                                    >
                                      Memory (GB)
                                    </FormLabel>
                                    <Select
                                      id="advanced-session-memory"
                                      value={String(formData.memory)}
                                      onChange={
                                        handleSelectChange('memory') as React.ComponentProps<
                                          typeof Select
                                        >['onChange']
                                      }
                                      disabled={isLoading}
                                      fullWidth
                                      size="sm"
                                    >
                                      {(memoryOptions || DEFAULT_MEMORY_OPTIONS).map(
                                        (mem) => (
                                          <MenuItem key={mem} value={String(mem)}>
                                            {mem}
                                          </MenuItem>
                                        )
                                      )}
                                    </Select>
                                  </Grid>

                                  {/* CPU Cores Column */}
                                  <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormLabel
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                        mb: 1,
                                        display: 'block',
                                      }}
                                    >
                                      CPU Cores
                                    </FormLabel>
                                    <Select
                                      id="advanced-session-cores"
                                      value={String(formData.cores)}
                                      onChange={
                                        handleSelectChange('cores') as React.ComponentProps<
                                          typeof Select
                                        >['onChange']
                                      }
                                      disabled={isLoading}
                                      fullWidth
                                      size="sm"
                                    >
                                      {(coreOptions || DEFAULT_CORE_OPTIONS).map((core) => (
                                        <MenuItem key={core} value={String(core)}>
                                          {core}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </Grid>

                                  {/* GPU Column */}
                                  <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormLabel
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                        mb: 1,
                                        display: 'block',
                                      }}
                                    >
                                      GPU
                                    </FormLabel>
                                    <Select
                                      id="advanced-session-gpus"
                                      value={String(formData.gpus || 0)}
                                      onChange={
                                        handleSelectChange('gpus') as React.ComponentProps<
                                          typeof Select
                                        >['onChange']
                                      }
                                      disabled={isLoading}
                                      fullWidth
                                      size="sm"
                                    >
                                      {/* Always show "None" option first */}
                                      <MenuItem value="0">None</MenuItem>
                                      {/* Then show other GPU options if available */}
                                      {gpuOptions?.filter(gpu => gpu > 0).map((gpu) => (
                                        <MenuItem key={gpu} value={String(gpu)}>
                                          {gpu}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </Grid>
                                </Grid>
                              )}
                            </Grid>
                          </Grid>
                        )}
                      </>
                    )}
                  </Box>
                </Box>

                {/* Buttons */}
                <Grid container spacing={2} sx={{ mt: theme.spacing(3) }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    {/* Empty grid for alignment */}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Box sx={{ display: 'flex', gap: theme.spacing(2) }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="small"
                        disabled={isLoading}
                      >
                        Launch
                      </Button>
                      <Button
                        type="button"
                        variant="outlined"
                        size="small"
                        onClick={handleReset}
                        disabled={isLoading}
                      >
                        Reset
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>
          </form>
          )}
        </CardContent>
      </Card>
    );
  }
);

SessionLaunchFormImpl.displayName = 'SessionLaunchFormImpl';
