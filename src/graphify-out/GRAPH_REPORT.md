# Graph Report - src  (2026-06-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1383 nodes · 2453 edges · 124 communities (93 shown, 31 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c823d93`
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
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
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
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 109|Community 109]]
- [[_COMMUNITY_Community 114|Community 114]]
- [[_COMMUNITY_Community 116|Community 116]]

## God Nodes (most connected - your core abstractions)
1. `extractApiErrorMessage()` - 49 edges
2. `api` - 33 edges
3. `fetchIntervention()` - 17 edges
4. `getInterventionUrgency()` - 15 edges
5. `TYPE_INTER_LABELS` - 10 edges
6. `fetchEquipements()` - 9 edges
7. `createIntervention()` - 9 edges
8. `updateIntervention()` - 9 edges
9. `hexBadgeStyle()` - 9 edges
10. `formatDueDate()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `ErrorState()` --calls--> `extractApiErrorMessage()`  [EXTRACTED]
  components/ui/ErrorState.jsx → lib/api/errorMessage.js
- `makeSimpleListHook()` --calls--> `extractApiErrorMessage()`  [EXTRACTED]
  hooks/admin/useAdminReferentiel.js → lib/api/errorMessage.js
- `collectAuditLogs()` --calls--> `fetchAuditLogs()`  [EXTRACTED]
  components/briefing/InterventionCard.tsx → api/auditLogs.js
- `searchEquipements()` --calls--> `fetchEquipements()`  [EXTRACTED]
  components/planning/EquipementSearch.jsx → api/equipements.js
- `useRequestLinking()` --calls--> `fetchInterventionRequest()`  [EXTRACTED]
  pages/interventions/InterventionCreatePage.jsx → api/intervention-requests.js

## Import Cycles
- None detected.

## Communities (124 total, 31 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (31): COMPLEXITY_THRESHOLDS, DEFAULT_PRIORITY_BADGE, DEFAULT_SEVERITY_BADGE, DEFAULT_STATUS_BADGE, LOAD_PRIORITY_BADGES, LOW_LOAD_BADGE, LOW_PRODUCTIVITY_BADGE, MAX_COMPLEXITY_BADGE (+23 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (23): exportSupplierOrderCsv(), exportSupplierOrderEmail(), fetchSupplierOrderStatuses(), createSupplier(), createSupplierItemLink(), deleteSupplier(), deleteSupplierItemLink(), fetchStockItemSupplierLinks() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (26): fetchDashboardSummary(), fetchTasksWorkspace(), TasksTab(), formatDateFR(), getDueDateColor(), HomePage(), INTER_COLUMNS, renderTaskCell() (+18 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (15): BAR_COLOR, InterventionRef(), PRIORITY_LABEL, today, TYPE_INTER_LABELS, DiSummaryBlock(), normalize(), PRIORITY_OPTIONS (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (23): onAuditRequired(), COLOR_SCALES, COLOR_TONES, COLOR_USAGE, RADIX_COLOR_MAP, DEFAULT_CONTAINER_PROPS, discoveredPages, getMenuItems() (+15 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (31): AVATAR_COLORS, today, UrgencyLabel(), SITUATION_BADGE, daysOpen(), DI_SECTION_IDS, diSituationType(), normalizeOrphan() (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (21): AdminChangeRoleModal(), AdminResetPasswordModal(), AdminToggleActiveModal(), ROLES, EMPTY_FORM, ROLES, ACTIVE_OPTIONS, ROLE_COLORS (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (20): changeMyPassword(), extractAuthData(), getMe(), isAuthenticated(), login(), logout(), refreshToken(), updateMyProfile() (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (3): getTechnician(), getCategoryColor(), sanitizeDescription()

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (14): ComplexityFactorsSection(), InterventionStatusesSection(), InterventionTypesSection(), makeSimpleListHook(), useActionCategories, useComplexityFactors, useInterventionStatuses, useInterventionTypes (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (21): ORIGIN_CFG, TASK_STATUS_CFG, IvHeader(), IvHeaderProps, IvSelectors(), MachineTitle(), PRIORITY_ORDER, STATUS_ORDER (+13 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (20): SERVICE_TIME_TYPE_CATEGORIES, THRESHOLDS, SynthesisCards(), TimeBreakdownSection(), DecisionGuide(), calculateMetrics(), extractColors(), extractTexts() (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (12): createInterventionActionForTask(), fetchInterventionTaskActions(), fetchInterventionTasksProgress(), fetchInterventionTasksProgressByOccurrence(), fetchTasksProgress(), KANBAN_COLUMNS, PRIORITY_CONFIG, STATE_COLORS (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (12): fetchEquipementClasses(), createEquipement(), deleteEquipement(), fetchEquipementHealth(), fetchEquipements(), updateEquipement(), DEFAULT_FORM, PAGE_CONFIG (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (19): buildTicks(), DECISION_LABELS, EnrichedAction, EnrichedLog, GanttTimeline(), GanttTimelineProps, pct(), toDay() (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (8): CHIP_CONFIG, AVATAR_COLORS, SECTION_BAR_COLOR, SituationBadges(), TYPE_COLOR, getBarColor(), ProgressBar(), ProgressBarProps

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (12): ContextSection(), areComplexityFactorsRequired(), getCategoryCode(), getCategoryColor(), getCategoryName(), isComplexityValid(), validateFormState(), ActionForm() (+4 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (11): buildFormData(), getDefaultDateTimeLocal(), fetchActiveUsers(), fetchOpenInterventions(), fetchOpenInterventionsByEquipement(), fetchWeekActions(), GROUP_LABELS, InterventionCreatorFlow() (+3 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (5): EVENT_COLORS, EVENT_OPTIONS, COLUMNS, COLUMNS, columns

### Community 20 - "Community 20"
Cohesion: 0.16
Nodes (15): apiCall(), APIError, AuthenticationError, buildErrorDTO(), ConflictError, createTypedError(), ERROR_TYPE_MAP, extractErrorMessage() (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.15
Nodes (8): createInterventionRequest(), fetchInterventionRequest(), repairInterventionRequests(), transitionInterventionRequest(), INITIAL_FORM, useRequestLinking(), columns, ELLIPSIS

### Community 22 - "Community 22"
Cohesion: 0.23
Nodes (15): actionDurationMinutes(), addDays(), formatDayHeader(), formatDayHeaderShort(), formatDuration(), formatTime(), formatWeekLabel(), getMondayOf() (+7 more)

### Community 23 - "Community 23"
Cohesion: 0.16
Nodes (9): ActionTaskSection(), deriveInitials(), getAssigneeLabel(), getDueDateColor(), TaskRow(), TasksTab(), STATUS_LABEL, UseTaskCreateOptions (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.17
Nodes (12): _auditConfigCache, cacheAuditFromResponse(), getAuditEntityType(), handleAuditError(), isAuditRequiredError(), _retryWithReason(), _subscribers, _URL_ENTITY_MAP (+4 more)

### Community 25 - "Community 25"
Cohesion: 0.23
Nodes (9): mapInterventionDetailResponse(), mapInterventionResponse(), createIntervention(), deleteIntervention(), fetchIntervention(), updateIntervention(), updateInterventionStatus(), fetchInterventionTasksByOccurrence() (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.21
Nodes (5): extractApiErrorMessage(), createPurchaseRequest(), DiOnlyPanel(), NOTIFICATION_TYPES, TYPE_CONFIG

### Community 27 - "Community 27"
Cohesion: 0.21
Nodes (7): createStockFamily(), fetchStockFamilies(), fetchStockFamilyDetail(), fetchStockSubFamily(), updateStockFamily(), updateStockSubFamily(), columns

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (8): ROLE_COLORS, usePermissionAudit(), useRolesMatrix(), fetchAdminRoles(), fetchPermissionAudit(), fetchRolePermissions(), fetchRolesMatrix(), updatePermission()

### Community 29 - "Community 29"
Cohesion: 0.13
Nodes (6): patchInterventionTask(), ORIGIN_CONFIG, SORT_ORDER, STATUS_CONFIG, STATUS_COLOR, STATUS_LABEL

### Community 31 - "Community 31"
Cohesion: 0.18
Nodes (3): KNOWN_UNITS_SET, resolveUnitForItem(), UNIT_OPTIONS

### Community 32 - "Community 32"
Cohesion: 0.21
Nodes (8): fetchAllAuditReasonCodes(), fetchAuditLogs(), collectAuditLogs(), DECISION_LABELS, EmptyState(), IvBody(), IvBodyProps, STATUS_GROUP_CFG

### Community 33 - "Community 33"
Cohesion: 0.16
Nodes (8): createStockItem(), deleteStockItem(), fetchStockItems(), updateStockItem(), DEFAULTS, fromItem(), charsToForm(), generatePattern()

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (6): DECISION_LABELS, ORIGIN_CFG, PRIORITY_CFG, TASK_STATUS_CFG, TaskCard(), useEnrichedActions()

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (10): hexBadgeStyle(), INTERVENTION_STATUS_COLORS, PURCHASE_URGENCY, OrderStatusBadge(), AGE_COLOR, StatusBadge(), ARCHIVE_STATUSES, ArchiveFilters() (+2 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (3): DEFAULT_COLUMNS, getCardMeta(), normalizeKey()

### Community 38 - "Community 38"
Cohesion: 0.24
Nodes (5): fetchComplexityFactors(), fetchComplexityFactors(), PILL_COLORS, HomeSplit(), todayIso()

### Community 40 - "Community 40"
Cohesion: 0.18
Nodes (3): PageHeader(), DEFAULT_OPTIONS, DEFAULT_OPTIONS

### Community 41 - "Community 41"
Cohesion: 0.29
Nodes (6): ENTITY_LABELS, RULE_DESCRIPTIONS, SEVERITY_CONFIG, EntitySection(), NoProblemsMessage(), SynthesisCards()

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (4): BANNER_STYLE, FilterStats(), PERIODS, pluralize()

### Community 43 - "Community 43"
Cohesion: 0.20
Nodes (3): METHOD_COLORS, ErrorState(), LINK_STYLE

### Community 45 - "Community 45"
Cohesion: 0.27
Nodes (5): clearSystemError(), emitSystemError(), onSystemError(), subscribers, STATUS_MESSAGES

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (4): enrichSituation(), getDaysOpen(), PRIORITY_ORDER, today

### Community 47 - "Community 47"
Cohesion: 0.20
Nodes (4): FIELD_TYPE_COLOR, FIELD_TYPE_LABEL, columns, DEFAULTS

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (6): DECISION_LABELS, EMPTY_FILTERS, ENTITY_COLORS, ENTITY_LABELS, _serializeDiff(), ValueDiff()

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (4): DI_STATUT_COLORS, DI_STATUT_LABELS, STATUS_COLORS, STATUS_LABELS

### Community 51 - "Community 51"
Cohesion: 0.25
Nodes (4): PlanItem(), PreventivePage(), triggerLabel(), empty

### Community 52 - "Community 52"
Cohesion: 0.43
Nodes (5): createPreventivePlan(), deletePreventivePlan(), fetchPreventivePlan(), patchPreventivePlanSteps(), updatePreventivePlan()

### Community 53 - "Community 53"
Cohesion: 0.29
Nodes (6): deletePurchaseRequest(), dispatchPurchaseRequests(), fetchPurchaseRequestsByIntervention(), updatePurchaseRequest(), fetchPurchaseRequests(), COLUMNS

### Community 57 - "Community 57"
Cohesion: 0.25
Nodes (7): DI_STATUT_COLORS, DI_STATUT_LABELS, STATUS_COLORS, STATUS_LABELS, STEP_STATUS_COLORS, STEP_STATUS_LABELS, stepColumns

### Community 61 - "Community 61"
Cohesion: 0.52
Nodes (5): fetchServiceStatus(), mapServiceStatusResponse(), mapSiteConsumption(), mapTopCauses(), toNumber()

### Community 63 - "Community 63"
Cohesion: 0.38
Nodes (6): completionFromProgress(), fmtDate(), PRIORITY_CFG, STATUS_CFG_MAP, useCardActions(), useCardDisplay()

### Community 66 - "Community 66"
Cohesion: 0.60
Nodes (4): useApiKeys(), useEmailDomainRules(), useIpBlocklist(), useSecurityLogs()

### Community 67 - "Community 67"
Cohesion: 0.60
Nodes (4): fetchPreventiveOccurrences(), generatePreventiveOccurrences(), repairPreventiveOccurrences(), skipPreventiveOccurrence()

### Community 68 - "Community 68"
Cohesion: 0.53
Nodes (3): filterBySearch(), normalizeText(), searchInText()

### Community 71 - "Community 71"
Cohesion: 0.70
Nodes (3): fetchAdminEndpoints(), syncAdminEndpoints(), updateAdminEndpoint()

### Community 72 - "Community 72"
Cohesion: 0.70
Nodes (4): createAction(), fetchAction(), mapActionResponse(), updateAction()

### Community 73 - "Community 73"
Cohesion: 0.70
Nodes (3): createPartTemplate(), deletePartTemplate(), fetchPartTemplate()

### Community 80 - "Community 80"
Cohesion: 0.70
Nodes (3): parseHtmlSafe(), sanitizeHtml(), truncateHtml()

### Community 81 - "Community 81"
Cohesion: 0.60
Nodes (3): getDefaultSpecText(), getDefaultSpecTitle(), getFullSpecification()

### Community 84 - "Community 84"
Cohesion: 0.83
Nodes (3): formatDate(), OccurrencesSummary(), PlanItem()

## Knowledge Gaps
- **187 isolated node(s):** `_cache`, `AuthContext`, `AuthContext`, `METHOD_COLORS`, `ROLE_COLORS` (+182 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `api` connect `Community 24` to `Community 1`, `Community 2`, `Community 6`, `Community 7`, `Community 9`, `Community 12`, `Community 13`, `Community 17`, `Community 19`, `Community 21`, `Community 25`, `Community 27`, `Community 28`, `Community 32`, `Community 38`, `Community 39`, `Community 52`, `Community 60`, `Community 61`, `Community 67`, `Community 71`, `Community 72`, `Community 73`, `Community 74`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `extractApiErrorMessage()` connect `Community 26` to `Community 1`, `Community 2`, `Community 6`, `Community 9`, `Community 12`, `Community 13`, `Community 19`, `Community 21`, `Community 23`, `Community 25`, `Community 27`, `Community 28`, `Community 33`, `Community 38`, `Community 43`, `Community 45`, `Community 46`, `Community 49`, `Community 52`, `Community 61`, `Community 66`, `Community 67`, `Community 71`, `Community 73`, `Community 74`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **What connects `_cache`, `AuthContext`, `AuthContext` to the rest of the system?**
  _187 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05012531328320802 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.052244897959183675 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.052854122621564484 - nodes in this community are weakly interconnected._