import greenProductsData from '../../../backend/green_products_mock_data.json';
// ═══════════════════════════════════════════════════════════════════════════
// DecaESG API Service Layer
// ═══════════════════════════════════════════════════════════════════════════
//
// This module provides a complete API integration layer. When USE_MOCK is true,
// all functions return rich stub data. When USE_MOCK is false, they make real
// HTTP requests to the endpoints defined in ENDPOINTS below.
//
// To enable real API calls:
//   1. Set VITE_API_BASE_URL in .env (e.g. https://api.yourdomain.com)
//   2. Set VITE_USE_MOCK=false in .env
// ═══════════════════════════════════════════════════════════════════════════

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ─── Endpoint Definitions ───────────────────────────────────────────────────
// Every endpoint the application needs. Used by the real fetch layer when
// USE_MOCK is false. Documented here so backend teams can build against them.

export const ENDPOINTS = {
  // User & auth
  getCurrentUser:        { method: 'GET',    path: '/user/me' },
  updateUserProfile:     { method: 'PATCH',  path: '/user/me' },
  getUserSettings:       { method: 'GET',    path: '/user/settings' },
  updateUserSettings:    { method: 'PATCH',  path: '/user/settings' },

  // Dashboard
  getDashboardSummary:   { method: 'GET',    path: '/dashboard/summary' },
  getDashboardTrends:    { method: 'GET',    path: '/dashboard/trends' },

  // Carbon footprint
  getCarbonFootprint:    { method: 'GET',    path: '/carbon-footprint' },
  getCarbonTrend:        { method: 'GET',    path: '/carbon-footprint/trend' },
  getCarbonByCategory:   { method: 'GET',    path: '/carbon-footprint/categories' },
  getCarbonBenchmarks:   { method: 'GET',    path: '/carbon-footprint/benchmarks' },
  logCarbonActivity:     { method: 'POST',   path: '/carbon-footprint/activities' },

  // MCC Data & Mapping
  getDistinctMCCs:       { method: 'GET',    path: '/carbon-footprint/mcc/distinct' },
  getMCCByCategory:      { method: 'GET',    path: '/carbon-footprint/mcc/categories' },
  getMCCStats:           { method: 'GET',    path: '/carbon-footprint/mcc/stats' },

  // Recommendations
  getRecommendations:    { method: 'GET',    path: '/recommendations' },
  dismissRecommendation: { method: 'GET',    path: '/recommendations/:id/dismiss' },
  applyRecommendation:   { method: 'POST',   path: '/recommendations/:id/apply' },

  // Green financing & products
  getGreenFinancing:     { method: 'GET',    path: '/green-products' },
  getGreenProducts:      { method: 'GET',    path: '/green-products' },
  getGreenFinancingCompare: { method: 'GET',  path: '/green-financing/compare' },
  applyGreenProduct:     { method: 'POST',   path: '/green-financing/products/:id/apply' },

  // ESG insights
  getESGInsights:        { method: 'GET',    path: '/esg-insights' },
  getESGRadarScores:     { method: 'GET',    path: '/esg-insights/radar' },
  getScopeEmissions:     { method: 'GET',    path: '/esg-insights/scopes' },
  getRegulatoryCompliance:{ method: 'GET',    path: '/esg-insights/regulatory' },
  getPriorityActions:    { method: 'GET',    path: '/esg-insights/priority-actions' },

  // Goals & targets
  getGoals:              { method: 'GET',    path: '/goals' },
  createGoal:            { method: 'POST',   path: '/goals' },
  updateGoal:            { method: 'PATCH',  path: '/goals/:id' },
  deleteGoal:            { method: 'DELETE',  path: '/goals/:id' },

  // Activity log
  getActivityLog:         { method: 'GET',    path: '/activities' },
};

// ─── HTTP Helper ─────────────────────────────────────────────────────────────

async function apiRequest(endpoint, { params, body } = {}) {
  let path = endpoint.path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, encodeURIComponent(value));
    });
  }
  const options = {
    method: endpoint.method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockUser = {
  id: 'usr_001',
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  initials: 'JS',
  company: 'GreenTech Solutions Ltd',
  role: 'Sustainability Lead',
  joinedAt: '2025-01-15',
};

const mockDashboardSummary = {
  totalEmissions: 620,
  emissionsUnit: 'kg CO₂e',
  emissionsChangePct: -5.2,
  monthlyTarget: 500,
  targetProgressPct: 76,
  activeRecommendations: 4,
  potentialSavings: 490,
  esgScore: 72,
  esgScoreChange: +3,
  goalsOnTrack: 3,
  totalGoals: 5,
  greenProductsAvailable: 4,
  streakDays: 28,
};

const mockDashboardTrends = [
  { month: 'Feb', emissions: 720, target: 550 },
  { month: 'Mar', emissions: 680, target: 550 },
  { month: 'Apr', emissions: 710, target: 540 },
  { month: 'May', emissions: 655, target: 530 },
  { month: 'Jun', emissions: 638, target: 520 },
  { month: 'Jul', emissions: 620, target: 500 },
];

const mockCarbonFootprint = {
  kgThisMonth: 620,
  kgLastMonth: 638,
  vsNationalAverage: -26,
  vsLastMonth: -2.8,
  topEmissionCategory: 'Transport',
  categoryBreakdown: [
    { label: 'Transport', value: 38, color: '#16a34a' },
    { label: 'Food & Drink', value: 22, color: '#f97316' },
    { label: 'Utilities', value: 15, color: '#3b82f6' },
    { label: 'Travel', value: 10, color: '#8b5cf6' },
    { label: 'Groceries', value: 9, color: '#ec4899' },
    { label: 'Other', value: 6, color: '#94a3b8' },
  ],
  sixMonthTrend: [
    { month: 'Feb 2026', value: 720 },
    { month: 'Mar 2026', value: 680 },
    { month: 'Apr 2026', value: 710 },
    { month: 'May 2026', value: 655 },
    { month: 'Jun 2026', value: 638 },
    { month: 'Jul 2026', value: 620 },
  ],
  benchmarks: {
    yourFootprint: 620,
    nationalAverage: 833,
    euTarget: 500,
    parisAgreementTarget: 430,
    maxScale: 1200,
  },
  weeklyBreakdown: [
    { week: 'W1', transport: 42, food: 28, utilities: 18, travel: 12 },
    { week: 'W2', transport: 38, food: 24, utilities: 16, travel: 14 },
    { week: 'W3', transport: 35, food: 22, utilities: 14, travel: 8 },
    { week: 'W4', transport: 37, food: 20, utilities: 12, travel: 6 },
  ],
};

const mockRecommendations = [
  {
    id: 'rec-1',
    icon: 'train',
    title: 'Switch Short-Haul Flights to Train',
    category: 'Transport',
    priority: 'high',
    description:
      'Short-haul flights generate approximately 20x more CO₂e per km than trains. Switching one return flight within Europe saves 200-400 kg CO₂e.',
    savingKg: 310,
    savingPct: 50,
    difficulty: 'easy',
    timeframe: '1-2 weeks',
    ctaLabel: 'Explore Rail Options',
    ctaLink: '#',
  },
  {
    id: 'rec-2',
    icon: 'leaf',
    title: 'Reduce Meat Consumption',
    category: 'Food & Drink',
    priority: 'medium',
    description:
      'Your food spending suggests a high-meat diet. Replacing 2 meat meals/week with plant-based options cuts food emissions by approximately 25%.',
    savingKg: 37,
    savingPct: 27,
    difficulty: 'easy',
    timeframe: 'Immediate',
    ctaLabel: 'Sustainable Diet Tips',
    ctaLink: '#',
  },
  {
    id: 'rec-3',
    icon: 'zap',
    title: 'Switch to Renewable Energy Tariff',
    category: 'Utilities',
    priority: 'high',
    description:
      'Your utility provider emits above the national grid average. Switching to a 100% renewable tariff could eliminate your Scope 2 household emissions.',
    savingKg: 75,
    savingPct: 100,
    difficulty: 'medium',
    timeframe: '2-4 weeks',
    ctaLabel: 'View Green Energy Loans',
    ctaLink: '#',
  },
  {
    id: 'rec-4',
    icon: 'bike',
    title: 'Cycle or Use Public Transport for Short Journeys',
    category: 'Transport',
    priority: 'medium',
    description:
      'Your transport spending is your #1 emission source. Replacing car trips under 5 km with cycling or public transport saves ~35% of transport emissions.',
    savingKg: 68,
    savingPct: 35,
    difficulty: 'easy',
    timeframe: 'Immediate',
    ctaLabel: 'Find Bike Loans',
    ctaLink: '#',
  },
];

// Adapter: converts a raw product from green_products_mock_data.json into
// the shape expected by the GreenFinancing UI component.
function adaptGreenProduct(p) {
  const fin = p.financials || {};
  const esg = p.esgCriteria || {};

  const rateStr = fin.interestRateMin
    ? `${fin.interestRateMin}% – ${fin.interestRateMax}% p.a.`
    : fin.rateType === 'ADVISORY_FEE_BASED'
    ? 'Advisory Fee'
    : 'N/A';

  const co2Saving = esg.estimatedAnnualCO2ReductionKg
    ? `~${esg.estimatedAnnualCO2ReductionKg.toLocaleString('en-IN')} kg CO₂e saved/year`
    : `ESG Category: ${esg.esgCategory || 'Sustainable Finance'}`;

  const badge = (esg.certificationRequired || [])[0] || esg.esgCategory || 'ESG Aligned';

  let term = 'Flexible';
  if (fin.tenureMonthsMin) {
    const minYr = fin.tenureMonthsMin / 12;
    const maxYr = (fin.tenureMonthsMax || fin.tenureMonthsMin) / 12;
    term = minYr >= 1
      ? `${Number.isInteger(minYr) ? minYr : minYr.toFixed(1)}–${Number.isInteger(maxYr) ? maxYr : maxYr.toFixed(1)} yrs`
      : `${fin.tenureMonthsMin}–${fin.tenureMonthsMax || fin.tenureMonthsMin} mos`;
  }

  return {
    id: p.productId,
    type: (p.subCategory || p.category || '').replace(/_/g, ' '),
    name: p.productName,
    customerType: p.customerType,
    category: p.category,
    rate: rateStr,
    rateValue: fin.interestRateMin || 0,
    description: p.description,
    co2Saving,
    badge,
    minAmount: fin.loanAmountMin || 0,
    maxAmount: fin.loanAmountMax || 0,
    term,
    features: p.features || [],
    sdgAlignment: esg.sdgAlignment || [],
    status: p.status,
  };
}

const mockGreenFinancing = (greenProductsData.products || []).map(adaptGreenProduct);

const mockESGInsights = {
  radarScores: {
    yourScore: { environmental: 72, social: 55, governance: 68 },
    industryAverage: { environmental: 58, social: 62, governance: 54 },
  },
  scopeEmissions: {
    scope1: { label: 'Direct emissions', value: 120, color: '#16a34a' },
    scope2: { label: 'Purchased energy', value: 45, color: '#3b82f6' },
    scope3: { label: 'Value chain', value: 380, color: '#8b5cf6' },
  },
  scopeTrend: [
    { month: 'Jan', scope1: 140, scope2: 55, scope3: 420 },
    { month: 'Feb', scope1: 135, scope2: 52, scope3: 410 },
    { month: 'Mar', scope1: 130, scope2: 50, scope3: 400 },
    { month: 'Apr', scope1: 128, scope2: 48, scope3: 395 },
    { month: 'May', scope1: 125, scope2: 47, scope3: 390 },
    { month: 'Jun', scope1: 122, scope2: 46, scope3: 385 },
    { month: 'Jul', scope1: 120, scope2: 45, scope3: 380 },
  ],
  regulatoryCompliance: [
    {
      id: 'rc-1',
      name: 'CSRD Reporting',
      status: 'Applicable - large undertaking',
      color: 'yellow',
      deadline: '2026-12-31',
      description: 'Corporate Sustainability Reporting Directive requires detailed ESG disclosure.',
    },
    {
      id: 'rc-2',
      name: 'EU Taxonomy Disclosure',
      status: 'Required - assess alignment',
      color: 'yellow',
      deadline: '2026-06-30',
      description: 'Disclose share of business activities aligned with EU Taxonomy.',
    },
    {
      id: 'rc-3',
      name: 'SFDR Article 8',
      status: 'Review product classification',
      color: 'green',
      deadline: '2026-03-31',
      description: 'Sustainable Finance Disclosure Regulation product classification.',
    },
  ],
  priorityActions: [
    'Measure and disclose Scope 1 & 2 GHG emissions',
    'Conduct Scope 3 screening across the value chain',
    'Set a Science Based Target (SBTi) net-zero commitment',
    'Increase renewable energy usage - explore PPAs',
    'Publish annual sustainability report aligned with GRI/ESRS',
  ],
  esgScoreHistory: [
    { month: 'Jan', score: 65 },
    { month: 'Feb', score: 66 },
    { month: 'Mar', score: 67 },
    { month: 'Apr', score: 69 },
    { month: 'May', score: 70 },
    { month: 'Jun', score: 71 },
    { month: 'Jul', score: 72 },
  ],
};

const mockGoals = [
  { id: 'goal-1', title: 'Reduce monthly emissions to 500 kg', current: 620, target: 500, unit: 'kg CO₂e', deadline: '2026-12-31', progress: 76, status: 'on-track' },
  { id: 'goal-2', title: 'Switch to 100% renewable electricity', current: 40, target: 100, unit: '%', deadline: '2026-09-30', progress: 40, status: 'on-track' },
  { id: 'goal-3', title: 'Replace 50% of car trips with cycling', current: 15, target: 50, unit: '%', deadline: '2026-12-31', progress: 30, status: 'behind' },
  { id: 'goal-4', title: 'Plant-based meals 4x/week', current: 2, target: 4, unit: 'meals/wk', deadline: '2026-08-31', progress: 50, status: 'on-track' },
  { id: 'goal-5', title: 'Zero short-haul flights', current: 1, target: 0, unit: 'flights/yr', deadline: '2026-12-31', progress: 0, status: 'behind' },
];

const mockActivityLog = [
  { id: 'act-1', date: '2026-07-22', action: 'Logged cycling commute', impact: '-5 kg CO₂e', category: 'Transport' },
  { id: 'act-2', date: '2026-07-21', action: 'Switched to plant-based lunch', impact: '-2 kg CO₂e', category: 'Food' },
  { id: 'act-3', date: '2026-07-20', action: 'Completed ESG assessment', impact: 'Score updated', category: 'ESG' },
  { id: 'act-4', date: '2026-07-19', action: 'Applied for EV loan', impact: 'Pending review', category: 'Financing' },
  { id: 'act-5', date: '2026-07-18', action: 'Set new emissions goal', impact: 'Target: 500 kg/mo', category: 'Goals' },
];

// ─── API Functions ──────────────────────────────────────────────────────────

// User
export async function getCurrentUser() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getCurrentUser);
  return mockUser;
}

export async function updateUserProfile(body) {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.updateUserProfile, { body });
  return { ...mockUser, ...body };
}

// Dashboard
export async function getDashboardSummary() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getDashboardSummary);
  return mockDashboardSummary;
}

export async function getDashboardTrends() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getDashboardTrends);
  return mockDashboardTrends;
}

// Carbon footprint
export async function getCarbonFootprint() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getCarbonFootprint);
  return mockCarbonFootprint;
}

export async function getCarbonTrend() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getCarbonTrend);
  return mockCarbonFootprint.sixMonthTrend;
}

export async function getCarbonByCategory() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getCarbonByCategory);
  return mockCarbonFootprint.categoryBreakdown;
}

export async function getCarbonBenchmarks() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getCarbonBenchmarks);
  return mockCarbonFootprint.benchmarks;
}

export async function logCarbonActivity(body) {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.logCarbonActivity, { body });
  return { success: true, id: 'act-new' };
}

// MCC Data & Carbon Mapping
export async function getDistinctMCCs() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getDistinctMCCs);
  // Mock data structure: array of MCC objects with category and emission factor
  return [];
}

export async function getMCCByCategory() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getMCCByCategory);
  // Returns object with categories as keys and arrays of MCCs as values
  return {};
}

export async function getMCCStats() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getMCCStats);
  // Returns statistics about MCC codes in the data
  return {
    totalDistinctMCCs: 0,
    totalCategories: 0,
    totalTransactions: 0,
    categories: [],
    emissionFactorRange: { min: 0, max: 0 }
  };
}

// Recommendations
export async function getRecommendations() {
  if (!USE_MOCK) {
    const res = await apiRequest(ENDPOINTS.getRecommendations);
    return Array.isArray(res) ? res : (res.recommendations || res.products || []);
  }
  return mockRecommendations;
}

export async function dismissRecommendation(id) {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.dismissRecommendation, { params: { id } });
  return { success: true };
}

export async function applyRecommendation(id) {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.applyRecommendation, { params: { id } });
  return { success: true };
}

// Green financing
export async function getGreenFinancing() {
  if (!USE_MOCK) {
    const res = await apiRequest(ENDPOINTS.getGreenFinancing);
    const rawProducts = Array.isArray(res) ? res : (res.products || res.data || []);
    
    // Adapt new schema to the UI expected schema
    return rawProducts.map(p => {
      if (p.productId) {
        return {
          ...p,
          id: p.productId,
          type: (p.subCategory || p.category || '').replace(/_/g, ' '),
          name: p.productName,
          rate: p.financials?.interestRateMin ? `From ${p.financials.interestRateMin}%` : (p.financials?.rateType === 'ADVISORY_FEE_BASED' ? 'Advisory Fee' : 'N/A'),
          rateValue: p.financials?.interestRateMin || 0,
          description: p.description,
          co2Saving: p.esgCriteria?.estimatedAnnualCO2ReductionKg ? `~${p.esgCriteria.estimatedAnnualCO2ReductionKg.toLocaleString()} kg CO₂e/yr` : 'ESG Aligned Impact',
          badge: (p.esgCriteria?.certificationRequired || [])[0] || 'EU Taxonomy Aligned',
          minAmount: p.financials?.loanAmountMin || 0,
          maxAmount: p.financials?.loanAmountMax || 0,
          term: p.financials?.tenureMonthsMin ? (
            p.financials.tenureMonthsMin >= 12
              ? `${Math.floor(p.financials.tenureMonthsMin / 12)}-${Math.floor((p.financials.tenureMonthsMax || p.financials.tenureMonthsMin) / 12)} yrs`
              : `${p.financials.tenureMonthsMin}-${p.financials.tenureMonthsMax || p.financials.tenureMonthsMin} mos`
          ) : 'Flexible',
          features: p.features || [],
        };
      }
      return p;
    });
  }
  return mockGreenFinancing;
}

export async function applyGreenProduct(id) {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.applyGreenProduct, { params: { id } });
  return { success: true, applicationId: 'app-' + Date.now() };
}

// ESG insights
export async function getESGInsights() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getESGInsights);
  return mockESGInsights;
}

export async function getScopeEmissions() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getScopeEmissions);
  return mockESGInsights.scopeEmissions;
}

export async function getRegulatoryCompliance() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getRegulatoryCompliance);
  return mockESGInsights.regulatoryCompliance;
}

export async function getPriorityActions() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getPriorityActions);
  return mockESGInsights.priorityActions;
}

// Goals
export async function getGoals() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getGoals);
  return mockGoals;
}

export async function createGoal(body) {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.createGoal, { body });
  return { ...body, id: 'goal-' + Date.now(), progress: 0, status: 'on-track' };
}

export async function updateGoal(id, body) {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.updateGoal, { params: { id }, body });
  return { success: true };
}

export async function deleteGoal(id) {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.deleteGoal, { params: { id } });
  return { success: true };
}

// Activity log
export async function getActivityLog() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getActivityLog);
  return mockActivityLog;
}
