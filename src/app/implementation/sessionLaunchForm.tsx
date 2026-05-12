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
import { ResourceField } from '@/app/components/ResourceField/ResourceField';
import {
  SessionLaunchFormProps,
  SessionFormData,
  SessionType,
} from '@/app/types/SessionLaunchFormProps';
import {
  getProjectNames,
  filterImagesByProjectForRegistry,
  type ImagesByProject,
} from '@/lib/utils/image-parser';
import {
  DEFAULT_CORES_NUMBER,
  DEFAULT_RAM_NUMBER,
  DEFAULT_MEMORY_OPTIONS,
  DEFAULT_CORE_OPTIONS,
  DEFAULT_IMAGE_NAMES,
  supportsCustomResources,
  DESKTOP_TYPE,
  FIREFLY_TYPE,
  NOTEBOOK_TYPE,
  SKAHA_PROJECT,
  MAX_INTERACTIVE_SESSIONS,
} from '@/lib/config/constants';

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

export const SessionLaunchFormImpl = React.forwardRef<HTMLDivElement, SessionLaunchFormProps>(
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
    ref,
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
      },
    );

    // Initialize tab from URL parameter
    const [tabValue, setTabValue] = useState(urlParams.tab);

    // Initialize resource type based on presence of cores/memory/gpus in URL
    const initialResourceType =
      urlParams.cores !== null || urlParams.memory !== null || urlParams.gpus !== null
        ? 'fixed'
        : 'flexible';
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
      repositoryHost: (() => {
        const rh = repositoryHosts.filter((host) => host && typeof host === 'string');
        // Always default to the first available registry so dependent fields
        // (project, image) can populate immediately.
        return rh[0] || 'images-rc.canfar.net';
      })(),
      image: '',
      repositoryAuthUsername: '',
      repositoryAuthSecret: '',
    });

    const validHosts = useMemo(
      () => repositoryHosts.filter((h): h is string => typeof h === 'string' && h.length > 0),
      [repositoryHosts],
    );

    const hasMultipleRegistries = validHosts.length > 1;

    const effectiveRegistry = useMemo(() => {
      if (validHosts.length === 0) {
        return undefined;
      }
      const selected = formData.repositoryHost;
      if (selected && validHosts.includes(selected)) {
        return selected;
      }
      // Fall back to the first available registry so dependent fields stay populated
      // even before the user explicitly picks one.
      return validHosts[0];
    }, [validHosts, formData.repositoryHost]);

    const imagesByTypeForRegistry = useMemo(() => {
      const imagesForType = imagesByType[formData.type];
      if (!imagesForType || !effectiveRegistry) {
        return {} as ImagesByProject;
      }
      return filterImagesByProjectForRegistry(imagesForType, effectiveRegistry);
    }, [imagesByType, formData.type, effectiveRegistry]);

    const availableProjects = useMemo(
      () => getProjectNames(imagesByTypeForRegistry),
      [imagesByTypeForRegistry],
    );

    const availableImages = useMemo(() => {
      if (!formData.project || !effectiveRegistry) {
        return [];
      }
      return imagesByTypeForRegistry[formData.project] || [];
    }, [imagesByTypeForRegistry, formData.project, effectiveRegistry]);

    // Check if the selected session type supports resource configuration
    // firefly and desktop don't support custom resource allocation
    const supportsResourceConfig = useMemo(() => {
      return supportsCustomResources(formData.type);
    }, [formData.type]);

    // Count only interactive sessions — headless are batch jobs with their own quota.
    // Used both for the naming counter (notebook1, notebook2…) and the launch cap.
    const activeSessionsCount = useMemo(
      () => activeSessions.filter((s) => s.sessionType !== 'headless').length,
      [activeSessions],
    );
    const isAtSessionLimit = activeSessionsCount >= MAX_INTERACTIVE_SESSIONS;

    // Generate the next available session name based on active sessions
    const generateSessionName = useCallback(
      (sessionType: string): string => {
        // Count all active sessions (regardless of type) to determine the next counter
        // The counter starts at activeSessionsCount + 1
        const counter = activeSessionsCount + 1;

        return `${sessionType}${counter}`;
      },
      [activeSessionsCount],
    );

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

    // Keep project in sync with selected registry / session type (must exist in filtered map)
    useEffect(() => {
      if (!effectiveRegistry) {
        return;
      }
      const names = getProjectNames(imagesByTypeForRegistry);
      if (names.length === 0) {
        return;
      }
      if (!formData.project || !names.includes(formData.project)) {
        const next = names.includes(SKAHA_PROJECT) ? SKAHA_PROJECT : names[0];
        setFormData((prev) => ({
          ...prev,
          project: next,
          containerImage: '',
        }));
        setUrlParams({ project: next, image: '' });
      }
    }, [effectiveRegistry, imagesByTypeForRegistry, formData.project, formData.type, setUrlParams]);

    // Auto-select an image for the current project within the effective registry.
    // Prefer the per-session-type default (DEFAULT_IMAGE_NAMES, mirrors legacy
    // science-portal/src/react/utilities/constants.js) when an image with that
    // exact `name` is present; otherwise fall back to a tag-agnostic match on
    // `imageName`; otherwise the first available image.
    useEffect(() => {
      if (!effectiveRegistry || availableImages.length === 0) {
        return;
      }
      const currentValid = availableImages.some((img) => img.id === formData.containerImage);
      if (!formData.containerImage || !currentValid) {
        const desired =
          DEFAULT_IMAGE_NAMES[formData.type as keyof typeof DEFAULT_IMAGE_NAMES];
        const desiredBase = desired?.split(':')[0];
        const exactMatch = desired
          ? availableImages.find((img) => img.name === desired)
          : undefined;
        const baseMatch =
          !exactMatch && desiredBase
            ? availableImages.find((img) => img.imageName === desiredBase)
            : undefined;
        const picked = exactMatch ?? baseMatch ?? availableImages[0];
        setFormData((prev) => ({
          ...prev,
          containerImage: picked.id,
        }));
        setUrlParams({ image: picked.id });
      }
    }, [
      effectiveRegistry,
      availableImages,
      formData.containerImage,
      formData.project,
      formData.type,
      setUrlParams,
    ]);

    // Always mirror a valid host: single registry pins to it, multiple registries
    // fall back to the first available when the current selection is missing/invalid.
    useEffect(() => {
      if (validHosts.length === 0) {
        return;
      }
      const current = formData.repositoryHost;
      if (current && validHosts.includes(current)) {
        return;
      }
      setFormData((prev) => ({ ...prev, repositoryHost: validHosts[0] }));
    }, [validHosts, formData.repositoryHost]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
      setUrlParams({ tab: newValue });
    };

    const handleFieldChange = useCallback(
      (field: keyof SessionFormData) =>
        (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const value =
            field === 'memory' || field === 'cores' || field === 'gpus'
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
      [setUrlParams],
    );

    const handleSelectChange = useCallback(
      (field: keyof SessionFormData) => (event: SelectChangeEvent) => {
        const value =
          field === 'memory' || field === 'cores' || field === 'gpus'
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

          if (field === 'repositoryHost') {
            newData.project = '';
            newData.containerImage = '';
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
            setUrlParams({
              type: newType,
              project: SKAHA_PROJECT,
              image: '',
              cores: null,
              memory: null,
              gpus: null,
            });
            setResourceType('flexible'); // Reset to flexible
          } else {
            setUrlParams({ type: newType, project: SKAHA_PROJECT, image: '' });
          }
        } else if (field === 'repositoryHost') {
          setUrlParams({ project: '', image: '' });
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
      [onSessionTypeChange, generateSessionName, setUrlParams],
    );

    const handleSubmit = useCallback(
      async (event: React.FormEvent) => {
        event.preventDefault();
        if (onLaunch) {
          await onLaunch(formData);
        }
      },
      [formData, onLaunch],
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
        repositoryHost: (() => {
          const rh = repositoryHosts.filter((host) => host && typeof host === 'string');
          if (rh.length === 1) {
            return rh[0];
          }
          if (rh.length > 1) {
            return '';
          }
          return rh[0] || 'images-rc.canfar.net';
        })(),
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

    const handleResourceTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // One handler per resource field. Stable refs across renders so a memoized
    // ResourceField bails out when the *other* fields change.
    const handleMemoryChange = useCallback(
      (value: number) => {
        setFormData((prev) => ({ ...prev, memory: value }));
        setUrlParams({ memory: value });
      },
      [setUrlParams],
    );
    const handleCoresChange = useCallback(
      (value: number) => {
        setFormData((prev) => ({ ...prev, cores: value }));
        setUrlParams({ cores: value });
      },
      [setUrlParams],
    );
    const handleGpusChange = useCallback(
      (value: number) => {
        setFormData((prev) => ({ ...prev, gpus: value }));
        setUrlParams({ gpus: value });
      },
      [setUrlParams],
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
              <Tab label="Standard" id="session-tab-0" aria-controls="session-tabpanel-0" />
              <Tab label="Advanced" id="session-tab-1" aria-controls="session-tabpanel-1" />
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
                <Grid container alignItems="center" spacing={1}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Skeleton variant="text" width="60%" height={20} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={40}
                      sx={{ borderRadius: 1 }}
                    />
                  </Grid>
                </Grid>

                {/* Image registry field skeleton */}
                <Grid container alignItems="center" spacing={1}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Skeleton variant="text" width="55%" height={20} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={40}
                      sx={{ borderRadius: 1 }}
                    />
                  </Grid>
                </Grid>

                {/* Project field skeleton */}
                <Grid container alignItems="center" spacing={1}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Skeleton variant="text" width="60%" height={20} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={40}
                      sx={{ borderRadius: 1 }}
                    />
                  </Grid>
                </Grid>

                {/* Container Image field skeleton */}
                <Grid container alignItems="center" spacing={1}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Skeleton variant="text" width="80%" height={20} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={40}
                      sx={{ borderRadius: 1 }}
                    />
                  </Grid>
                </Grid>

                {/* Session Name field skeleton */}
                <Grid container alignItems="center" spacing={1}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Skeleton variant="text" width="70%" height={20} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={40}
                      sx={{ borderRadius: 1 }}
                    />
                  </Grid>
                </Grid>

                {/* Resources field skeleton */}
                <Grid container alignItems="center" spacing={1}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Skeleton variant="text" width="60%" height={20} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Skeleton
                        variant="rectangular"
                        width={120}
                        height={32}
                        sx={{ borderRadius: 1 }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width={120}
                        height={32}
                        sx={{ borderRadius: 1 }}
                      />
                    </Box>
                  </Grid>
                </Grid>

                {/* Buttons skeleton */}
                <Grid container spacing={2} sx={{ mt: theme.spacing(3) }}>
                  <Grid size={{ xs: 12, sm: 4 }} />
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Box sx={{ display: 'flex', gap: theme.spacing(2) }}>
                      <Skeleton
                        variant="rectangular"
                        width={80}
                        height={32}
                        sx={{ borderRadius: 1 }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width={80}
                        height={32}
                        sx={{ borderRadius: 1 }}
                      />
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
                  <Grid container alignItems="center" spacing={1}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormLabel
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
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

                  {/* Image registry field */}
                  <Grid container alignItems="center" spacing={1}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormLabel
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        image registry
                        <HelpIcon title="Select the image registry containing your container images." />
                      </FormLabel>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      {hasMultipleRegistries ? (
                        <Select
                          id="session-registry"
                          value={formData.repositoryHost ?? ''}
                          onChange={
                            handleSelectChange('repositoryHost') as React.ComponentProps<
                              typeof Select
                            >['onChange']
                          }
                          disabled={isLoading}
                          fullWidth
                          size="sm"
                        >
                          {validHosts.map((host) => (
                            <MenuItem key={host} value={host}>
                              {host}
                            </MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <TextField
                          id="session-registry-readonly"
                          value={validHosts[0] ?? formData.repositoryHost ?? ''}
                          disabled
                          fullWidth
                          size="sm"
                        />
                      )}
                    </Grid>
                  </Grid>

                  {/* Project field */}
                  <Grid container alignItems="center" spacing={1}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormLabel
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
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
                        disabled={
                          isLoading ||
                          availableProjects.length === 0 ||
                          (hasMultipleRegistries && !effectiveRegistry)
                        }
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
                  <Grid container alignItems="center" spacing={1}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormLabel
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
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
                          handleSelectChange('containerImage') as React.ComponentProps<
                            typeof Select
                          >['onChange']
                        }
                        disabled={
                          isLoading ||
                          !formData.project ||
                          availableImages.length === 0 ||
                          (hasMultipleRegistries && !effectiveRegistry)
                        }
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
                  <Grid container alignItems="center" spacing={1}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormLabel
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
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
                    <Grid container alignItems="center" spacing={1}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormLabel>resources</FormLabel>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <FormControl component="fieldset">
                          <RadioGroup row value={resourceType} onChange={handleResourceTypeChange}>
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
                      <Grid size={{ xs: 12, sm: 4 }}>{/* Empty grid for alignment */}</Grid>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <ResourceField
                              label="Memory (GB)"
                              value={formData.memory}
                              min={(memoryOptions || DEFAULT_MEMORY_OPTIONS)[0] ?? 1}
                              max={
                                (memoryOptions || DEFAULT_MEMORY_OPTIONS)[
                                  (memoryOptions || DEFAULT_MEMORY_OPTIONS).length - 1
                                ]
                              }
                              onChange={handleMemoryChange}
                              disabled={isLoading}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <ResourceField
                              label="CPU Cores"
                              value={formData.cores}
                              min={(coreOptions || DEFAULT_CORE_OPTIONS)[0] ?? 1}
                              max={
                                (coreOptions || DEFAULT_CORE_OPTIONS)[
                                  (coreOptions || DEFAULT_CORE_OPTIONS).length - 1
                                ]
                              }
                              onChange={handleCoresChange}
                              disabled={isLoading}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <ResourceField
                              label="GPU"
                              value={formData.gpus || 0}
                              min={0}
                              max={(gpuOptions || [0])[(gpuOptions || [0]).length - 1] ?? 0}
                              onChange={handleGpusChange}
                              disabled={isLoading}
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  )}
                </Box>

                {/* Buttons */}
                <Grid container spacing={2} sx={{ mt: theme.spacing(3) }}>
                  <Grid size={{ xs: 12, sm: 4 }}>{/* Empty grid for alignment */}</Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Box sx={{ display: 'flex', gap: theme.spacing(2) }}>
                      <Tooltip
                        title={
                          isAtSessionLimit
                            ? `You already have ${MAX_INTERACTIVE_SESSIONS} active interactive sessions. Delete one before launching another.`
                            : ''
                        }
                      >
                        <span>
                          <Button
                            type="submit"
                            variant="contained"
                            size="small"
                            disabled={
                              isLoading ||
                              !formData.project ||
                              !formData.containerImage ||
                              isAtSessionLimit
                            }
                          >
                            Launch
                          </Button>
                        </span>
                      </Tooltip>
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
                      <Grid container alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <FormLabel
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            container image
                            <HelpIcon title="Specify a custom container image path" />
                          </FormLabel>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Select
                            id="repository-host"
                            value={
                              formData.repositoryHost ||
                              repositoryHosts.find((h) => h && typeof h === 'string') ||
                              'images-rc.canfar.net'
                            }
                            onChange={
                              handleSelectChange('repositoryHost') as React.ComponentProps<
                                typeof Select
                              >['onChange']
                            }
                            disabled={isLoading}
                            fullWidth
                            size="sm"
                          >
                            {repositoryHosts.filter((host) => host && typeof host === 'string')
                              .length > 0 ? (
                              repositoryHosts
                                .filter((host) => host && typeof host === 'string')
                                .map((host) => (
                                  <MenuItem key={host} value={host}>
                                    {host}
                                  </MenuItem>
                                ))
                            ) : (
                              <MenuItem value="images-rc.canfar.net">images-rc.canfar.net</MenuItem>
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
                      <Grid container alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <FormLabel
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
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
                      <Grid container alignItems="center" spacing={1}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <FormLabel
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
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
                      <Grid container alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <FormLabel
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
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
                      <Grid container alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <FormLabel
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
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
                          <Grid container alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <FormLabel>resources</FormLabel>
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
                              <Grid size={{ xs: 12, sm: 4 }}>{/* Empty grid for alignment */}</Grid>
                              <Grid size={{ xs: 12, sm: 8 }}>
                                <Grid container spacing={2}>
                                  <Grid size={{ xs: 12, sm: 4 }}>
                                    <ResourceField
                                      label="Memory (GB)"
                                      value={formData.memory}
                                      min={(memoryOptions || DEFAULT_MEMORY_OPTIONS)[0] ?? 1}
                                      max={
                                        (memoryOptions || DEFAULT_MEMORY_OPTIONS)[
                                          (memoryOptions || DEFAULT_MEMORY_OPTIONS).length - 1
                                        ]
                                      }
                                      onChange={handleMemoryChange}
                                      disabled={isLoading}
                                    />
                                  </Grid>
                                  <Grid size={{ xs: 12, sm: 4 }}>
                                    <ResourceField
                                      label="CPU Cores"
                                      value={formData.cores}
                                      min={(coreOptions || DEFAULT_CORE_OPTIONS)[0] ?? 1}
                                      max={
                                        (coreOptions || DEFAULT_CORE_OPTIONS)[
                                          (coreOptions || DEFAULT_CORE_OPTIONS).length - 1
                                        ]
                                      }
                                      onChange={handleCoresChange}
                                      disabled={isLoading}
                                    />
                                  </Grid>
                                  <Grid size={{ xs: 12, sm: 4 }}>
                                    <ResourceField
                                      label="GPU"
                                      value={formData.gpus || 0}
                                      min={0}
                                      max={(gpuOptions || [0])[(gpuOptions || [0]).length - 1] ?? 0}
                                      onChange={handleGpusChange}
                                      disabled={isLoading}
                                    />
                                  </Grid>
                                </Grid>
                              </Grid>
                            </Grid>
                          )}
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Buttons */}
                  <Grid container spacing={2} sx={{ mt: theme.spacing(3) }}>
                    <Grid size={{ xs: 12, sm: 4 }}>{/* Empty grid for alignment */}</Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <Box sx={{ display: 'flex', gap: theme.spacing(2) }}>
                        <Tooltip
                          title={
                            isAtSessionLimit
                              ? `You already have ${MAX_INTERACTIVE_SESSIONS} active interactive sessions. Delete one before launching another.`
                              : ''
                          }
                        >
                          <span>
                            <Button
                              type="submit"
                              variant="contained"
                              size="small"
                              disabled={isLoading || isAtSessionLimit}
                            >
                              Launch
                            </Button>
                          </span>
                        </Tooltip>
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
  },
);

SessionLaunchFormImpl.displayName = 'SessionLaunchFormImpl';
