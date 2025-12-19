/**
 * URL State Management with nuqs
 *
 * Provides utility hooks for managing state in URL query parameters.
 * This replaces React.useState for state that should be synchronized with the URL.
 *
 * Benefits:
 * - Shareable URLs with state
 * - Browser back/forward navigation works
 * - State persists on page refresh
 * - Deep linking support
 */

import {
  useQueryState,
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsBoolean,
  parseAsArrayOf,
  parseAsStringEnum,
  type ParserBuilder,
} from 'nuqs';
import type { SessionType } from '@/lib/api/skaha';

/**
 * Session type parser for URL state
 */
const parseAsSessionType = parseAsStringEnum<SessionType>([
  'notebook',
  'desktop',
  'headless',
  'carta',
]);

/**
 * Sort order parser
 */
const parseAsSortOrder = parseAsStringEnum(['asc', 'desc']);

/**
 * Use search query in URL
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useSearchQuery();
 *
 * <input
 *   value={search ?? ''}
 *   onChange={(e) => setSearch(e.target.value || null)}
 * />
 * ```
 */
export function useSearchQuery() {
  return useQueryState('search', parseAsString.withDefault(''));
}

/**
 * Use pagination state in URL
 *
 * @example
 * ```tsx
 * const [page, setPage] = usePage();
 * const [pageSize, setPageSize] = usePageSize();
 *
 * <Pagination page={page} pageSize={pageSize} onPageChange={setPage} />
 * ```
 */
export function usePage() {
  return useQueryState('page', parseAsInteger.withDefault(1));
}

export function usePageSize() {
  return useQueryState('pageSize', parseAsInteger.withDefault(10));
}

/**
 * Combined pagination hook
 *
 * @example
 * ```tsx
 * const { page, pageSize, setPage, setPageSize } = usePagination();
 * ```
 */
export function usePagination() {
  const [pagination, setPagination] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(10),
  });

  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    setPage: (page: number) => setPagination({ page }),
    setPageSize: (pageSize: number) => setPagination({ pageSize, page: 1 }), // Reset to page 1
  };
}

/**
 * Use sorting state in URL
 *
 * @example
 * ```tsx
 * const { sortBy, sortOrder, setSorting } = useSorting();
 *
 * setSorting({ sortBy: 'name', sortOrder: 'asc' });
 * ```
 */
export function useSorting() {
  const [sorting, setSorting] = useQueryStates({
    sortBy: parseAsString.withDefault('createdAt'),
    sortOrder: parseAsSortOrder.withDefault('desc'),
  });

  return {
    sortBy: sorting.sortBy,
    sortOrder: sorting.sortOrder,
    setSorting,
  };
}

/**
 * Use filters in URL
 *
 * @example
 * ```tsx
 * const { sessionTypes, status, setFilters } = useSessionFilters();
 *
 * setFilters({
 *   sessionTypes: ['notebook', 'desktop'],
 *   status: true, // Show only running
 * });
 * ```
 */
export function useSessionFilters() {
  const [filters, setFilters] = useQueryStates({
    sessionTypes: parseAsArrayOf(parseAsSessionType).withDefault([]),
    status: parseAsBoolean, // null = all, true = running, false = stopped
  });

  return {
    sessionTypes: filters.sessionTypes,
    status: filters.status,
    setFilters,
    clearFilters: () =>
      setFilters({
        sessionTypes: [],
        status: null,
      }),
  };
}

/**
 * Use selected item in URL
 *
 * @example
 * ```tsx
 * const [selectedSession, setSelectedSession] = useSelectedSession();
 *
 * <SessionCard
 *   onClick={() => setSelectedSession(session.id)}
 *   selected={selectedSession === session.id}
 * />
 * ```
 */
export function useSelectedSession() {
  return useQueryState('session', parseAsString);
}

/**
 * Use modal/dialog state in URL
 *
 * @example
 * ```tsx
 * const [showLaunchModal, setShowLaunchModal] = useLaunchModal();
 *
 * <Button onClick={() => setShowLaunchModal(true)}>Launch</Button>
 * <LaunchModal open={showLaunchModal} onClose={() => setShowLaunchModal(false)} />
 * ```
 */
export function useLaunchModal() {
  return useQueryState('launch', parseAsBoolean.withDefault(false));
}

export function useDeleteModal() {
  return useQueryState('delete', parseAsString); // Contains session ID to delete
}

export function useEventsModal() {
  return useQueryState('events', parseAsString); // Contains session ID for events
}

/**
 * Use tab state in URL
 *
 * @example
 * ```tsx
 * const [activeTab, setActiveTab] = useTabState('overview');
 *
 * <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
 *   <Tab value="overview" label="Overview" />
 *   <Tab value="sessions" label="Sessions" />
 * </Tabs>
 * ```
 */
export function useTabState(defaultTab: string = 'overview') {
  return useQueryState('tab', parseAsString.withDefault(defaultTab));
}

/**
 * Use view mode in URL (grid/list)
 *
 * @example
 * ```tsx
 * const [viewMode, setViewMode] = useViewMode();
 *
 * <IconButton onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
 *   {viewMode === 'grid' ? <ListIcon /> : <GridIcon />}
 * </IconButton>
 * ```
 */
export function useViewMode() {
  const viewModeParser = parseAsStringEnum(['grid', 'list']);
  return useQueryState('view', viewModeParser.withDefault('grid'));
}

/**
 * Use expand/collapse state in URL
 *
 * @example
 * ```tsx
 * const [expandedIds, toggleExpanded] = useExpandedState();
 *
 * const isExpanded = expandedIds.includes(item.id);
 * <IconButton onClick={() => toggleExpanded(item.id)}>
 *   {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
 * </IconButton>
 * ```
 */
export function useExpandedState() {
  const [expandedIds, setExpandedIds] = useQueryState(
    'expanded',
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) =>
      current.includes(id) ? current.filter((i) => i !== id) : [...current, id]
    );
  };

  return [expandedIds, toggleExpanded] as const;
}

/**
 * Create a custom URL state hook
 *
 * @example
 * ```tsx
 * const parseAsDateRange = {
 *   parse: (value: string) => {
 *     const [start, end] = value.split(',');
 *     return { start: new Date(start), end: new Date(end) };
 *   },
 *   serialize: (value: { start: Date; end: Date }) =>
 *     `${value.start.toISOString()},${value.end.toISOString()}`,
 * };
 *
 * const [dateRange, setDateRange] = useQueryState('range', parseAsDateRange);
 * ```
 */
export { useQueryState, useQueryStates, parseAsString, parseAsInteger, parseAsBoolean, parseAsArrayOf, parseAsStringEnum };
