# Graph Report - src  (2026-06-09)

## Corpus Check
- 348 files · ~156,521 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1586 nodes · 3338 edges · 105 communities (94 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2cb94887`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]

## God Nodes (most connected - your core abstractions)
1. `extractApiErrorMessage()` - 52 edges
2. `api` - 34 edges
3. `useAuth()` - 29 edges
4. `useTabNavigation()` - 21 edges
5. `useDebounce()` - 17 edges
6. `getInterventionUrgency()` - 17 edges
7. `fetchIntervention()` - 15 edges
8. `hexBadgeStyle()` - 13 edges
9. `useNotification()` - 13 edges
10. `TYPE_INTER_LABELS` - 12 edges

## Surprising Connections (you probably didn't know these)
- `TasksTab()` --calls--> `useTaskCreate()`  [INFERRED]
  components/interventions/tabs/TasksTab.jsx → hooks/tasks/useTaskCreate.js
- `ActionMetadataHeader()` --calls--> `getCategoryColor()`  [INFERRED]
  components/ui/ActionMetadataHeader.jsx → lib/utils/interventionUtils.jsx
- `makeSimpleListHook()` --calls--> `extractApiErrorMessage()`  [EXTRACTED]
  hooks/admin/useAdminReferentiel.js → lib/api/errorMessage.js
- `AdminPage()` --calls--> `useTabNavigation()`  [EXTRACTED]
  pages/admin/AdminPage.jsx → hooks/shared/useTabNavigation.js
- `InterventionsListPage()` --calls--> `useTabNavigation()`  [EXTRACTED]
  pages/interventions/InterventionsListPage.jsx → hooks/shared/useTabNavigation.js

## Import Cycles
- None detected.

## Communities (105 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (9): AdminChangeRoleModal(), AdminResetPasswordModal(), AdminToggleActiveModal(), ROLES, ACTIVE_OPTIONS, ROLE_OPTIONS, useAdminUsers(), ROLE_COLORS (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (30): createStockFamily(), createStockItem(), createStockSubFamily(), deleteStockItem(), fetchStockFamilies(), fetchStockFamilyDetail(), fetchStockItemDetail(), fetchStockItems() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (38): deleteSupplierOrder(), exportSupplierOrderCsv(), exportSupplierOrderEmail(), fetchSupplierOrderDetail(), fetchSupplierOrderLines(), fetchSupplierOrders(), fetchSupplierOrderStatuses(), updateSupplierOrder() (+30 more)

### Community 3 - "Community 3"
Cohesion: 0.24
Nodes (13): actionDurationMinutes(), formatDayHeader(), formatDayHeaderShort(), formatDuration(), formatTime(), getMondayOf(), isWeekend(), minutesToDisplay() (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (9): apiCall(), APIError, buildErrorDTO(), createTypedError(), ERROR_TYPE_MAP, extractErrorMessage(), handleAPIError(), STATUS_MAP (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (33): fetchServiceStatus(), mapServiceStatusResponse(), mapSiteConsumption(), mapTopCauses(), toNumber(), ServiceStatusPage, SERVICE_TIME_TYPE_CATEGORIES, THRESHOLDS (+25 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (11): ActionTaskSection(), deriveInitials(), formatDueDateFR(), getAssigneeLabel(), getDueDateColor(), TaskRow(), fetchTasksWorkspace(), TaskCreateDialog() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (17): ORIGIN_CFG, TASK_STATUS_CFG, IvHeader(), IvSelectors(), MachineTitle(), PRIORITY_ORDER, STATUS_ORDER, triggerStyle() (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (17): deletePurchaseRequest(), dispatchPurchaseRequests(), fetchPurchaseRequests(), fetchPurchaseRequestStats(), fetchPurchaseRequests(), fetchStockItemSupplierLinks(), CreateStockTab(), CurrentStockTab() (+9 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (15): buildTicks(), DECISION_LABELS, EnrichedAction, EnrichedLog, GanttTimeline(), GanttTimelineProps, pct(), toDay() (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (11): createInterventionRequest(), fetchInterventionRequest(), fetchInterventionRequests(), transitionInterventionRequest(), fetchServices(), TYPE_INTER_LABELS, INITIAL_FORM, validate() (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (4): createInterventionActionForTask(), fetchInterventionTaskActions(), detailDate(), TaskDetail()

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (11): createInterventionTask(), TasksTab(), TASK_ORIGIN_COLOR, TASK_ORIGIN_LABEL, TASK_STATUS_COLOR, TASK_STATUS_LABEL, COLUMNS, TasksFilters() (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (3): EVENT_COLORS, EVENT_OPTIONS, DEFAULTS

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (6): ActionCategoriesSection(), ComplexityFactorsSection(), createActionSubcategory(), fetchActionSubcategories(), updateActionCategory(), updateActionSubcategory()

### Community 16 - "Community 16"
Cohesion: 0.10
Nodes (17): AdminPage, AdminPreventiveOccurrencesPage, AdminPreventivePlansPage, BriefingPage, EquipementDetailPage, EquipementsPage, HomeBriefing, HomeSplit (+9 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (8): fetchInterventionTasks(), patchInterventionTask(), updateInterventionTask(), createActionDirect(), usePermissions(), TasksTab(), InterventionCreatorFlow(), GammeProgressBlock()

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (8): createEquipement(), deleteEquipement(), fetchEquipementById(), fetchEquipementHealth(), fetchEquipementStats(), fetchEquipementStatuts(), updateEquipement(), DEFAULT_FORM

### Community 19 - "Community 19"
Cohesion: 0.15
Nodes (10): SearchableSelect(), CreateNewSupplierOption(), EmptyState(), SpecialRequestOption(), SuggestionsList(), useSearchableSelect(), SearchInput(), filterBySearch() (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (16): ActionFormFields(), computeDuration(), areComplexityFactorsRequired(), getCategoryCode(), getCategoryName(), isComplexityValid(), validateFormState(), ActionForm() (+8 more)

### Community 21 - "Community 21"
Cohesion: 0.21
Nodes (9): mapInterventionDetailResponse(), mapInterventionResponse(), createIntervention(), deleteIntervention(), fetchIntervention(), fetchInterventionPdf(), fetchInterventions(), updateIntervention() (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.27
Nodes (12): InterventionCard(), InterventionCardProps, useIvDetail(), completionFromProgress(), fmtDate(), PRIORITY_CFG, STATUS_CFG_MAP, useCardActions() (+4 more)

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (12): _auditConfigCache, cacheAuditFromResponse(), getAuditEntityType(), handleAuditError(), isAuditRequiredError(), onAuditRequired(), _retryWithReason(), _subscribers (+4 more)

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (9): InterventionStatusesSection(), InterventionTypesSection(), makeSimpleListHook(), useActionCategories, useActionSubcategories, useComplexityFactors, useInterventionStatuses, useInterventionTypes (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.05
Nodes (20): agingColor(), BAR_COLOR, DIBriefingItem(), getDaysWaiting(), InterventionRef(), PRIORITY_LABEL, today, formatDate() (+12 more)

### Community 27 - "Community 27"
Cohesion: 0.07
Nodes (13): fetchPurchaseRequestsByIntervention(), updatePurchaseRequest(), PurchaseRequestLine(), hexBadgeStyle(), INTERVENTION_STATUS_COLORS, PURCHASE_URGENCY, PURCHASE_URGENCY_LIST, OrderStatusBadge() (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (13): fetchInterventionTasksByOccurrence(), fetchInterventionTasksList(), fetchInterventionTasksProgress(), fetchInterventionTasksProgressByOccurrence(), fetchTasksProgress(), AUDIT_DECISION_LABELS, KANBAN_COLUMNS, PRIORITY_BADGE_COLORS (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.36
Nodes (5): Login(), RequireRole(), useAuth(), ELEVATED_ROLES, ProtectedRoute()

### Community 31 - "Community 31"
Cohesion: 0.28
Nodes (6): PRIORITY_COLOR, STATUS_COLOR_MAP, buildColumns(), buildPaginationProps(), EquipementInterventionsTab(), STATUS_COLORS

### Community 32 - "Community 32"
Cohesion: 0.27
Nodes (10): fetchInterventionRequestStatuses(), OCCURRENCE_STATUS_COLORS, OCCURRENCE_STATUS_LABELS, STEP_STATUS_COLORS, STEP_STATUS_LABELS, PreventiveOccurrencesTab(), stepColumns, PreventivePlanDetail() (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (12): ActionsTab, BASE_TABS, HistoryTab, InterventionDetailPage(), InterventionPurchaseTab, InterventionRequestCard, mapDtoStatusToConfigKey(), mapPriorityToConfigKey() (+4 more)

### Community 34 - "Community 34"
Cohesion: 0.26
Nodes (8): EndpointEditModal(), METHOD_COLORS, useAdminEndpoints(), useEquipementClasses(), useNotification(), AdminEndpointsTab(), DEFAULT_FORM, EquipementClassesTab()

### Community 35 - "Community 35"
Cohesion: 0.22
Nodes (4): createPurchaseRequest(), PurchaseRequestTab(), NOTIFICATION_TYPES, TYPE_CONFIG

### Community 36 - "Community 36"
Cohesion: 0.14
Nodes (13): COMPLEXITY_THRESHOLDS, DEFAULT_PRIORITY_BADGE, DEFAULT_SEVERITY_BADGE, DEFAULT_STATUS_BADGE, LOAD_PRIORITY_BADGES, LOW_LOAD_BADGE, LOW_PRODUCTIVITY_BADGE, MAX_COMPLEXITY_BADGE (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (15): AVATAR_COLORS, BriefingTile(), SITUATION_BADGE, today, daysOpen(), DI_SECTION_IDS, diSituationType(), normalizeOrphan() (+7 more)

### Community 38 - "Community 38"
Cohesion: 0.21
Nodes (9): ActionItemCard(), getComplexityColor(), getComplexityFactors(), getComplexityScore(), getCreatedAt(), getDescription(), getSubcategory(), getTimeSpent() (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.15
Nodes (6): ORIGIN_CFG, PRIORITY_CFG, STATUS_LEGEND, TASK_STATUS_CFG, TaskCard(), useEnrichedActions()

### Community 40 - "Community 40"
Cohesion: 0.19
Nodes (4): fetchActionCategories(), fetchActionCategory(), fetchComplexityFactors(), fetchComplexityFactors()

### Community 41 - "Community 41"
Cohesion: 0.21
Nodes (4): KNOWN_UNITS_SET, resolveUnitForItem(), UNIT_OPTIONS, PurchaseRequestForm()

### Community 43 - "Community 43"
Cohesion: 0.19
Nodes (9): BriefingCounters(), CHIP_CONFIG, BriefingItem(), BriefingPage(), BriefingSection(), BriefingPane(), useBriefingData(), formatBriefingDate() (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.32
Nodes (11): calculateAge(), getActionnableRowStyle(), getAgeColor(), getBloqueRowStyle(), getStandardRowStyle(), renderActionnableCell(), renderBloqueCell(), renderStandardCell() (+3 more)

### Community 45 - "Community 45"
Cohesion: 0.14
Nodes (10): DIRightPanel(), STATUS_BADGES, formatDate(), InterventionRequestDetail(), PRIORITY_COLOR, PRIORITY_LABEL, PRIORITY_OPTIONS, StatusLogEntry() (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.30
Nodes (9): getTechnician(), HistoryVariant(), formatFullDateTime(), getStatusLabel(), getTechnicianName(), getTimelineBackground(), getTimelineBadgeStyle(), getTimelineIconColor() (+1 more)

### Community 47 - "Community 47"
Cohesion: 0.27
Nodes (4): buildTabs(), EquipementDetailTab(), getMinHeight(), LoadingState()

### Community 48 - "Community 48"
Cohesion: 0.39
Nodes (9): PILL_COLORS, PlanningPane(), usePlanningWeek(), HomeSplit(), addDays(), formatWeekLabel(), getWeekDays(), todayIso() (+1 more)

### Community 49 - "Community 49"
Cohesion: 0.16
Nodes (10): fetchQualityData(), mapQualityDataResponse(), ENTITY_LABELS, RULE_DESCRIPTIONS, SEVERITY_CONFIG, EntitySection(), NoProblemsMessage(), SynthesisCards() (+2 more)

### Community 50 - "Community 50"
Cohesion: 0.15
Nodes (6): AuthenticationError, ConflictError, NetworkError, NotFoundError, PermissionError, ValidationError

### Community 51 - "Community 51"
Cohesion: 0.12
Nodes (10): AVATAR_COLORS, SECTION_BAR_COLOR, SituationBadges(), TYPE_COLOR, BriefingTileHeader(), SITUATION_BADGE, getBarColor(), ProgressBar() (+2 more)

### Community 52 - "Community 52"
Cohesion: 0.16
Nodes (8): createManufacturer(), deleteManufacturer(), fetchManufacturerDetail(), fetchManufacturers(), updateManufacturer(), ManufacturersTab(), useManufacturerDetail(), useManufacturers()

### Community 53 - "Community 53"
Cohesion: 0.17
Nodes (7): EquipementInfoHeader(), formatDate(), Row(), formatDate(), OccurrencesSummary(), PlanItem(), HEALTH_CONFIG

### Community 54 - "Community 54"
Cohesion: 0.09
Nodes (19): changeMyPassword(), extractAuthData(), getMe(), isAuthenticated(), login(), logout(), refreshToken(), updateMyProfile() (+11 more)

### Community 55 - "Community 55"
Cohesion: 0.31
Nodes (7): PurchaseRequestsPage(), useTabNavigation(), ManufacturersTab, StockItemsTab, StockPage(), SuppliersTab, SuppliersPage()

### Community 56 - "Community 56"
Cohesion: 0.17
Nodes (6): GROUP_LABELS, PRIORITY_COLORS, PRIORITY_LABELS, PRIORITY_SORT, STATUS_COLORS, STATUS_LABELS

### Community 57 - "Community 57"
Cohesion: 0.21
Nodes (6): buildFormData(), ContextSection(), getDefaultDateTimeLocal(), fetchEquipements(), HEALTH_CONFIG, searchEquipements()

### Community 58 - "Community 58"
Cohesion: 0.39
Nodes (6): useAuditGuard(), Layout(), getMessage(), STATUS_MESSAGES, SystemErrorBanner(), useMediaQuery()

### Community 59 - "Community 59"
Cohesion: 0.24
Nodes (6): FIELD_TYPE_COLOR, FIELD_TYPE_LABEL, StockSubFamilyForm(), usePartTemplates(), columns, StockTemplatesTab()

### Community 60 - "Community 60"
Cohesion: 0.32
Nodes (5): clearSystemError(), emitSystemError(), onSystemError(), subscribers, useApiStatus()

### Community 61 - "Community 61"
Cohesion: 0.22
Nodes (4): enrichSituation(), getDaysOpen(), PRIORITY_ORDER, today

### Community 62 - "Community 62"
Cohesion: 0.06
Nodes (24): fetchDashboardSummary(), COLOR_PALETTE, COLOR_SCALES, COLOR_TONES, COLOR_USAGE, RADIX_COLOR_MAP, DEFAULT_CONTAINER_PROPS, getMenuItems() (+16 more)

### Community 63 - "Community 63"
Cohesion: 0.70
Nodes (3): fetchAdminEndpoints(), syncAdminEndpoints(), updateAdminEndpoint()

### Community 65 - "Community 65"
Cohesion: 0.22
Nodes (3): PageHeader(), DEFAULT_OPTIONS, useTimeSelection()

### Community 66 - "Community 66"
Cohesion: 0.22
Nodes (8): ConsultationHint(), DeleteButton(), DeleteConfirm(), derivePrStyle(), getSelectedBasketNumber(), PrBadges(), PurchaseRequestItem(), UrgencyBadge()

### Community 68 - "Community 68"
Cohesion: 0.29
Nodes (7): getPageConfig(), usePageConfig(), usePageHeaderProps(), InterventionRequestsPage(), PurchaseRequestPage(), getColors(), SelectionSummary()

### Community 69 - "Community 69"
Cohesion: 0.22
Nodes (7): useAdminAudit(), AdminAuditTab(), EMPTY_FILTERS, ENTITY_COLORS, ENTITY_LABELS, _serializeDiff(), ValueDiff()

### Community 70 - "Community 70"
Cohesion: 0.22
Nodes (8): usePermissionAudit(), useRolesMatrix(), fetchAdminRoles(), fetchPermissionAudit(), fetchRolePermissions(), fetchRolesMatrix(), updatePermission(), AdminRolesTab()

### Community 71 - "Community 71"
Cohesion: 0.20
Nodes (5): repairInterventionRequests(), useInterventionRequests(), columns, ELLIPSIS, InterventionRequestsTab()

### Community 74 - "Community 74"
Cohesion: 0.46
Nodes (6): changeAdminUserRole(), createAdminUser(), fetchAdminUsers(), resetAdminUserPassword(), toggleAdminUserActive(), updateAdminUser()

### Community 75 - "Community 75"
Cohesion: 0.60
Nodes (3): EquipementsPage(), useEquipements(), EquipementChildrenTab()

### Community 76 - "Community 76"
Cohesion: 0.25
Nodes (3): extractApiErrorMessage(), ErrorState(), LINK_STYLE

### Community 78 - "Community 78"
Cohesion: 0.33
Nodes (7): fetchActiveUsers(), fetchOpenInterventions(), fetchOpenInterventionsByEquipement(), fetchWeekActions(), DiOnlyPanel(), getDefaultDateTimeLocal(), useInterventionCreate()

### Community 79 - "Community 79"
Cohesion: 0.31
Nodes (10): UrgencyLabel(), DueBanner(), daysAgo(), daysBetween(), formatDueDate(), getInterventionUrgency(), startOfDay(), useInterventionUrgency() (+2 more)

### Community 80 - "Community 80"
Cohesion: 0.36
Nodes (4): hasDraft(), OrderLineRowEditable(), LineBadges(), LineRefs()

### Community 82 - "Community 82"
Cohesion: 0.67
Nodes (5): useApiKeys(), useEmailDomainRules(), useIpBlocklist(), useSecurityLogs(), AdminSecurityTab()

### Community 83 - "Community 83"
Cohesion: 0.52
Nodes (5): createPartTemplate(), createPartTemplateVersion(), deletePartTemplate(), fetchPartTemplate(), fetchPartTemplates()

### Community 84 - "Community 84"
Cohesion: 0.18
Nodes (11): fetchPurchaseRequestDetail(), fetchPurchaseRequestStatuses(), usePurchaseRequests(), ARCHIVE_STATUSES, PurchaseRequestsArchiveTab(), DetailEmptyState(), PurchaseRequestsTab(), ARCHIVE_STATUSES (+3 more)

### Community 85 - "Community 85"
Cohesion: 0.31
Nodes (4): useDebounce(), SearchStockTab(), AsyncSearchSelect(), STATE_BOX

### Community 86 - "Community 86"
Cohesion: 0.33
Nodes (6): createPreventivePlan(), deletePreventivePlan(), fetchPreventivePlan(), fetchPreventivePlans(), patchPreventivePlanSteps(), updatePreventivePlan()

### Community 87 - "Community 87"
Cohesion: 0.29
Nodes (5): triggerLabel(), PlanItem(), PreventivePage(), PreventivePlansTab(), usePreventivePlans()

### Community 89 - "Community 89"
Cohesion: 0.60
Nodes (5): buildUserLabel(), formatDateFR(), HistoryItem(), renderActionBadge(), renderStatusTransition()

### Community 91 - "Community 91"
Cohesion: 0.22
Nodes (8): ActionSubcategory, ActionTechnician, InterventionMachine, InterventionStats, InterventionUrgency, PurchaseRequest, StatusLog, TaskAssignedTo

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (9): calculateActionStats(), countTotalAnomalies(), detectAnomalies(), detectBackToBackActions(), detectBadClassification(), detectFragmentedActions(), detectLowValueHighLoad(), detectRepetitiveActions() (+1 more)

### Community 93 - "Community 93"
Cohesion: 0.25
Nodes (5): DECISION_LABELS, EmptyState(), IvBody(), IvBodyProps, STATUS_GROUP_CFG

### Community 94 - "Community 94"
Cohesion: 0.25
Nodes (4): ORIGIN_CONFIG, SORT_ORDER, STATUS_CONFIG, TasksPane()

### Community 95 - "Community 95"
Cohesion: 0.29
Nodes (6): AdminAuditTab, AdminPage(), AdminReferentielTab, AdminRolesTab, AdminSecurityTab, AdminUsersTab

### Community 96 - "Community 96"
Cohesion: 0.29
Nodes (6): GlobalTasksTab, InterventionPlanningTab, InterventionRequestsTab, InterventionsListPage(), InterventionsListTab, TABS

### Community 97 - "Community 97"
Cohesion: 0.60
Nodes (4): fetchPreventiveOccurrences(), generatePreventiveOccurrences(), repairPreventiveOccurrences(), skipPreventiveOccurrence()

### Community 98 - "Community 98"
Cohesion: 0.60
Nodes (3): fetchAllAuditReasonCodes(), fetchAuditLogs(), collectAuditLogs()

### Community 99 - "Community 99"
Cohesion: 0.70
Nodes (4): createAction(), fetchAction(), mapActionResponse(), updateAction()

### Community 101 - "Community 101"
Cohesion: 0.60
Nodes (4): buildBoxStyle(), buildCellStyle(), ContentWrapper(), ExpandableDetailsRow()

### Community 103 - "Community 103"
Cohesion: 0.67
Nodes (3): BriefingPage, EquipementDetailPage(), useEquipementDetail()

## Knowledge Gaps
- **169 isolated node(s):** `_cache`, `ELEVATED_ROLES`, `DURATION_OPTIONS`, `EVENT_COLORS`, `EVENT_OPTIONS` (+164 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `extractApiErrorMessage()` connect `Community 76` to `Community 0`, `Community 1`, `Community 2`, `Community 6`, `Community 7`, `Community 9`, `Community 11`, `Community 15`, `Community 18`, `Community 20`, `Community 21`, `Community 25`, `Community 28`, `Community 33`, `Community 34`, `Community 35`, `Community 48`, `Community 49`, `Community 52`, `Community 60`, `Community 61`, `Community 63`, `Community 70`, `Community 74`, `Community 75`, `Community 78`, `Community 82`, `Community 83`, `Community 86`, `Community 97`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `api` connect `Community 23` to `Community 1`, `Community 2`, `Community 6`, `Community 7`, `Community 9`, `Community 11`, `Community 15`, `Community 18`, `Community 21`, `Community 28`, `Community 40`, `Community 42`, `Community 49`, `Community 52`, `Community 54`, `Community 62`, `Community 63`, `Community 67`, `Community 70`, `Community 74`, `Community 78`, `Community 83`, `Community 86`, `Community 97`, `Community 98`, `Community 99`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `STATUS_BADGES` connect `Community 45` to `Community 9`, `Community 27`, `Community 36`, `Community 4`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **What connects `_cache`, `ELEVATED_ROLES`, `DURATION_OPTIONS` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05406746031746032 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05821917808219178 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._