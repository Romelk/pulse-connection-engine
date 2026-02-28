// ============ ENUMS ============

export type MachineStatus = 'ACTIVE' | 'IDLE' | 'WARNING' | 'DOWN' | 'MAINTENANCE';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'SYSTEM';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type OperationStatus = 'in_progress' | 'resolved' | 'critical_override' | 'escalated';
export type SchemeLevel = 'central' | 'state';

// ============ CORE ENTITIES ============

export interface Plant {
  id: number;
  name: string;
  location: string;
  state: string;
  udyam_number: string | null;
  udyam_verified: boolean;
  udyam_tier: 'Micro' | 'Small' | 'Medium' | null;
  udyam_category: string | null;
  overall_health: number;
  status: 'stable' | 'warning' | 'critical';
  last_ai_sync: string | null;
}

export interface Shift {
  id: number;
  plant_id: number;
  name: string;
  start_time: string;
  end_time: string;
  is_current: boolean;
}

export interface Machine {
  id: number;
  machine_id: string;
  name: string;
  type: string;
  plant_id: number;
  department: string;
  status: MachineStatus;
  load_percentage: number;
  efficiency: number;
  temperature: number | null;
  vibration_level: number | null;
  icon_type: string;
  notes: string | null;
  alert_id?: number | null;
  purchase_cost?: number | null;
  hourly_downtime_cost?: number | null;
  planned_hours_per_day?: number | null;
  sensor_configs?: string | null;
  economics_configured?: number;
}

export interface Alert {
  id: number;
  alert_id: string;
  plant_id: number;
  machine_id: number | null;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  production_impact: number | null;
  ai_confidence: number | null;
  ai_recommendation: string | null;
  sensor_id: string | null;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
}

export interface AlertDetail extends Alert {
  machine: Machine | null;
  previousIncidents: Alert[];
  spareParts: {
    available: boolean;
    items: string;
  };
  assignedPersonnel: {
    name: string;
    role: string;
    initials: string;
  };
}

export interface RiskAssessment {
  id: number;
  plant_id: number;
  title: string;
  description: string;
  risk_level: RiskLevel;
  badge_text: string;
  icon_type: string;
  is_active: boolean;
  created_at: string;
}

export interface AIRecommendation {
  id: number;
  alert_id: number;
  priority: string;
  category: string;
  title: string;
  explanation: string;
  uptime_gain: string;
  cost_avoidance: number;
  why_reasons: WhyReason[];
  confidence_score: number;
  created_at: string;
  linked_policies?: LinkedPolicyRecommendation;
}

// ============ LINKED POLICY TYPES (Multi-Agent Integration) ============

export interface LinkedPolicyScheme {
  name: string;
  ministry: string;
  level: 'central' | 'state';
  max_benefit: number;
  benefit_type: string;
  description: string;
  eligibility_criteria: string[];
  priority_match: boolean;
}

export interface LinkedPolicyRecommendation {
  id: number;
  schemes: LinkedPolicyScheme[];
  totalPotentialBenefit: number;
  priorityMatchCount: number;
  whatsappMessage: string;
  status: 'pending' | 'viewed' | 'applied' | 'dismissed';
  createdAt: string;
}

export interface WhyReason {
  icon: string;
  title: string;
  description: string;
}

export interface GovernmentScheme {
  id: number;
  name: string;
  short_name: string | null;
  ministry: string;
  level: SchemeLevel;
  state: string | null;
  max_benefit: number | null;
  benefit_type: string | null;
  benefit_unit: string | null;
  description: string;
  eligibility_criteria: string[];
  tags: string[];
  priority_match: boolean;
  is_active: boolean;
  is_saved: boolean;
}

export interface TimelineEntry {
  id: number;
  operationId: string;
  timestamp: string;
  machine: {
    id: number;
    machineId: string;
    name: string;
  };
  alertId: string | null;
  status: OperationStatus;
  aiRecommendation: {
    text: string;
    severity: 'info' | 'warning' | 'critical';
  };
  actionTaken: {
    text: string;
    user: string;
  } | null;
  outcome: string | null;
  recoveryTime: number | null;
}

// ============ API RESPONSE TYPES ============

export interface DashboardOverview {
  plant: Plant;
  currentShift: Shift | null;
  overallHealth: number;
  status: 'stable' | 'warning' | 'critical';
  lastAiSync: string | null;
  pulse: 'Normal' | 'Elevated' | 'Critical';
  totalLosses30d: number;
  schemesAvailable: boolean;
}

export interface MachineStatusOverview {
  active: number;
  idle: number;
  down: number;
  warning: number;
  maintenance: number;
  machines: Machine[];
}

export interface PolicySummary {
  potentialSubsidy: {
    amount: number;
    comparison: number;
    comparisonLabel: string;
  };
  eligibleSchemes: {
    count: number;
    centralCount: number;
    stateCount: number;
  };
  successRate: {
    percentage: number;
    label: string;
  };
}

export interface OperationsMetrics {
  totalActions: {
    count: number;
    comparison: number;
    comparisonLabel: string;
  };
  resolutionRate: {
    percentage: number;
    comparison: number;
    comparisonLabel: string;
  };
  avgRecoveryTime: {
    minutes: number;
    comparison: number;
    comparisonLabel: string;
  };
}

export interface UdyamStatus {
  verified: boolean;
  tier: string | null;
  category: string | null;
  state: string;
  udyamNumber: string | null;
}

export interface SchemeApplication {
  id: number;
  scheme_id: number;
  scheme_name: string;
  ministry: string;
  short_name: string | null;
  max_benefit: number | null;
  plant_id: number;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  company_name: string | null;
  udyam_number: string | null;
  udyam_tier: string | null;
  state: string | null;
  industry: string | null;
  machine_count: number | null;
  purpose: string | null;
  estimated_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
