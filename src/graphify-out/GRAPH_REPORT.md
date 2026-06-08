# Graph Report - src  (2026-06-09)

## Corpus Check
- 351 files · ~156,907 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1596 nodes · 3346 edges · 96 communities (86 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f409d387`
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
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
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
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]

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
- `ActionMetadataHeader()` --calls--> `getCategoryColor()`  [INFERRED]
  components/ui/ActionMetadataHeader.jsx → lib/utils/interventionUtils.jsx
- `ErrorState()` --calls--> `extractApiErrorMessage()`  [EXTRACTED]
  components/ui/ErrorState.jsx → lib/api/errorMessage.js
- `makeSimpleListHook()` --calls--> `extractApiErrorMessage()`  [EXTRACTED]
  hooks/admin/useAdminReferentiel.js → lib/api/errorMessage.js
- `InterventionsListPage()` --calls--> `useTabNavigation()`  [EXTRACTED]
  pages/interventions/InterventionsListPage.jsx → hooks/shared/useTabNavigation.js
- `collectAuditLogs()` --calls--> `fetchAuditLogs()`  [EXTRACTED]
  components/briefing/InterventionCard.tsx → api/auditLogs.js

## Import Cycles
- None detected.

## Communities (96 total, 10 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (11): AdminChangeRoleModal(), AdminResetPasswordModal(), AdminToggleActiveModal(), ROLES, EMPTY_FORM, ROLES, ACTIVE_OPTIONS, ROLE_OPTIONS (+3 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (8): StockItemForm(), fromItem(), useStockItemForm(), useStockSubFamilies(), buildOptionals(), buildPayload(), charsToForm(), generatePattern()

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (37): deleteSupplierOrder(), exportSupplierOrderCsv(), exportSupplierOrderEmail(), fetchSupplierOrderDetail(), fetchSupplierOrderLines(), fetchSupplierOrders(), fetchSupplierOrderStatuses(), updateSupplierOrder() (+29 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (46): buildFormData(), ContextSection(), getDefaultDateTimeLocal(), createAction(), fetchAction(), mapActionResponse(), updateAction(), fetchInterventionTasks() (+38 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (26): ANOMALY_CONFIG, COMPLEXITY_THRESHOLDS, DEFAULT_PRIORITY_BADGE, DEFAULT_SEVERITY_BADGE, DEFAULT_STATUS_BADGE, LOAD_PRIORITY_BADGES, LOW_LOAD_BADGE, LOW_PRODUCTIVITY_BADGE (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (9): apiCall(), APIError, buildErrorDTO(), createTypedError(), ERROR_TYPE_MAP, extractErrorMessage(), handleAPIError(), STATUS_MAP (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (33): fetchServiceStatus(), mapServiceStatusResponse(), mapSiteConsumption(), mapTopCauses(), toNumber(), ServiceStatusPage, SERVICE_TIME_TYPE_CATEGORIES, THRESHOLDS (+25 more)

### Community 7 - "Community 7"
Cohesion: 0.42
Nodes (7): extractAuthData(), getMe(), isAuthenticated(), login(), logout(), refreshToken(), auth

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (19): PRIORITY_COLOR, ORIGIN_CFG, TASK_STATUS_CFG, IvSelectors(), MachineTitle(), PRIORITY_ORDER, STATUS_ORDER, triggerStyle() (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (17): dispatchPurchaseRequests(), fetchPurchaseRequests(), fetchPurchaseRequestStats(), updatePurchaseRequest(), fetchPurchaseRequests(), fetchStockItemSupplierLinks(), CreateStockTab(), CurrentStockTab() (+9 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (23): buildTicks(), DECISION_LABELS, EnrichedAction, EnrichedLog, GanttTimeline(), GanttTimelineProps, pct(), toDay() (+15 more)

### Community 11 - "Community 11"
Cohesion: 0.16
Nodes (8): createInterventionRequest(), fetchInterventionRequests(), transitionInterventionRequest(), fetchServices(), TYPE_INTER_LABELS, INITIAL_FORM, validate(), RequestRow()

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (4): createInterventionActionForTask(), fetchInterventionTaskActions(), detailDate(), TaskDetail()

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (28): ActionTaskSection(), deriveInitials(), formatDueDateFR(), getAssigneeLabel(), getDueDateColor(), TaskRow(), createInterventionTask(), patchInterventionTask() (+20 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (3): EVENT_COLORS, EVENT_OPTIONS, columns

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (23): ActionCategoriesSection(), ComplexityFactorsSection(), InterventionStatusesSection(), InterventionTypesSection(), makeSimpleListHook(), useActionCategories, useActionSubcategories, useComplexityFactors (+15 more)

### Community 16 - "Community 16"
Cohesion: 0.10
Nodes (17): AdminPage, AdminPreventiveOccurrencesPage, AdminPreventivePlansPage, BriefingPage, EquipementDetailPage, EquipementsPage, HomeBriefing, HomeSplit (+9 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (11): createStockFamily(), createStockItem(), deleteStockItem(), fetchStockFamilies(), fetchStockItems(), fetchStockSubFamilies(), fetchStockSubFamily(), updateStockFamily() (+3 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (10): fetchEquipementClasses(), createEquipement(), deleteEquipement(), fetchEquipementById(), fetchEquipementHealth(), fetchEquipementStats(), fetchEquipementStatuts(), updateEquipement() (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.15
Nodes (10): SearchableSelect(), CreateNewSupplierOption(), EmptyState(), SpecialRequestOption(), SuggestionsList(), useSearchableSelect(), SearchInput(), filterBySearch() (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.30
Nodes (8): ActionFormFields(), computeDuration(), getCategoryCode(), getCategoryName(), isComplexityValid(), validateFormState(), ActionMetadataHeader(), getCategoryColor()

### Community 21 - "Community 21"
Cohesion: 0.21
Nodes (9): mapInterventionDetailResponse(), mapInterventionResponse(), createIntervention(), deleteIntervention(), fetchIntervention(), fetchInterventionPdf(), fetchInterventions(), updateIntervention() (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (18): InterventionCard(), InterventionCardProps, useIvDetail(), completionFromProgress(), fmtDate(), PRIORITY_CFG, STATUS_CFG_MAP, useCardActions() (+10 more)

### Community 23 - "Community 23"
Cohesion: 0.16
Nodes (11): _auditConfigCache, cacheAuditFromResponse(), getAuditEntityType(), handleAuditError(), isAuditRequiredError(), _retryWithReason(), _subscribers, _URL_ENTITY_MAP (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.40
Nodes (3): fetchInterventionTasksProgress(), GammeProgressBanner(), Timeline()

### Community 25 - "Community 25"
Cohesion: 0.18
Nodes (7): fetchStockItemDetail(), ManufacturersTab(), useUrlSearch(), useStockItems(), useManufacturerDetail(), useManufacturers(), StockItemsTab()

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (6): InterventionRef(), DiSummaryBlock(), normalize(), InterventionRow(), PRIORITY_OPTIONS, TechDateRow()

### Community 28 - "Community 28"
Cohesion: 0.09
Nodes (7): fetchInterventionTasksByOccurrence(), fetchInterventionTasksList(), fetchInterventionTasksProgressByOccurrence(), fetchTasksProgress(), KANBAN_COLUMNS, PRIORITY_CONFIG, STATUS_CONFIG

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (4): PageHeader(), DEFAULT_OPTIONS, DEFAULT_OPTIONS, useTimeSelection()

### Community 30 - "Community 30"
Cohesion: 0.48
Nodes (4): Login(), RequireRole(), useAuth(), ProtectedRoute()

### Community 31 - "Community 31"
Cohesion: 0.32
Nodes (5): PRIORITY_BADGE_COLORS, buildColumns(), buildPaginationProps(), EquipementInterventionsTab(), STATUS_COLORS

### Community 32 - "Community 32"
Cohesion: 0.05
Nodes (32): PAGE_CONFIG, PAGE_CONFIG, fetchInterventionRequestStatuses(), fetchPreventiveOccurrences(), generatePreventiveOccurrences(), repairPreventiveOccurrences(), skipPreventiveOccurrence(), createPreventivePlan() (+24 more)

### Community 33 - "Community 33"
Cohesion: 0.12
Nodes (12): ActionsTab, BASE_TABS, HistoryTab, InterventionDetailPage(), InterventionPurchaseTab, InterventionRequestCard, mapDtoStatusToConfigKey(), mapPriorityToConfigKey() (+4 more)

### Community 34 - "Community 34"
Cohesion: 0.24
Nodes (8): EndpointEditModal(), METHOD_COLORS, useAdminEndpoints(), useEquipementClasses(), useNotification(), AdminEndpointsTab(), DEFAULT_FORM, EquipementClassesTab()

### Community 35 - "Community 35"
Cohesion: 0.22
Nodes (5): extractApiErrorMessage(), createPurchaseRequest(), PurchaseRequestTab(), NOTIFICATION_TYPES, TYPE_CONFIG

### Community 36 - "Community 36"
Cohesion: 0.15
Nodes (13): deletePurchaseRequest(), fetchPurchaseRequestsByIntervention(), PurchaseRequestLine(), hexBadgeStyle(), INTERVENTION_STATUS_COLORS, PURCHASE_URGENCY, PURCHASE_URGENCY_LIST, OrderStatusBadge() (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.07
Nodes (39): SituationBadges(), AVATAR_COLORS, BriefingTile(), SITUATION_BADGE, today, UrgencyLabel(), BriefingTileHeader(), SITUATION_BADGE (+31 more)

### Community 38 - "Community 38"
Cohesion: 0.26
Nodes (9): ActionItemCard(), getComplexityColor(), getComplexityFactors(), getComplexityScore(), getCreatedAt(), getDescription(), getSubcategory(), getTimeSpent() (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.08
Nodes (17): useAdminAudit(), fetchAllAuditReasonCodes(), fetchAuditLogs(), collectAuditLogs(), AUDIT_DECISION_LABELS, ORIGIN_CFG, PRIORITY_CFG, STATUS_LEGEND (+9 more)

### Community 40 - "Community 40"
Cohesion: 0.18
Nodes (3): buildTimelineDotStyle(), History(), TimelineDot()

### Community 41 - "Community 41"
Cohesion: 0.21
Nodes (4): KNOWN_UNITS_SET, resolveUnitForItem(), UNIT_OPTIONS, PurchaseRequestForm()

### Community 43 - "Community 43"
Cohesion: 0.19
Nodes (9): BriefingCounters(), CHIP_CONFIG, BriefingItem(), BriefingPage(), BriefingSection(), BriefingPane(), useBriefingData(), formatBriefingDate() (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.18
Nodes (9): discoveredPages, getMenuItems(), getMenuSections(), getPageConfig(), LEGACY_PAGES, MENU_CONFIG, pageConfigModules, SECTION_LABELS (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.15
Nodes (9): DIRightPanel(), formatDate(), InterventionRequestDetail(), PRIORITY_COLOR, PRIORITY_LABEL, PRIORITY_OPTIONS, StatusLogEntry(), TRANSITIONS (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.30
Nodes (9): getTechnician(), HistoryVariant(), formatFullDateTime(), getStatusLabel(), getTechnicianName(), getTimelineBackground(), getTimelineBadgeStyle(), getTimelineIconColor() (+1 more)

### Community 47 - "Community 47"
Cohesion: 0.16
Nodes (10): GlobalTasksTab, InterventionPlanningTab, InterventionRequestsTab, InterventionsListPage(), InterventionsListTab, TABS, buildTabs(), EquipementDetailTab() (+2 more)

### Community 48 - "Community 48"
Cohesion: 0.27
Nodes (7): COLORS, renderDesktopHeader(), renderMobileHeader(), renderPublicSeparator(), Sidebar(), STATUS_COLOR_MAP, useSidebarState()

### Community 49 - "Community 49"
Cohesion: 0.16
Nodes (10): fetchQualityData(), mapQualityDataResponse(), ENTITY_LABELS, RULE_DESCRIPTIONS, SEVERITY_CONFIG, EntitySection(), NoProblemsMessage(), SynthesisCards() (+2 more)

### Community 50 - "Community 50"
Cohesion: 0.15
Nodes (6): AuthenticationError, ConflictError, NetworkError, NotFoundError, PermissionError, ValidationError

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (7): AVATAR_COLORS, SECTION_BAR_COLOR, TYPE_COLOR, getBarColor(), ProgressBar(), ProgressBarProps, INTERVENTION_TYPES

### Community 52 - "Community 52"
Cohesion: 0.30
Nodes (5): createManufacturer(), deleteManufacturer(), fetchManufacturerDetail(), fetchManufacturers(), updateManufacturer()

### Community 53 - "Community 53"
Cohesion: 0.14
Nodes (10): BriefingPage, EquipementDetailPage(), EquipementInfoHeader(), formatDate(), Row(), useEquipementDetail(), formatDate(), OccurrencesSummary() (+2 more)

### Community 54 - "Community 54"
Cohesion: 0.23
Nodes (8): BASE_BUTTON_STYLE, getVariantStyle(), SidebarActionButton(), VARIANT_STYLES, BASE_BUTTON_STYLE, getVariantStyle(), SidebarActionButton(), VARIANT_STYLES

### Community 55 - "Community 55"
Cohesion: 0.13
Nodes (14): AdminAuditTab, AdminPage(), AdminReferentielTab, AdminRolesTab, AdminSecurityTab, AdminUsersTab, EquipementsPage(), PurchaseRequestsPage() (+6 more)

### Community 56 - "Community 56"
Cohesion: 0.31
Nodes (4): areComplexityFactorsRequired(), ActionForm(), useActionForm(), useActionSubmit()

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (3): fetchEquipements(), HEALTH_CONFIG, searchEquipements()

### Community 58 - "Community 58"
Cohesion: 0.52
Nodes (4): onAuditRequired(), useAuditGuard(), Layout(), useMediaQuery()

### Community 59 - "Community 59"
Cohesion: 0.24
Nodes (6): FIELD_TYPE_COLOR, FIELD_TYPE_LABEL, StockSubFamilyForm(), usePartTemplates(), columns, StockTemplatesTab()

### Community 60 - "Community 60"
Cohesion: 0.23
Nodes (8): clearSystemError(), emitSystemError(), onSystemError(), subscribers, getMessage(), STATUS_MESSAGES, SystemErrorBanner(), useApiStatus()

### Community 61 - "Community 61"
Cohesion: 0.22
Nodes (4): enrichSituation(), getDaysOpen(), PRIORITY_ORDER, today

### Community 62 - "Community 62"
Cohesion: 0.36
Nodes (4): fetchDashboardSummary(), checkServerStatus(), getHealthUrl(), getServerUrl()

### Community 63 - "Community 63"
Cohesion: 0.29
Nodes (6): usePermissionAudit(), useRolesMatrix(), fetchAdminEndpoints(), syncAdminEndpoints(), updateAdminEndpoint(), AdminRolesTab()

### Community 65 - "Community 65"
Cohesion: 0.22
Nodes (4): formatDate(), InterventionRequestCard(), ICON_STYLE, TEXT_CENTER_STYLE

### Community 66 - "Community 66"
Cohesion: 0.22
Nodes (8): ConsultationHint(), DeleteButton(), DeleteConfirm(), derivePrStyle(), getSelectedBasketNumber(), PrBadges(), PurchaseRequestItem(), UrgencyBadge()

### Community 68 - "Community 68"
Cohesion: 0.33
Nodes (6): usePageConfig(), usePageHeaderProps(), InterventionRequestsPage(), PurchaseRequestPage(), getColors(), SelectionSummary()

### Community 69 - "Community 69"
Cohesion: 0.22
Nodes (6): COLOR_PALETTE, COLOR_SCALES, COLOR_TONES, COLOR_USAGE, RADIX_COLOR_MAP, HEX_TO_RADIX_COLOR

### Community 70 - "Community 70"
Cohesion: 0.36
Nodes (5): fetchAdminRoles(), fetchPermissionAudit(), fetchRolePermissions(), fetchRolesMatrix(), updatePermission()

### Community 71 - "Community 71"
Cohesion: 0.25
Nodes (5): repairInterventionRequests(), useInterventionRequests(), columns, ELLIPSIS, InterventionRequestsTab()

### Community 74 - "Community 74"
Cohesion: 0.46
Nodes (6): changeAdminUserRole(), createAdminUser(), fetchAdminUsers(), resetAdminUserPassword(), toggleAdminUserActive(), updateAdminUser()

### Community 76 - "Community 76"
Cohesion: 0.53
Nodes (4): ALL_SLOTS, formatDuration(), TimeRangePicker(), toMinutes()

### Community 78 - "Community 78"
Cohesion: 0.46
Nodes (6): fetchInterventionRequest(), DiOnlyPanel(), InterventionCreatePage(), useRequestLinking(), getDefaultDateTimeLocal(), useInterventionCreate()

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
Cohesion: 0.26
Nodes (8): createStockSubFamily(), fetchStockFamilyDetail(), useDebounce(), SearchStockTab(), StockFamilyDetail(), useStockFamilyDetail(), AsyncSearchSelect(), STATE_BOX

### Community 86 - "Community 86"
Cohesion: 0.38
Nodes (6): agingColor(), BAR_COLOR, DIBriefingItem(), getDaysWaiting(), PRIORITY_LABEL, today

### Community 88 - "Community 88"
Cohesion: 0.47
Nodes (4): changeMyPassword(), updateMyProfile(), PasswordTab(), ProfileTab()

### Community 89 - "Community 89"
Cohesion: 0.60
Nodes (5): buildUserLabel(), formatDateFR(), HistoryItem(), renderActionBadge(), renderStatusTransition()

### Community 93 - "Community 93"
Cohesion: 0.67
Nodes (3): useStockFamilies(), columns, StockFamiliesTab()

## Knowledge Gaps
- **173 isolated node(s):** `_cache`, `ELEVATED_ROLES`, `DURATION_OPTIONS`, `EVENT_COLORS`, `EVENT_OPTIONS` (+168 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `extractApiErrorMessage()` connect `Community 35` to `Community 0`, `Community 2`, `Community 3`, `Community 6`, `Community 9`, `Community 11`, `Community 13`, `Community 15`, `Community 17`, `Community 18`, `Community 21`, `Community 24`, `Community 32`, `Community 33`, `Community 34`, `Community 49`, `Community 52`, `Community 56`, `Community 60`, `Community 61`, `Community 63`, `Community 70`, `Community 74`, `Community 75`, `Community 78`, `Community 82`, `Community 83`, `Community 85`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `api` connect `Community 23` to `Community 2`, `Community 3`, `Community 6`, `Community 7`, `Community 9`, `Community 11`, `Community 13`, `Community 15`, `Community 17`, `Community 18`, `Community 21`, `Community 28`, `Community 32`, `Community 39`, `Community 42`, `Community 49`, `Community 52`, `Community 62`, `Community 63`, `Community 67`, `Community 70`, `Community 74`, `Community 83`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `STATUS_BADGES` connect `Community 4` to `Community 9`, `Community 36`, `Community 45`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **What connects `_cache`, `ELEVATED_ROLES`, `DURATION_OPTIONS` to the rest of the system?**
  _173 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1341991341991342 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10461538461538461 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05995975855130785 - nodes in this community are weakly interconnected._