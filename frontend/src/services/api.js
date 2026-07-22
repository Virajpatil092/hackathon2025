// ═══════════════════════════════════════════════════════════════════════════
// ESGAdvisor API Service Layer
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

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

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

  // Recommendations
  getRecommendations:    { method: 'GET',    path: '/recommendations' },
  dismissRecommendation: { method: 'GET',    path: '/recommendations/:id/dismiss' },
  applyRecommendation:   { method: 'POST',   path: '/recommendations/:id/apply' },

  // Green financing
  getGreenFinancing:     { method: 'GET',    path: '/green-financing/products' },
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

const mockGreenFinancing = [
  {
    id: 'gf-1',
    type: 'GREEN MORTGAGE',
    name: 'EcoHome Green Mortgage',
    rate: 'From 3.0% APR',
    rateValue: 3.0,
    description:
      'Preferential mortgage for EPC A/B homes or energy retrofits improving efficiency by 30% or more.',
    co2Saving: '~3 tonnes CO₂e saved/year per household',
    badge: 'EU Taxonomy Aligned',
    minAmount: 50000,
    maxAmount: 500000,
    term: '5-30 years',
    features: ['No arrangement fee', 'Free EPC assessment', 'Cashback on completion'],
  },
  {
    id: 'gf-2',
    type: 'EV LOAN',
    name: 'Clean Drive EV Loan',
    rate: 'From 4.5% APR',
    rateValue: 4.5,
    description:
      'Zero-paperwork loan for electric or hydrogen vehicle purchases. 75bps below our standard personal loan.',
    co2Saving: '~2.1 tonnes CO₂e saved vs petrol/year',
    badge: 'EU Taxonomy Aligned',
    minAmount: 5000,
    maxAmount: 80000,
    term: '1-7 years',
    features: ['Instant approval', 'No early repayment fee', 'Charging point included'],
  },
  {
    id: 'gf-3',
    type: 'SOLAR LOAN',
    name: 'SolarBoost Home Loan',
    rate: 'From 4.9% APR',
    rateValue: 4.9,
    description:
      'Dedicated loan for residential solar panel and battery storage installation.',
    co2Saving: '~1.5 tonnes CO₂e avoided/year',
    badge: 'EU Taxonomy Aligned',
    minAmount: 3000,
    maxAmount: 50000,
    term: '1-10 years',
    features: ['Fixed rate', 'No early repayment fee', 'Installer network access'],
  },
  {
    id: 'gf-4',
    type: 'ESG FUND',
    name: 'European Green Transition Fund',
    rate: 'SFDR Article 9',
    rateValue: 0,
    description:
      'EU Taxonomy-aligned fund investing in companies driving the European green transition.',
    co2Saving: 'Portfolio 80% below MSCI Europe carbon intensity',
    badge: 'EU Taxonomy Aligned',
    minAmount: 100,
    maxAmount: 1000000,
    term: 'Open-ended',
    features: ['Article 9 fund', 'Quarterly impact report', 'Low TER 0.35%'],
  },
];

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

// Recommendations
export async function getRecommendations() {
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getRecommendations);
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
  if (!USE_MOCK) return apiRequest(ENDPOINTS.getGreenFinancing);
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
