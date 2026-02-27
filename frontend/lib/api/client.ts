const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getHeaders(): Record<string, string> {
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    if (typeof window !== 'undefined') {
      const u = JSON.parse(localStorage.getItem('pulseai_user') || 'null');
      if (u?.company_id) base['X-Company-Id'] = String(u.company_id);
    }
  } catch { /* ignore */ }
  return base;
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw Object.assign(new Error(`API Error: ${response.status}`), { status: response.status, body: errBody });
  }

  return response.json();
}

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    fetchAPI<{ id: number; email: string; name: string; role: 'super_admin' | 'local_admin'; company_id: number | null; company_name: string | null }>(
      '/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
};

// Admin API (Super Admin only)
export const adminAPI = {
  getCompanies: () => fetchAPI<any[]>('/api/admin/companies'),
  createCompany: (data: {
    name: string; industry?: string; location: string; state: string;
    udyam_number?: string; admin_name: string; admin_email: string; admin_password: string;
  }) => fetchAPI<{ company: any; localAdmin: any }>('/api/admin/companies', { method: 'POST', body: JSON.stringify(data) }),
  getCompanyStats: (id: number) => fetchAPI<any>(`/api/admin/companies/${id}`),
};

// Dashboard APIs
export const dashboardAPI = {
  getOverview: () => fetchAPI<import('@/lib/types').DashboardOverview>('/api/dashboard/overview'),
  getRisks: () => fetchAPI<import('@/lib/types').RiskAssessment[]>('/api/dashboard/risks'),
  runDiagnostics: () => fetchAPI<{ success: boolean; message: string }>('/api/dashboard/run-diagnostics', { method: 'POST' }),
};

// Machine APIs
export const machinesAPI = {
  getAll: () => fetchAPI<import('@/lib/types').MachineStatusOverview>('/api/machines'),
  getById: (id: number) => fetchAPI<import('@/lib/types').Machine>(`/api/machines/${id}`),
  updateStatus: (id: number, status: string) =>
    fetchAPI<import('@/lib/types').Machine>(`/api/machines/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// Alert APIs
export const alertsAPI = {
  getAll: (params?: { status?: string; severity?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.severity) searchParams.set('severity', params.severity);
    const query = searchParams.toString();
    return fetchAPI<import('@/lib/types').Alert[]>(`/api/alerts${query ? `?${query}` : ''}`);
  },
  getActive: () => fetchAPI<import('@/lib/types').Alert[]>('/api/alerts/active'),
  getById: (id: number) => fetchAPI<import('@/lib/types').AlertDetail>(`/api/alerts/${id}`),
  acknowledge: (id: number) => fetchAPI<import('@/lib/types').Alert>(`/api/alerts/${id}/acknowledge`, { method: 'POST' }),
  resolve: (id: number) => fetchAPI<import('@/lib/types').Alert>(`/api/alerts/${id}/resolve`, { method: 'POST' }),
  dismiss: (id: number) => fetchAPI<import('@/lib/types').Alert>(`/api/alerts/${id}/dismiss`, { method: 'POST' }),
  getRecommendation: (alertId: number) => fetchAPI<import('@/lib/types').AIRecommendation>(`/api/alerts/${alertId}/recommendation`),
};

// Policy APIs
export const policiesAPI = {
  getSchemes: () => fetchAPI<import('@/lib/types').GovernmentScheme[]>('/api/policies/schemes'),
  getSchemeById: (id: number) => fetchAPI<import('@/lib/types').GovernmentScheme>(`/api/policies/schemes/${id}`),
  getSummary: () => fetchAPI<import('@/lib/types').PolicySummary>('/api/policies/summary'),
  getUdyamStatus: () => fetchAPI<import('@/lib/types').UdyamStatus>('/api/policies/udyam-status'),
  saveScheme: (id: number) => fetchAPI<{ success: boolean }>(`/api/policies/schemes/${id}/save`, { method: 'POST' }),
  unsaveScheme: (id: number) => fetchAPI<{ success: boolean }>(`/api/policies/schemes/${id}/save`, { method: 'DELETE' }),
  getSavedSchemes: () => fetchAPI<import('@/lib/types').GovernmentScheme[]>('/api/policies/saved'),
  getApplications: () => fetchAPI<import('@/lib/types').SchemeApplication[]>('/api/policies/applications'),
  createApplication: (schemeId: number) => fetchAPI<import('@/lib/types').SchemeApplication>('/api/policies/applications', {
    method: 'POST', body: JSON.stringify({ scheme_id: schemeId }),
  }),
  updateApplication: (id: number, data: Partial<import('@/lib/types').SchemeApplication>) =>
    fetchAPI<import('@/lib/types').SchemeApplication>(`/api/policies/applications/${id}`, {
      method: 'PATCH', body: JSON.stringify(data),
    }),
};

// Operations APIs
export const operationsAPI = {
  getHistory: (params?: { machineId?: number; status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.machineId) searchParams.set('machineId', params.machineId.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return fetchAPI<import('@/lib/types').TimelineEntry[]>(`/api/operations/history${query ? `?${query}` : ''}`);
  },
  getMetrics: () => fetchAPI<import('@/lib/types').OperationsMetrics>('/api/operations/metrics'),
  logAction: (data: {
    machineId: number;
    alertId?: number;
    aiRecommendation: string;
    aiRecommendationSeverity?: string;
    actionTaken?: string;
    actionTakenBy?: string;
    outcome?: string;
    recoveryTimeMinutes?: number;
  }) => fetchAPI<{ success: boolean; operationId: string }>('/api/operations/log-action', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  exportCSV: () => `${API_BASE}/api/operations/export`,
};

// Simulator APIs
export const simulatorAPI = {
  getMachines: () => fetchAPI<{
    machines: Array<{
      id: number;
      machine_id: string;
      name: string;
      type: string;
      department: string;
      status: string;
      temperature: number | null;
      vibration_level: number | null;
      load_percentage: number | null;
    }>;
    thresholds: {
      temperature: { normal: { min: number; max: number }; warning: { min: number; max: number }; critical: { min: number; max: number } };
      vibration: { normal: { min: number; max: number }; warning: { min: number; max: number }; critical: { min: number; max: number } };
      load: { normal: { min: number; max: number }; warning: { min: number; max: number }; critical: { min: number; max: number } };
    };
  }>('/api/simulator/machines'),

  updateMachine: (data: { machineId: number; temperature: number; vibration: number; load: number }) =>
    fetchAPI<{
      success: boolean;
      machine: any;
      alerts: any[];
      statusChanged: boolean;
      previousStatus: string;
      newStatus: string;
      thresholds: any;
    }>('/api/simulator/update-machine', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetMachine: (machineId: number) =>
    fetchAPI<{ success: boolean; machine: any; alertsResolved: number }>('/api/simulator/reset-machine', {
      method: 'POST',
      body: JSON.stringify({ machineId }),
    }),

  resetAll: () =>
    fetchAPI<{ success: boolean; message: string }>('/api/simulator/reset-all', {
      method: 'POST',
    }),
};

// AI APIs
export const aiAPI = {
  matchPolicies: (operationalIssue: string) =>
    fetchAPI<{
      success: boolean;
      operationalIssue: string;
      plant: { name: string; state: string; tier: string };
      schemes: any[];
      generatedAt: string;
    }>('/api/ai/match-policies', {
      method: 'POST',
      body: JSON.stringify({ operationalIssue }),
    }),

  getStatus: () =>
    fetchAPI<{
      enabled: boolean;
      provider: string;
      model: string;
      features: string[];
    }>('/api/ai/status'),

  // Linked Policies APIs (Multi-Agent Integration)
  getLinkedPolicies: (recommendationId: number) =>
    fetchAPI<import('@/lib/types').LinkedPolicyRecommendation>(
      `/api/ai/linked-policies/${recommendationId}`
    ),

  markPolicyApplied: (linkedPolicyId: number) =>
    fetchAPI<{ success: boolean; message: string }>(
      `/api/ai/linked-policies/${linkedPolicyId}/apply`,
      { method: 'POST' }
    ),

  getWhatsAppNotification: (alertId: number) =>
    fetchAPI<{ message: string; whatsappUrl: string }>(
      `/api/ai/whatsapp-notification/${alertId}`
    ),
};

// Scraper APIs
export const scraperAPI = {
  syncSchemes: () =>
    fetchAPI<{
      success: boolean;
      schemesUpdated: number;
      message: string;
      timestamp: string;
    }>('/api/scraper/sync-schemes', {
      method: 'POST',
    }),

  checkUpdates: () =>
    fetchAPI<{
      success: boolean;
      scraped: boolean;
      source?: string;
      fallback?: boolean;
      count: number;
      schemes?: Array<{ name: string; source: string }>;
      timestamp: string;
    }>('/api/scraper/check-updates'),

  getStatus: () =>
    fetchAPI<{
      success: boolean;
      needsSync: boolean;
      currentCount: number;
      availableCount: number;
      timestamp: string;
    }>('/api/scraper/status'),

  getVerifiedSchemes: () =>
    fetchAPI<{
      success: boolean;
      count: number;
      schemes: Array<{
        name: string;
        short_name: string;
        ministry: string;
        level: string;
        state: string | null;
        benefit_type: string;
        max_benefit: number;
        source_url: string;
      }>;
    }>('/api/scraper/verified-schemes'),
};

// Team Members APIs
export interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  email: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Telemetry APIs
export const telemetryAPI = {
  ingest: (data: { machine_id: number; readings: Array<{ sensor_type: string; value: number; unit?: string }> }) =>
    fetchAPI<{
      success: boolean;
      readingsStored: number;
      anomaliesDetected: number;
      alertsCreated: number;
      downtimeTriggered: boolean;
      anomalies: Array<{ sensor_type: string; value: number; severity: string; alert_id?: number }>;
      plantHealth: number;
      plantStatus: string;
    }>('/api/telemetry/ingest', { method: 'POST', body: JSON.stringify(data) }),

  getLatest: (machineId: number) =>
    fetchAPI<{
      machine_id: number;
      readings: Array<{ sensor_type: string; value: number; unit: string; is_anomaly: number; anomaly_severity: string | null; recorded_at: string }>;
    }>(`/api/telemetry/${machineId}/latest`),

  getHistory: (machineId: number, sensor: string, hours = 24) =>
    fetchAPI<{
      machine_id: number; sensor_type: string; hours: number;
      readings: Array<{ value: number; unit: string; is_anomaly: number; recorded_at: string }>;
    }>(`/api/telemetry/${machineId}/history?sensor=${sensor}&hours=${hours}`),
};

// Downtime APIs
export const downtimeAPI = {
  getActive: () => fetchAPI<any[]>('/api/downtime/active'),
  getHistory: () => fetchAPI<any[]>('/api/downtime/history'),
  getById: (id: number) => fetchAPI<any>(`/api/downtime/${id}`),
  create: (data: { machine_id: number; cause?: string; triggered_by_alert_id?: number }) =>
    fetchAPI<any>('/api/downtime', { method: 'POST', body: JSON.stringify(data) }),
  submitRepair: (id: number, data: { repair_cost: number; repair_description?: string; cause?: string }) =>
    fetchAPI<{
      success: boolean;
      costAnalysis: { repairCost: number; durationHours: number; productionLoss: number; totalLoss: number; thresholdBreached: boolean };
      schemeTriggered: boolean;
      schemeResult: any | null;
    }>(`/api/downtime/${id}/repair`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// Expansion Intent APIs
export const expansionAPI = {
  getAll: () => fetchAPI<any[]>('/api/expansion'),
  getById: (id: number) => fetchAPI<any>(`/api/expansion/${id}`),
  submitIntent: (data: {
    business_goal: string;
    investment_range?: string;
    timeline?: string;
    sector?: string;
    current_capacity?: string;
    target_capacity?: string;
    state?: string;
  }) => fetchAPI<any>('/api/expansion/intent', { method: 'POST', body: JSON.stringify(data) }),
};

// Machine Config APIs (additions to machinesAPI)
export const machineConfigAPI = {
  register: (data: {
    name: string; type: string; department?: string; icon_type?: string;
    purchase_cost?: number; hourly_downtime_cost?: number; planned_hours_per_day?: number;
    sensor_configs?: Array<{ sensor_type: string; unit: string; normal_min: number; normal_max: number; critical_max?: number }>;
    notes?: string;
  }) => fetchAPI<any>('/api/machines/register', { method: 'POST', body: JSON.stringify(data) }),

  updateConfig: (id: number, data: {
    purchase_cost?: number; hourly_downtime_cost?: number; planned_hours_per_day?: number;
    sensor_configs?: any[]; notes?: string; department?: string;
  }) => fetchAPI<any>(`/api/machines/${id}/config`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const teamAPI = {
  getAll: () => fetchAPI<TeamMember[]>('/api/team'),

  getById: (id: number) => fetchAPI<TeamMember>(`/api/team/${id}`),

  create: (data: { name: string; role: string; bio?: string; linkedin_url?: string; email?: string; display_order?: number }) =>
    fetchAPI<TeamMember>('/api/team', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<{ name: string; role: string; bio: string; photo_url: string; linkedin_url: string; email: string; display_order: number }>) =>
    fetchAPI<TeamMember>(`/api/team/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadPhoto: async (id: number, file: File): Promise<TeamMember> => {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch(`${API_BASE}/api/team/${id}/photo`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  delete: (id: number) => fetchAPI<{ success: boolean; message: string }>(`/api/team/${id}`, { method: 'DELETE' }),
};
