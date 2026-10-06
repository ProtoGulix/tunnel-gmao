// Types alignés sur mapInterventionDetailResponse (src/api/interventions.js)

export interface InterventionMachine {
  id: string;
  code: string;
  name: string;
  health: {
    level: 'ok' | 'warning' | 'critical';
    reason: string;
  };
}

export interface InterventionStats {
  actionCount: number;
  totalTime: number;
  avgComplexity: number;
  purchaseCount: number;
  purchasePending: number | null;
  tasks: {
    total: number;
    done: number;
    in_progress: number;
    todo: number;
    skipped: number;
  } | null;
  taskProgress: {
    total: number;
    done: number;
    in_progress: number;
    todo: number;
    skipped: number;
  } | null;
}

export interface TaskAssignedTo {
  id: string;
  first_name?: string;
  last_name?: string;
  initial?: string;
}

export interface InterventionTask {
  id: string;
  label: string;
  status: 'todo' | 'in_progress' | 'done' | 'skipped';
  optional?: boolean;
  sort_order?: number;
  due_date?: string | null;
  assigned_to?: TaskAssignedTo | null;
  origin?: 'plan' | 'resp' | 'tech';
  gamme_step_id?: string | null;
  skip_reason?: string | null;
  action_count?: number;
  time_spent?: number;
}

export interface ActionSubcategory {
  id: string;
  label: string;
  code: string;
  category: {
    id: string;
    label: string;
    code: string;
    color?: string;
  } | null;
}

export interface ActionTechnician {
  id: string;
  firstName: string;
  lastName: string;
  initial: string;
}

export interface PurchaseRequest {
  id?: string;
  code?: string;
  reference?: string;
  da_number?: string;
}

export interface InterventionAction {
  id: string;
  description: string;
  timeSpent: number;
  date: string | null;
  subcategory: ActionSubcategory | null;
  technician: ActionTechnician | null;
  purchaseRequests: PurchaseRequest[];
  // task est l'objet de liaison (id suffit)
  task: { id: string } | null;
  tasks: { id: string }[];
}

export interface StatusLog {
  id: string;
  date: string;
  status_to_detail: { id: string; label: string } | null;
  status_from_detail: { id: string; label: string } | null;
}

export interface InterventionUrgency {
  level: 'overdue' | 'urgent' | 'planned' | 'pending';
  label: string;
  color: string;
}

// Intervention enrichie par useBriefingData
export interface BriefingSituation {
  id: string;
  code: string;
  title: string;
  status: string;
  type: string;
  priority: 'urgent' | 'important' | 'normale' | 'normal' | 'faible';
  reportedDate: string | null;
  techInitials: string;
  machine: InterventionMachine | null;
  next_due_date: string | null;
  overdue: boolean;
  stats: InterventionStats | null;
  // enrichi par useBriefingData
  daysOpen: number;
  tasksLinked: InterventionTask[];
  urgency: InterventionUrgency;
  situationType: 'decision' | 'blocked_piece' | 'in_progress';
}

// Intervention complète chargée par fetchIntervention
export interface InterventionDetail extends BriefingSituation {
  action: InterventionAction[];
  statusLogs: StatusLog[];
  tasks: InterventionTask[];
  taskProgress: InterventionStats['taskProgress'];
  closedAt: string | null;
  closed_at: string | null;
  request: {
    id: string;
    code: string;
    demandeurNom: string;
    demandeurService: string | null;
    description: string;
    statut: string;
    statutLabel?: string;
    statutColor?: string;
    createdAt?: string;
    isSystem?: boolean;
  } | null;
}
