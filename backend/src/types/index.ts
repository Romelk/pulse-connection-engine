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
  industry: string | null;
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
  why_reasons: string; // JSON string array
  confidence_score: number;
  created_at: string;
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
  eligibility_criteria: string; // JSON string array
  tags: string; // JSON string array
  priority_match: boolean;
  is_active: boolean;
}

export interface OperationRecord {
  id: number;
  operation_id: string;
  plant_id: number;
  machine_id: number;
  alert_id: number | null;
  status: OperationStatus;
  ai_recommendation: string;
  ai_recommendation_severity: 'info' | 'warning' | 'critical';
  action_taken: string | null;
  action_taken_by: string | null;
  outcome: string | null;
  recovery_time_minutes: number | null;
  timestamp: string;
  resolved_at: string | null;
}

// ============ API RESPONSE TYPES ============

export interface DashboardOverview {
  plant: Plant;
  currentShift: Shift | null;
  overallHealth: number;
  status: 'stable' | 'warning' | 'critical';
  lastAiSync: string | null;
  pulse: 'Normal' | 'Elevated' | 'Critical';
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
