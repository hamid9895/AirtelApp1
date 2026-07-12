import React, { useState, useMemo, useEffect } from 'react';
import { 
  Save, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Sliders, 
  Info, 
  AlertCircle, 
  ArrowLeftRight, 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle,
  TrendingUp,
  Layout,
  Layers,
  Settings,
  Plus,
  ArrowRight,
  Users,
  Trash2
} from 'lucide-react';
import { DailyStock, Sale, Allocation } from '../types';

export interface CustomWidgetConfig {
  id: string; // e.g. 'flexy', 'sim', 'closing', 'p1', 'p2', 'p3'
  label: string;
  visible: boolean;
  formula: string; // preset key or 'custom'
  customFormula?: string; // math formula
  override: boolean;
  overrideValue: number;
  type: 'currency' | 'number';
}

export interface DashboardConfig {
  welcomeText: string;
  showOnHandInventory: boolean;
  showActiveAgents: boolean;
  showQuickActions: boolean;
  showLowStockWatch: boolean;
  showRecentSales: boolean;
  showCoverageMap: boolean;
  simThreshold: number;
  flexyThreshold: number;
  
  // Overrides
  overrideOnHandAmount: boolean;
  manualOnHandAmount: number;
  overrideActiveAgents: boolean;
  manualActiveAgents: number;
  
  // Weekly Chart Data Allocation
  useManualWeeklyData: boolean;
  weeklyData: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
  
  // Hub coverage configuration
  coverageMapMessage: string;
  activeHubsCount: number;

  // New visual configurations & formulas
  totalPoolLabel: string;
  totalPoolFormula: string;
  totalPoolCustomFormula?: string;

  flexyLabel: string;
  flexyFormula: string;
  overrideFlexyAmount: boolean;
  manualFlexyAmount: number;

  simLabel: string;
  simFormula: string;
  overrideSimCount: boolean;
  manualSimCount: number;

  closingLabel: string;
  closingFormula: string;
  overrideClosingAmount: boolean;
  manualClosingAmount: number;

  onHandPositions: string[]; // e.g. ['flexy', 'sim', 'closing']
  widgets?: CustomWidgetConfig[];
}

export const defaultWidgets: CustomWidgetConfig[] = [
  {
    id: 'flexy',
    label: 'Flexy Balance',
    visible: true,
    formula: 'default',
    override: false,
    overrideValue: 450000,
    type: 'currency'
  },
  {
    id: 'sim',
    label: 'SIM Inventory',
    visible: true,
    formula: 'default',
    override: false,
    overrideValue: 120,
    type: 'number'
  },
  {
    id: 'closing',
    label: 'Closing Balance',
    visible: true,
    formula: 'default',
    override: false,
    overrideValue: 300000,
    type: 'currency'
  }
];

export const defaultDashboardConfig: DashboardConfig = {
  welcomeText: 'Airtel StockDistro Portal • System Active',
  showOnHandInventory: true,
  showActiveAgents: true,
  showQuickActions: true,
  showLowStockWatch: true,
  showRecentSales: true,
  showCoverageMap: true,
  simThreshold: 100,
  flexyThreshold: 20000,
  overrideOnHandAmount: false,
  manualOnHandAmount: 750000,
  overrideActiveAgents: false,
  manualActiveAgents: 12,
  useManualWeeklyData: false,
  weeklyData: {
    mon: 40,
    tue: 60,
    wed: 35,
    thu: 85,
    fri: 55,
    sat: 70,
    sun: 90
  },
  coverageMapMessage: 'Real-Time Distribution Map',
  activeHubsCount: 5,

  // New visual defaults
  totalPoolLabel: 'Total On-Hand Inventory Pool',
  totalPoolFormula: 'default',
  totalPoolCustomFormula: 'openingAmount + flexyClaim1 + flexyClaim2',

  flexyLabel: 'Flexy Balance',
  flexyFormula: 'default',
  overrideFlexyAmount: false,
  manualFlexyAmount: 450000,

  simLabel: 'SIM Inventory',
  simFormula: 'default',
  overrideSimCount: false,
  manualSimCount: 120,

  closingLabel: 'Closing Balance',
  closingFormula: 'default',
  overrideClosingAmount: false,
  manualClosingAmount: 300000,

  onHandPositions: ['flexy', 'sim', 'closing'],
  widgets: defaultWidgets
};

export interface FormulaOption {
  key: string;
  name: string;
  formula: string;
  description: string;
}

export const TOTAL_POOL_FORMULAS: FormulaOption[] = [
  {
    key: 'custom',
    name: '📝 Dynamic Custom Math Formula',
    formula: 'Custom Math Expression',
    description: 'Construct your own custom math formula using daily stock fields, variables, operators (+, -, *, /) and brackets.'
  },
  {
    key: 'default',
    name: 'Standard Opening Amount',
    formula: 'Opening Amount of Latest Daily Stock',
    description: 'Displays the standard registered opening balance of the active daily stock cycle.'
  },
  {
    key: 'sum_flexy_sim',
    name: 'Sum of Flexy & SIM Value',
    formula: 'Flexy Airtime + (SIM Cards * SIM Rate)',
    description: 'Aggregates current airtime balance and valued SIM card inventory together.'
  },
  {
    key: 'opening_minus_sales',
    name: 'Opening minus Approved Sales',
    formula: 'Opening Amount - Sum(Approved Sales Amount)',
    description: 'Calculates active pool balance by deducting approved FSC logged sales from opening stock.'
  },
  {
    key: 'sum_flexy_claims_sim',
    name: 'Complete On-Hand Assets Value (Flexy + Claims + SIMs)',
    formula: 'Flexy + Claim 1 + Claim 2 + (SIM Cards * SIM Rate)',
    description: 'Aggregates active flexy airtime, both pending claims, and SIM card cash valuation.'
  },
  {
    key: 'total_airtime_pool',
    name: 'Total Active & Transit Airtime Pool',
    formula: 'Flexy + Claim 1 + Claim 2',
    description: 'Sums current on-hand flexy airtime along with both pending transit claims.'
  },
  {
    key: 'active_available_stock',
    name: 'Active Available Stock (No Transit Claims)',
    formula: 'Flexy + (SIM Cards * SIM Rate)',
    description: 'Calculates instant liquid inventory available on-site immediately by excluding pending claims.'
  },
  {
    key: 'opening_total_value',
    name: 'Opening Book Assets Value (Opening Amt + Opening SIMs)',
    formula: 'Opening Amount + (Opening SIMs * SIM Rate)',
    description: 'Represents the total beginning inventory valuation at the start of the day cycle.'
  },
  {
    key: 'opening_minus_allocated',
    name: 'Opening Amount minus FSC Allocations',
    formula: 'Opening Amount - Sum(FSC Allocated Amount)',
    description: 'Shows remaining unallocated buffer stock in the master pool after distributing airtime to agents.'
  },
  {
    key: 'opening_plus_claims',
    name: 'Total Budget Pool (Opening Amount + Claims)',
    formula: 'Opening Amount + Claim 1 + Claim 2',
    description: 'Sums starting book value with newly received transit claims for the day.'
  }
];

export const FLEXY_FORMULAS: FormulaOption[] = [
  {
    key: 'default',
    name: 'Standard Flexy Airtime',
    formula: 'Raw Flexy Balance',
    description: 'Displays the raw airtime balance registered in the latest daily stock.'
  },
  {
    key: 'only_claims',
    name: 'Total Pending Claims Only',
    formula: 'Claim 1 + Claim 2',
    description: 'Computes total pending claims to track transit airtime status.'
  },
  {
    key: 'flexy_plus_claims',
    name: 'Aggregate Airtime (Flexy + Claims)',
    formula: 'Raw Flexy + Claim 1 + Claim 2',
    description: 'Aggregates physically loaded airtime together with transit claims.'
  }
];

export const SIM_FORMULAS: FormulaOption[] = [
  {
    key: 'default',
    name: 'Physical SIM Units Count',
    formula: 'SIM Units Balance',
    description: 'Displays the physical count of SIM card units available in stock.'
  },
  {
    key: 'opening_minus_allocated',
    name: 'Opening minus Distributed SIMs',
    formula: 'Opening SIM - Distributed SIMs',
    description: 'Calculates remaining inventory by deducting distributed SIMs from opening SIM count.'
  },
  {
    key: 'value_equivalent',
    name: 'Monetary SIM Valuation (₹)',
    formula: 'SIM Cards * SIM Rate',
    description: 'Converts physical SIM count into an equivalent cash value representation.'
  }
];

export const CLOSING_FORMULAS: FormulaOption[] = [
  {
    key: 'default',
    name: 'FSC Approved Closings Sum',
    formula: 'Sum(FSC Approved Closing Balances)',
    description: 'Aggregate remaining cash equivalent balance calculated across all approved sales.'
  },
  {
    key: 'remaining_assets',
    name: 'Remaining Assets Valuation',
    formula: 'Flexy Airtime + (SIM Cards * SIM Rate)',
    description: 'Alternative calculation tracking the total asset value of physical stock remaining.'
  },
  {
    key: 'opening_minus_all_sales',
    name: 'Opening minus All Sales',
    formula: 'Opening Amount - Sum(All Sales Today)',
    description: 'Deducts all today’s FSC sales amounts (regardless of approval status) from opening stock.'
  }
];

// Helper math formula parser and evaluator
export function evaluateMathFormula(
  formula: string,
  vars: {
    openingAmount: number;
    openingSim: number;
    flexy: number;
    flexyClaim1: number;
    flexyClaim2: number;
    sim: number;
    closingBalance: number;
    simPrice: number;
    totalAllocated: number;
    approvedSalesAmount: number;
    totalSalesAmount: number;
  }
): number {
  if (!formula) return 0;
  
  // Replace variables with case-insensitive / flexible matches
  let expr = formula.toLowerCase();
  
  // Map standard variations of naming
  const mappings = [
    { keys: ['openingamount', 'opening_amount', 'opening cash', 'opening_cash', 'opening cash amount', 'openingamountval'], value: vars.openingAmount },
    { keys: ['openingsim', 'opening_sim', 'opening sim', 'openingsimval'], value: vars.openingSim },
    { keys: ['flexy', 'flexy balance', 'flexy_balance', 'flval'], value: vars.flexy },
    { keys: ['flexyclaim1', 'claim1', 'claim 1', 'flexy_claim_1', 'cl1val'], value: vars.flexyClaim1 },
    { keys: ['flexyclaim2', 'claim2', 'claim 2', 'flexy_claim_2', 'cl2val'], value: vars.flexyClaim2 },
    { keys: ['sim', 'sim cards', 'sim inventory', 'sim_cards', 'simval'], value: vars.sim },
    { keys: ['closingbalance', 'closing balance', 'closing_balance', 'closingcash', 'closing cash', 'closing_cash'], value: vars.closingBalance },
    { keys: ['simprice', 'sim rate', 'sim price', 'sim_price', 'sim_rate'], value: vars.simPrice },
    { keys: ['totalallocated', 'total allocated', 'allocated', 'allocations'], value: vars.totalAllocated },
    { keys: ['approvedsalesamount', 'approved sales', 'approved_sales'], value: vars.approvedSalesAmount },
    { keys: ['totalsalesamount', 'totalsales', 'sales'], value: vars.totalSalesAmount }
  ];

  // Sort keys by length descending to prevent partial replacements
  const allTokens: { key: string; value: number }[] = [];
  mappings.forEach(m => {
    m.keys.forEach(k => {
      allTokens.push({ key: k, value: m.value });
    });
  });
  allTokens.sort((a, b) => b.key.length - a.key.length);

  allTokens.forEach(token => {
    const escaped = token.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\[${escaped}\\]|\\b${escaped}\\b`, 'g');
    expr = expr.replace(regex, String(token.value));
  });

  // Clean expression from anything except safe math characters
  const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');

  try {
    const result = new Function(`return (${sanitized})`)();
    return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : 0;
  } catch (err) {
    return 0;
  }
}

// Helper to compute a single custom or preset widget's value
export function computeWidgetValue(
  widget: CustomWidgetConfig,
  vars: {
    openingAmount: number;
    openingSim: number;
    flexy: number;
    flexyClaim1: number;
    flexyClaim2: number;
    sim: number;
    closingBalance: number;
    simPrice: number;
    totalAllocated: number;
    approvedSalesAmount: number;
    totalSalesAmount: number;
  }
): { value: number; isCurrency: boolean } {
  if (widget.override) {
    return { value: widget.overrideValue, isCurrency: widget.type === 'currency' };
  }

  // Handle standard presets for backward compatibility
  if (widget.id === 'flexy') {
    switch (widget.formula) {
      case 'only_claims':
        return { value: vars.flexyClaim1 + vars.flexyClaim2, isCurrency: true };
      case 'flexy_plus_claims':
        return { value: vars.flexy + vars.flexyClaim1 + vars.flexyClaim2, isCurrency: true };
      case 'custom':
        return { value: evaluateMathFormula(widget.customFormula || '', vars), isCurrency: widget.type === 'currency' };
      case 'default':
      default:
        return { value: vars.flexy, isCurrency: true };
    }
  }

  if (widget.id === 'sim') {
    switch (widget.formula) {
      case 'opening_minus_allocated':
        return { value: vars.openingSim - vars.totalAllocated, isCurrency: false };
      case 'value_equivalent':
        return { value: vars.sim * vars.simPrice, isCurrency: true };
      case 'custom':
        return { value: evaluateMathFormula(widget.customFormula || '', vars), isCurrency: widget.type === 'currency' };
      case 'default':
      default:
        return { value: vars.sim, isCurrency: false };
    }
  }

  if (widget.id === 'closing') {
    switch (widget.formula) {
      case 'remaining_assets':
        return { value: vars.flexy + (vars.sim * vars.simPrice), isCurrency: true };
      case 'opening_minus_all_sales':
        return { value: vars.openingAmount - vars.totalSalesAmount, isCurrency: true };
      case 'custom':
        return { value: evaluateMathFormula(widget.customFormula || '', vars), isCurrency: widget.type === 'currency' };
      case 'default':
      default:
        return { value: vars.closingBalance, isCurrency: true };
    }
  }

  // Dynamic custom widgets
  if (widget.formula === 'custom') {
    return { value: evaluateMathFormula(widget.customFormula || '', vars), isCurrency: widget.type === 'currency' };
  }

  // Preset variables shortcuts for ease of use
  switch (widget.formula) {
    case 'openingAmount':
      return { value: vars.openingAmount, isCurrency: true };
    case 'openingSim':
      return { value: vars.openingSim, isCurrency: false };
    case 'flexy':
      return { value: vars.flexy, isCurrency: true };
    case 'flexyClaim1':
      return { value: vars.flexyClaim1, isCurrency: true };
    case 'flexyClaim2':
      return { value: vars.flexyClaim2, isCurrency: true };
    case 'sim':
      return { value: vars.sim, isCurrency: false };
    case 'closingBalance':
      return { value: vars.closingBalance, isCurrency: true };
    default:
      return { value: evaluateMathFormula(widget.formula || '', vars), isCurrency: widget.type === 'currency' };
  }
}

// Helper formula evaluator
export function computeDashboardMetrics(
  dailyStocks: DailyStock[],
  sales: Sale[],
  allocations: Allocation[],
  config: DashboardConfig,
  simPrice: number = 150
) {
  const latestStock = dailyStocks && dailyStocks[0];
  const approvedSales = sales ? sales.filter(s => s.status === 'Approved') : [];
  const approvedSalesAmount = approvedSales.reduce((acc, s) => acc + (s.saleAmount || 0), 0);
  const totalSalesAmount = sales ? sales.reduce((acc, s) => acc + (s.saleAmount || 0), 0) : 0;
  const totalAllocatedAmount = allocations ? allocations.reduce((acc, a) => acc + (a.totalAllocated || 0), 0) : 0;
  const approvedClosingAmount = approvedSales.reduce((acc, s) => acc + (s.closingBalance || 0), 0);

  // Dynamically compute the master daily stock's calculated closing cash
  let calculatedClosingCash = 0;
  if (latestStock) {
    if ((latestStock as any).closingAmount !== undefined) {
      calculatedClosingCash = (latestStock as any).closingAmount;
    } else {
      const allocationsOnDate = allocations ? allocations.filter(a => a.date === latestStock.date) : [];
      const totalAllocatedCash = allocationsOnDate.reduce((sum, a) => {
        return sum + (Number(a.autoRefill1) || 0) + (Number(a.autoRefill2) || 0) + (Number(a.autoRefill3) || 0) + (Number(a.ecManual1) || 0) + (Number(a.ecManual2) || 0);
      }, 0);
      const approvedSalesOnDate = sales ? sales.filter(s => s.date === latestStock.date && s.status === 'Approved') : [];
      const totalApprovedRemittance = approvedSalesOnDate.reduce((sum, s) => sum + (Number(s.saleAmount) || 0), 0);
      calculatedClosingCash = latestStock.openingAmount + latestStock.flexy + (latestStock.flexyClaim1 || 0) + (latestStock.flexyClaim2 || 0) - totalAllocatedCash + totalApprovedRemittance;
    }
  } else {
    calculatedClosingCash = approvedClosingAmount;
  }

  // Variable dictionary
  const vars = {
    openingAmount: latestStock ? (latestStock.openingAmount || 0) : 0,
    openingSim: latestStock ? (latestStock.openingSim || 0) : 0,
    flexy: latestStock ? (latestStock.flexy || 0) : 0,
    flexyClaim1: latestStock ? (latestStock.flexyClaim1 || 0) : 0,
    flexyClaim2: latestStock ? (latestStock.flexyClaim2 || 0) : 0,
    sim: latestStock ? (latestStock.sim || 0) : 0,
    closingBalance: calculatedClosingCash,
    simPrice,
    totalAllocated: totalAllocatedAmount,
    approvedSalesAmount,
    totalSalesAmount
  };

  // Total Pool
  let totalPoolVal = 0;
  if (config.overrideOnHandAmount) {
    totalPoolVal = config.manualOnHandAmount;
  } else if (config.totalPoolFormula === 'custom') {
    totalPoolVal = evaluateMathFormula(config.totalPoolCustomFormula || 'openingAmount', vars);
  } else {
    const flVal = vars.flexy;
    const smVal = vars.sim;
    const cl1Val = vars.flexyClaim1;
    const cl2Val = vars.flexyClaim2;
    const opAmtVal = vars.openingAmount;
    const opSimVal = vars.openingSim;

    switch (config.totalPoolFormula) {
      case 'sum_flexy_sim':
        totalPoolVal = flVal + (smVal * simPrice);
        break;
      case 'opening_minus_sales':
        totalPoolVal = opAmtVal - approvedSalesAmount;
        break;
      case 'sum_flexy_claims_sim':
        totalPoolVal = flVal + cl1Val + cl2Val + (smVal * simPrice);
        break;
      case 'total_airtime_pool':
        totalPoolVal = flVal + cl1Val + cl2Val;
        break;
      case 'active_available_stock':
        totalPoolVal = flVal + (smVal * simPrice);
        break;
      case 'opening_total_value':
        totalPoolVal = opAmtVal + (opSimVal * simPrice);
        break;
      case 'opening_minus_allocated':
        totalPoolVal = opAmtVal - totalAllocatedAmount;
        break;
      case 'opening_plus_claims':
        totalPoolVal = opAmtVal + cl1Val + cl2Val;
        break;
      case 'default':
      default:
        totalPoolVal = opAmtVal;
        break;
    }
  }

  // Backward compatible values
  const legacyFlexyVal = config.overrideFlexyAmount 
    ? config.manualFlexyAmount 
    : (config.flexyFormula === 'only_claims' 
        ? vars.flexyClaim1 + vars.flexyClaim2 
        : (config.flexyFormula === 'flexy_plus_claims' 
            ? vars.flexy + vars.flexyClaim1 + vars.flexyClaim2 
            : vars.flexy));

  const legacySimVal = config.overrideSimCount 
    ? config.manualSimCount 
    : (config.simFormula === 'opening_minus_allocated' 
        ? vars.openingSim - totalAllocatedAmount 
        : (config.simFormula === 'value_equivalent' 
            ? vars.sim * simPrice 
            : vars.sim));

  const legacyClosingVal = config.overrideClosingAmount 
    ? config.manualClosingAmount 
    : (config.closingFormula === 'remaining_assets' 
        ? vars.flexy + (vars.sim * simPrice) 
        : (config.closingFormula === 'opening_minus_all_sales' 
            ? vars.openingAmount - totalSalesAmount 
            : vars.closingBalance));

  // Dynamic custom widgets mapping
  const baseWidgets = config.widgets || defaultWidgets;
  const positions = config.onHandPositions || ['flexy', 'sim', 'closing'];

  const mergedWidgets = positions.map(id => {
    const existing = baseWidgets.find(w => w.id === id);
    if (existing) return existing;
    return {
      id,
      label: id.toUpperCase(),
      visible: true,
      formula: 'custom',
      customFormula: 'flexy',
      override: false,
      overrideValue: 0,
      type: 'currency' as const
    };
  });

  // Append any widget in baseWidgets not in positions
  baseWidgets.forEach(w => {
    if (!mergedWidgets.find(m => m.id === w.id)) {
      mergedWidgets.push(w);
    }
  });

  const computedWidgets = mergedWidgets.map(widget => {
    const res = computeWidgetValue(widget, vars);
    return {
      ...widget,
      computedValue: res.value,
      isCurrency: res.isCurrency
    };
  });

  return {
    totalPoolVal,
    flexyVal: legacyFlexyVal,
    simVal: legacySimVal,
    isSimValCurrency: config.simFormula === 'value_equivalent' && !config.overrideSimCount,
    closingVal: legacyClosingVal,
    widgets: computedWidgets,
    vars
  };
}

interface DashboardConfigTabProps {
  config: DashboardConfig;
  onSaveConfig: (updated: DashboardConfig) => void;
  dailyStocks: DailyStock[];
  sales: Sale[];
  allocations: Allocation[];
  globalConfig: { commissionPercentage: number; simAmount: number } | null;
}

export const DashboardConfigTab: React.FC<DashboardConfigTabProps> = ({
  config,
  onSaveConfig,
  dailyStocks,
  sales,
  allocations,
  globalConfig
}) => {
  // Safe parsing
  const initialConfig = useMemo(() => {
    return { ...defaultDashboardConfig, ...config };
  }, [config]);

  const [localConfig, setLocalConfig] = useState<DashboardConfig>(initialConfig);

  useEffect(() => {
    setLocalConfig({ ...defaultDashboardConfig, ...config });
  }, [config]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeMode, setActiveMode] = useState<'visual' | 'classic'>('visual');
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const simPrice = globalConfig?.simAmount || 150;

  // Real-time computed values
  const computed = useMemo(() => {
    return computeDashboardMetrics(dailyStocks, sales, allocations, localConfig, simPrice);
  }, [dailyStocks, sales, allocations, localConfig, simPrice]);

  const handleToggle = (key: keyof DashboardConfig) => {
    setLocalConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNestedWeeklyChange = (day: keyof DashboardConfig['weeklyData'], value: number) => {
    const bounded = Math.max(0, Math.min(100, value));
    setLocalConfig(prev => ({
      ...prev,
      weeklyData: {
        ...prev.weeklyData,
        [day]: bounded
      }
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveConfig(localConfig);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleReset = () => {
    setLocalConfig({ ...defaultDashboardConfig });
  };

  // Sub-metrics position shifting
  const movePosition = (index: number, direction: 'left' | 'right') => {
    const newPositions = [...(localConfig.onHandPositions || ['flexy', 'sim', 'closing'])];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newPositions.length) {
      const temp = newPositions[index];
      newPositions[index] = newPositions[targetIndex];
      newPositions[targetIndex] = temp;
      setLocalConfig(prev => ({
        ...prev,
        onHandPositions: newPositions
      }));
    }
  };

  const handleUpdateWidget = (id: string, fields: Partial<CustomWidgetConfig>) => {
    const baseW = localConfig.widgets || defaultWidgets;
    const updated = baseW.map(w => w.id === id ? { ...w, ...fields } : w);
    setLocalConfig(prev => ({
      ...prev,
      widgets: updated
    }));
  };

  const handleAddCustomWidget = () => {
    const baseW = localConfig.widgets || defaultWidgets;
    const customCount = baseW.filter(w => w.id.startsWith('p')).length + 1;
    const newId = `p${customCount}`;
    const newW: CustomWidgetConfig = {
      id: newId,
      label: `P${customCount} Custom Metric`,
      visible: true,
      formula: 'custom',
      customFormula: 'flexyClaim1 + flexyClaim2',
      override: false,
      overrideValue: 0,
      type: 'currency'
    };
    
    setLocalConfig(prev => ({
      ...prev,
      widgets: [...baseW, newW],
      onHandPositions: [...(prev.onHandPositions || ['flexy', 'sim', 'closing']), newId]
    }));
  };

  const handleDeleteCustomWidget = (id: string) => {
    const baseW = localConfig.widgets || defaultWidgets;
    const updatedWidgets = baseW.filter(w => w.id !== id);
    const updatedPositions = (localConfig.onHandPositions || ['flexy', 'sim', 'closing']).filter(pId => pId !== id);
    setLocalConfig(prev => ({
      ...prev,
      widgets: updatedWidgets,
      onHandPositions: updatedPositions
    }));
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#EE1D23]/10 text-[#EE1D23] rounded-2xl">
              <Sliders className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Dashboard Allocation & Positioning Console
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Drag, arrange, edit metrics in-place on a visual dashboard layout, and customize formulas with live previews.
              </p>
            </div>
          </div>

          {/* Engine Mode Selectors */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveMode('visual')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
                activeMode === 'visual'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Visual Layout Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('classic')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
                activeMode === 'classic'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Classic Form List</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] font-semibold text-emerald-800 flex items-center gap-2 mb-6 animate-fade-in">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Dashboard blueprint saved successfully! Changes are now active on your dashboard overview.</span>
          </div>
        )}

        {/* MODE A: VISUAL DASHBOARD DESIGNER */}
        {activeMode === 'visual' ? (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-250/60 mb-2">
              <span className="bg-[#EE1D23] text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded mr-2">Interactive Preview</span>
              <span className="text-[10px] text-slate-500 font-semibold">
                This area acts as a real-time editor. **Click to modify labels, toggle checkboxes, re-order positions using arrows, and choose formulas** with interactive live previews!
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Card 1: Total On-Hand Inventory Pool */}
              <div className={`md:col-span-2 md:row-span-2 bg-white rounded-3xl border transition-all duration-300 p-6 flex flex-col justify-between ${
                localConfig.showOnHandInventory 
                  ? 'border-indigo-200 ring-2 ring-indigo-50/50' 
                  : 'border-slate-100 bg-slate-50/30 opacity-60'
              }`}>
                {/* Header configuration */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div className="flex-grow pr-4">
                      <span className="text-[8px] text-indigo-500 font-bold uppercase tracking-wider block mb-0.5">Title Label</span>
                      <input
                        type="text"
                        value={localConfig.totalPoolLabel}
                        onChange={(e) => setLocalConfig(prev => ({ ...prev, totalPoolLabel: e.target.value }))}
                        className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-transparent border-b border-dashed border-slate-300 focus:border-[#EE1D23] outline-none w-full"
                        placeholder="Pool Label"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('showOnHandInventory')}
                      className={`p-1.5 rounded-xl cursor-pointer transition-all ${
                        localConfig.showOnHandInventory ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                      title={localConfig.showOnHandInventory ? "Hide Widget" : "Show Widget"}
                    >
                      {localConfig.showOnHandInventory ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Primary counter formulas */}
                  <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Calculated Pool Amount</p>
                      <div className="flex items-center gap-1.5">
                        <label className="text-[8px] font-bold text-indigo-600 uppercase cursor-pointer" htmlFor="pool-override">Override</label>
                        <input
                          id="pool-override"
                          type="checkbox"
                          checked={localConfig.overrideOnHandAmount}
                          onChange={() => handleToggle('overrideOnHandAmount')}
                          className="w-3.5 h-3.5 text-[#EE1D23] rounded focus:ring-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    {localConfig.overrideOnHandAmount ? (
                      <div className="space-y-1 animate-fade-in">
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                          <span>Enter Manual Amount (₹)</span>
                        </div>
                        <input
                          type="number"
                          value={localConfig.manualOnHandAmount}
                          onChange={(e) => setLocalConfig(prev => ({ ...prev, manualOnHandAmount: Number(e.target.value) }))}
                          className="w-full text-base font-black px-2.5 py-1 border border-indigo-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-3xl font-black text-slate-900 tracking-tight">
                          ₹{computed.totalPoolVal.toLocaleString('en-IN')}
                        </p>
                        
                        {/* Formula Select */}
                        <div className="pt-2 border-t border-slate-200/60 mt-1">
                          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            Allocation Formula Logic
                          </label>
                          <select
                            value={localConfig.totalPoolFormula}
                            onChange={(e: any) => setLocalConfig(prev => ({ ...prev, totalPoolFormula: e.target.value }))}
                            className="w-full text-[10px] font-semibold bg-white px-2 py-1.5 border border-slate-200 rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-[#EE1D23]"
                          >
                            {TOTAL_POOL_FORMULAS.map(f => (
                              <option key={f.key} value={f.key}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                          
                          {/* Selected formula description or Custom Formula Editor */}
                          {localConfig.totalPoolFormula === 'custom' ? (
                            <div className="mt-3.5 space-y-2 bg-white p-3 rounded-2xl border border-slate-200 animate-fade-in">
                              <div className="flex justify-between items-center">
                                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">
                                  📝 Write Custom Math Formula
                                </label>
                                <span className="text-[8px] bg-slate-100 text-slate-600 font-bold px-1 rounded uppercase">Live Prev: ₹{computed.totalPoolVal.toLocaleString('en-IN')}</span>
                              </div>
                              <input
                                type="text"
                                value={localConfig.totalPoolCustomFormula || ''}
                                onChange={(e) => setLocalConfig(prev => ({ ...prev, totalPoolCustomFormula: e.target.value }))}
                                className="w-full text-xs font-mono font-bold bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 focus:border-[#EE1D23] outline-none"
                                placeholder="e.g. openingAmount + flexyClaim1 + flexyClaim2 - totalAllocated"
                              />

                              {/* Variable pill selectors */}
                              <div>
                                <p className="text-[8px] text-slate-400 font-bold uppercase mb-1">Click to Insert Variable:</p>
                                <div className="flex flex-wrap gap-1">
                                  {[
                                    { label: 'Opening Cash', token: 'openingAmount' },
                                    { label: 'Opening SIMs', token: 'openingSim' },
                                    { label: 'Flexy Airtime', token: 'flexy' },
                                    { label: 'Claim 1', token: 'flexyClaim1' },
                                    { label: 'Claim 2', token: 'flexyClaim2' },
                                    { label: 'Closing Cash', token: 'closingBalance' },
                                    { label: 'SIM Units', token: 'sim' },
                                    { label: 'SIM Price', token: 'simPrice' }
                                  ].map(v => (
                                    <button
                                      key={v.token}
                                      type="button"
                                      onClick={() => setLocalConfig(prev => ({
                                        ...prev,
                                        totalPoolCustomFormula: (prev.totalPoolCustomFormula || '') + ' ' + v.token
                                      }))}
                                      className="text-[8px] bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded-md font-medium cursor-pointer transition-all border border-slate-200/55"
                                    >
                                      {v.label} ({v.token})
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[9px] text-slate-400 mt-1 font-medium leading-relaxed italic bg-indigo-50/20 p-1.5 rounded">
                              **Active Formula:** {TOTAL_POOL_FORMULAS.find(f => f.key === localConfig.totalPoolFormula)?.formula}
                              <br />
                              <span className="text-[8px] text-slate-400 not-italic">{TOTAL_POOL_FORMULAS.find(f => f.key === localConfig.totalPoolFormula)?.description}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SUB-METRIC ORDER & FORMULA CUSTOMIZER */}
                  <div className="space-y-3 mt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        Arrange Sub-Metrics & Formulas
                      </p>
                      <button
                        type="button"
                        onClick={handleAddCustomWidget}
                        className="text-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold px-2 py-1 rounded-xl flex items-center gap-1 cursor-pointer transition-all border border-emerald-200"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Custom (P1, P2...)</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(localConfig.onHandPositions || ['flexy', 'sim', 'closing']).map((key, index, arr) => {
                        const widget = (localConfig.widgets || defaultWidgets).find(w => w.id === key);
                        if (!widget) return null;

                        // Calculate current live preview value for this specific widget
                        const valObj = computed.widgets.find(w => w.id === key);
                        const displayVal = valObj ? (valObj.computedValue ?? 0) : 0;
                        const isCurrency = widget.type === 'currency' || key === 'flexy' || key === 'closing';

                        return (
                          <div 
                            key={key} 
                            className={`p-3 rounded-2xl border transition-all space-y-2 relative ${
                              widget.visible 
                                ? 'bg-slate-50 border-slate-200/50 hover:bg-slate-100/80' 
                                : 'bg-slate-100/40 border-slate-200/30 opacity-60'
                            }`}
                            onMouseEnter={() => setHoveredMetric(key)}
                            onMouseLeave={() => setHoveredMetric(null)}
                          >
                            {/* Card Header (Labels, Visibility, Delete & Position arrows) */}
                            <div className="flex justify-between items-center gap-2">
                              {/* Inline Label Editor */}
                              <div className="flex-grow">
                                <input
                                  type="text"
                                  value={widget.label}
                                  onChange={(e) => handleUpdateWidget(key, { label: e.target.value })}
                                  className="text-[10px] font-bold text-slate-700 uppercase bg-transparent border-b border-dashed border-slate-300 focus:border-[#EE1D23] outline-none w-full"
                                  placeholder="Enter Label"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                {/* Toggle visibility */}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateWidget(key, { visible: !widget.visible })}
                                  className={`p-1 rounded-md border ${
                                    widget.visible ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-200 text-slate-400 border-slate-300'
                                  } cursor-pointer hover:scale-105 transition-all`}
                                  title={widget.visible ? "Visible on Dashboard" : "Hidden on Dashboard"}
                                >
                                  {widget.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </button>

                                {/* Delete custom widget button */}
                                {key.startsWith('p') && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomWidget(key)}
                                    className="p-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer hover:scale-105 transition-all"
                                    title="Delete custom widget"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}

                                {/* Position Shift buttons */}
                                <button
                                  type="button"
                                  onClick={() => movePosition(index, 'left')}
                                  disabled={index === 0}
                                  className={`p-1 rounded-md text-slate-500 hover:bg-white border border-slate-200 disabled:opacity-30 disabled:hover:bg-transparent ${
                                    index === 0 ? 'cursor-not-allowed' : 'cursor-pointer'
                                  }`}
                                  title="Shift position backward"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                </button>
                                <span className="text-[8px] font-mono font-bold text-slate-400 px-1 bg-white border border-slate-150 rounded">
                                  P{index + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => movePosition(index, 'right')}
                                  disabled={index === arr.length - 1}
                                  className={`p-1 rounded-md text-slate-500 hover:bg-white border border-slate-200 disabled:opacity-30 disabled:hover:bg-transparent ${
                                    index === arr.length - 1 ? 'cursor-not-allowed' : 'cursor-pointer'
                                  }`}
                                  title="Shift position forward"
                                >
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Display Value & Formulas */}
                            <div className="grid grid-cols-1 gap-2 border-t border-slate-200/50 pt-2 mt-1">
                              {/* Left: Value display & Override trigger */}
                              <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100">
                                <div className="space-y-0.5">
                                  <p className="text-[8px] font-bold text-slate-400 uppercase">Live Preview</p>
                                  <p className="text-xs font-black text-slate-850">
                                    {isCurrency ? `₹${displayVal.toLocaleString('en-IN')}` : `${displayVal} Units`}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* Type select (currency/number) for dynamic custom widgets */}
                                  {key.startsWith('p') && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[8px] font-bold text-slate-400 uppercase">Type:</span>
                                      <select
                                        value={widget.type || 'currency'}
                                        onChange={(e) => handleUpdateWidget(key, { type: e.target.value as 'currency' | 'number' })}
                                        className="text-[8px] font-bold border border-slate-200 rounded p-0.5"
                                      >
                                        <option value="currency">₹ Currency</option>
                                        <option value="number"># Number</option>
                                      </select>
                                    </div>
                                  )}

                                  {/* Override checkbox */}
                                  <div className="flex items-center gap-1">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase cursor-pointer" htmlFor={`override-${key}`}>Manual</label>
                                    <input
                                      id={`override-${key}`}
                                      type="checkbox"
                                      checked={widget.override || false}
                                      onChange={() => handleUpdateWidget(key, { override: !widget.override })}
                                      className="w-3 h-3 text-[#EE1D23] rounded focus:ring-0 cursor-pointer"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Manual value input if checked */}
                              {widget.override && (
                                <div className="animate-fade-in bg-white p-2 rounded-xl border border-indigo-100">
                                  <label className="block text-[8px] font-black text-indigo-500 uppercase tracking-wide mb-1">
                                    Allocate Override Value
                                  </label>
                                  <input
                                    type="number"
                                    value={widget.overrideValue || 0}
                                    onChange={(e) => handleUpdateWidget(key, { overrideValue: Number(e.target.value) })}
                                    className="w-full text-xs font-black bg-slate-50 px-2 py-1 rounded border border-indigo-200 outline-none focus:ring-1 focus:ring-indigo-400"
                                  />
                                </div>
                              )}

                              {/* Formula Selector / Custom Code Editor */}
                              {!widget.override && (
                                <div className="space-y-1.5">
                                  <select
                                    value={widget.formula}
                                    onChange={(e) => handleUpdateWidget(key, { formula: e.target.value })}
                                    className="w-full text-[9px] font-bold bg-white px-1.5 py-1 border border-slate-200 rounded-lg outline-none cursor-pointer"
                                  >
                                    {/* Built-in dropdown options if key matches standard ones */}
                                    {key === 'flexy' && FLEXY_FORMULAS.map(f => (
                                      <option key={f.key} value={f.key}>{f.name}</option>
                                    ))}
                                    {key === 'sim' && SIM_FORMULAS.map(f => (
                                      <option key={f.key} value={f.key}>{f.name}</option>
                                    ))}
                                    {key === 'closing' && CLOSING_FORMULAS.map(f => (
                                      <option key={f.key} value={f.key}>{f.name}</option>
                                    ))}
                                    {/* Custom option */}
                                    <option value="custom">📝 Dynamic Custom Math Formula</option>
                                  </select>

                                  {/* Custom expression input if selected */}
                                  {widget.formula === 'custom' ? (
                                    <div className="space-y-1.5 bg-slate-100/50 p-2 rounded-xl border border-slate-200/60 mt-1 animate-fade-in">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-extrabold text-indigo-600 uppercase">Custom Math Expression</span>
                                        <span className="text-[8px] text-slate-400 font-semibold uppercase">Parsed Live</span>
                                      </div>
                                      <input
                                        type="text"
                                        value={widget.customFormula || ''}
                                        onChange={(e) => handleUpdateWidget(key, { customFormula: e.target.value })}
                                        className="w-full text-[9px] font-mono font-bold bg-white px-2 py-1 rounded border border-slate-200 focus:border-[#EE1D23] outline-none"
                                        placeholder="e.g. flexy + flexyClaim1 - approvedSalesAmount"
                                      />

                                      {/* Helper Click to insert tokens */}
                                      <div>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase mb-0.5">Click to insert variable:</p>
                                        <div className="flex flex-wrap gap-0.5">
                                          {[
                                            { label: 'Opening Cash', token: 'openingAmount' },
                                            { label: 'Opening SIMs', token: 'openingSim' },
                                            { label: 'Flexy Balance', token: 'flexy' },
                                            { label: 'Claim 1', token: 'flexyClaim1' },
                                            { label: 'Claim 2', token: 'flexyClaim2' },
                                            { label: 'Closing Cash', token: 'closingBalance' },
                                            { label: 'SIM Units', token: 'sim' },
                                            { label: 'SIM Price', token: 'simPrice' }
                                          ].map(v => (
                                            <button
                                              key={v.token}
                                              type="button"
                                              onClick={() => handleUpdateWidget(key, {
                                                customFormula: (widget.customFormula || '') + ' ' + v.token
                                              })}
                                              className="text-[7px] bg-white hover:bg-slate-200 text-slate-600 px-1 py-0.5 rounded border border-slate-200/50 cursor-pointer"
                                            >
                                              {v.label}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-white px-2 py-1 rounded text-[8px] text-slate-400 leading-snug">
                                      <span className="font-semibold block text-slate-500">
                                        Formula: {
                                          key === 'flexy' ? FLEXY_FORMULAS.find(f => f.key === widget.formula)?.formula :
                                          key === 'sim' ? SIM_FORMULAS.find(f => f.key === widget.formula)?.formula :
                                          CLOSING_FORMULAS.find(f => f.key === widget.formula)?.formula
                                        }
                                      </span>
                                      <span>
                                        {
                                          key === 'flexy' ? FLEXY_FORMULAS.find(f => f.key === widget.formula)?.description :
                                          key === 'sim' ? SIM_FORMULAS.find(f => f.key === widget.formula)?.description :
                                          CLOSING_FORMULAS.find(f => f.key === widget.formula)?.description
                                        }
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* WEEKLY CHART CONFIG IN-PLACE */}
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                      Weekly Cycle Heights
                    </p>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[8px] font-bold text-slate-500 uppercase cursor-pointer" htmlFor="chart-override">Override Chart</label>
                      <input
                        id="chart-override"
                        type="checkbox"
                        checked={localConfig.useManualWeeklyData}
                        onChange={() => handleToggle('useManualWeeklyData')}
                        className="w-3.5 h-3.5 text-[#EE1D23] rounded focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-end gap-1.5 h-16">
                      {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map(day => {
                        const h = localConfig.weeklyData[day];
                        return (
                          <div 
                            key={day} 
                            className="flex-1 bg-[#EE1D23]/15 hover:bg-[#EE1D23]/30 rounded transition-all relative group"
                            style={{ height: `${h}%` }}
                          >
                            <div className="absolute inset-x-0 top-0 bg-[#EE1D23] h-1.5 rounded-t"></div>
                            <span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-1 py-0.5 rounded font-bold font-mono">
                              {h}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>

                    {localConfig.useManualWeeklyData && (
                      <div className="grid grid-cols-7 gap-1 pt-1.5 border-t border-slate-200">
                        {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map(day => (
                          <div key={day} className="text-center">
                            <span className="text-[8px] font-bold uppercase text-slate-400 block mb-0.5">{day}</span>
                            <input
                              type="number"
                              value={localConfig.weeklyData[day]}
                              onChange={(e) => handleNestedWeeklyChange(day, Number(e.target.value))}
                              className="w-full text-center text-[9px] font-bold border border-slate-200 bg-white rounded p-0.5 outline-none"
                              min="0"
                              max="100"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Active FSC Agents widget */}
              <div className={`rounded-3xl border transition-all duration-300 p-6 flex flex-col justify-between ${
                localConfig.showActiveAgents 
                  ? 'bg-slate-950 text-white border-slate-800' 
                  : 'bg-slate-900/40 text-slate-500 border-slate-800 opacity-50'
              }`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="bg-[#EE1D23] text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Active FSC</span>
                    <button
                      type="button"
                      onClick={() => handleToggle('showActiveAgents')}
                      className={`p-1.5 rounded-xl cursor-pointer transition-all ${
                        localConfig.showActiveAgents ? 'bg-slate-850 text-indigo-400 hover:bg-slate-800' : 'bg-slate-850 text-slate-500'
                      }`}
                    >
                      {localConfig.showActiveAgents ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Active agents label</p>
                    <input
                      type="text"
                      value={localConfig.welcomeText}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, welcomeText: e.target.value }))}
                      className="text-[10px] font-bold bg-transparent border-b border-dashed border-slate-700 text-white outline-none w-full"
                      placeholder="Dashboard status text"
                    />
                  </div>

                  <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Manual count</span>
                      <input
                        type="checkbox"
                        checked={localConfig.overrideActiveAgents}
                        onChange={() => handleToggle('overrideActiveAgents')}
                        className="w-3.5 h-3.5 text-[#EE1D23] rounded focus:ring-0"
                      />
                    </div>
                    {localConfig.overrideActiveAgents ? (
                      <input
                        type="number"
                        value={localConfig.manualActiveAgents}
                        onChange={(e) => setLocalConfig(prev => ({ ...prev, manualActiveAgents: Number(e.target.value) }))}
                        className="w-full text-xs font-black text-slate-900 bg-white px-2 py-1 rounded outline-none"
                      />
                    ) : (
                      <p className="text-3xl font-black text-white">{computed.flexyVal > 0 ? dailyStocks.length + 8 : 12}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[9px] text-slate-400 italic">
                  Renders standard FSC active users list dynamically from database.
                </div>
              </div>

              {/* Card 3: Quick Actions Console */}
              <div className={`rounded-3xl p-6 text-white flex flex-col justify-between transition-all duration-300 ${
                localConfig.showQuickActions 
                  ? 'bg-[#EE1D23] border-red-500' 
                  : 'bg-red-950/40 text-red-500/60 border-red-900 opacity-50'
              } border`}>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span className="bg-white/20 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Quick Shortcuts</span>
                    <button
                      type="button"
                      onClick={() => handleToggle('showQuickActions')}
                      className="p-1 rounded bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                    >
                      {localConfig.showQuickActions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-sm font-black leading-tight">Log sales sheets and fsc coordinates</p>
                </div>
                <div className="mt-4 text-[9px] text-white/70 bg-white/10 p-2 rounded-xl">
                  ● Shortcut button to Sales logs & Distributions triggers.
                </div>
              </div>

              {/* Card 4: Critical Alerts & Stock deficit watcher */}
              <div className={`md:col-span-2 bg-white rounded-3xl border transition-all duration-300 p-6 flex flex-col justify-between ${
                localConfig.showLowStockWatch 
                  ? 'border-indigo-200' 
                  : 'border-slate-100 bg-slate-50/20 opacity-50'
              }`}>
                <div className="space-y-3.5 w-full">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <span className="bg-rose-100 text-rose-700 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded">Low Stock Watch</span>
                    <button
                      type="button"
                      onClick={() => handleToggle('showLowStockWatch')}
                      className={`p-1 rounded cursor-pointer ${localConfig.showLowStockWatch ? 'text-indigo-600' : 'text-slate-400'}`}
                    >
                      {localConfig.showLowStockWatch ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Threshold in-place sliders / numeric inputs */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wide mb-1">
                        SIM Warning Threshold
                      </label>
                      <input
                        type="number"
                        value={localConfig.simThreshold}
                        onChange={(e) => setLocalConfig(prev => ({ ...prev, simThreshold: Number(e.target.value) }))}
                        className="w-full text-xs font-black bg-white border border-slate-200 px-2.5 py-1 rounded-xl outline-none"
                      />
                      <span className="text-[8px] text-slate-400 mt-0.5 block">Trigger alert below {localConfig.simThreshold} units</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wide mb-1">
                        Flexy Warning Threshold
                      </label>
                      <input
                        type="number"
                        value={localConfig.flexyThreshold}
                        onChange={(e) => setLocalConfig(prev => ({ ...prev, flexyThreshold: Number(e.target.value) }))}
                        className="w-full text-xs font-black bg-white border border-slate-200 px-2.5 py-1 rounded-xl outline-none"
                      />
                      <span className="text-[8px] text-slate-400 mt-0.5 block">Trigger alert below ₹{localConfig.flexyThreshold.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[9px] text-amber-600 bg-amber-50 p-2 rounded-xl flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Real-time warning triggers when active inventory slips below allocated limits.</span>
                </div>
              </div>

              {/* Card 5: Recent Sales Submissions logs */}
              <div className={`md:col-span-2 bg-white rounded-3xl border transition-all duration-300 p-6 flex flex-col justify-between ${
                localConfig.showRecentSales 
                  ? 'border-indigo-200' 
                  : 'border-slate-100 bg-slate-50/20 opacity-50'
              }`}>
                <div className="space-y-3 w-full">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded">Sales Queue Widget</span>
                    <button
                      type="button"
                      onClick={() => handleToggle('showRecentSales')}
                      className={`p-1 rounded cursor-pointer ${localConfig.showRecentSales ? 'text-indigo-600' : 'text-slate-400'}`}
                    >
                      {localConfig.showRecentSales ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    Automatically pulls the last 3 registered sales sheets in the database showing active queue approval status.
                  </p>
                </div>
                <div className="mt-4 pt-2 text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-right">
                  Links to sales workflow queue →
                </div>
              </div>

              {/* Card 6: Coverage Map Hub Network */}
              <div className={`md:col-span-2 bg-slate-900 rounded-3xl text-white relative p-6 transition-all duration-300 border ${
                localConfig.showCoverageMap 
                  ? 'border-slate-800' 
                  : 'border-slate-800 opacity-40'
              }`}>
                <div className="absolute top-2 right-2 z-10">
                  <button
                    type="button"
                    onClick={() => handleToggle('showCoverageMap')}
                    className={`p-1.5 rounded-xl cursor-pointer ${localConfig.showCoverageMap ? 'text-red-400 bg-slate-800' : 'text-slate-600 bg-slate-850'}`}
                  >
                    {localConfig.showCoverageMap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-4 relative z-10 w-full">
                  <div className="space-y-1">
                    <span className="text-[8px] text-red-400 font-black uppercase block tracking-wider">Interactive Label Input</span>
                    <input
                      type="text"
                      value={localConfig.coverageMapMessage}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, coverageMapMessage: e.target.value }))}
                      className="text-xs font-black bg-transparent border-b border-dashed border-slate-700 text-white outline-none w-full"
                      placeholder=" NCR Coverage Status Message"
                    />
                  </div>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wide">
                      Connected Distribution Hubs
                    </label>
                    <input
                      type="number"
                      value={localConfig.activeHubsCount}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, activeHubsCount: Math.max(0, Number(e.target.value)) }))}
                      className="w-full text-xs font-black text-white bg-slate-900 border border-slate-800 px-2 py-1 rounded"
                    />
                  </div>
                </div>

                {/* Pulsing visual spots */}
                {localConfig.showCoverageMap && (
                  <div className="absolute bottom-3 right-3 w-2 h-2 bg-[#EE1D23] rounded-full animate-ping"></div>
                )}
              </div>

            </div>

            {/* Quick action triggers */}
            <div className="flex justify-end pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleSave()}
                className="px-6 py-3 bg-[#EE1D23] hover:bg-red-700 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-red-500/20"
              >
                <Save className="w-4 h-4" />
                <span>Apply Layout & Positions Blueprint</span>
              </button>
            </div>
          </div>
        ) : (
          /* MODE B: CLASSIC FORM LIST */
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                1. Widget Visibility Allocation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(['showOnHandInventory', 'showActiveAgents', 'showQuickActions', 'showLowStockWatch', 'showRecentSales', 'showCoverageMap'] as const).map(key => (
                  <div 
                    key={key}
                    onClick={() => handleToggle(key)}
                    className={`p-4 rounded-2xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                      localConfig[key] 
                        ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950' 
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide">
                        {key === 'showOnHandInventory' ? 'Inventory Pool Widget' :
                         key === 'showActiveAgents' ? 'Active Agents Card' :
                         key === 'showQuickActions' ? 'Shortcuts Panel' :
                         key === 'showLowStockWatch' ? 'Critical alert watch' :
                         key === 'showRecentSales' ? 'Recent submissions log' :
                         'NCR Coverage Map Widget'}
                      </p>
                    </div>
                    {localConfig[key] ? <Eye className="w-4 h-4 text-indigo-600" /> : <EyeOff className="w-4 h-4" />}
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Labels and thresholds */}
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                2. Labels, Messages & Alarm Limits
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-1.5">
                    Pool Title Label
                  </label>
                  <input
                    type="text"
                    value={localConfig.totalPoolLabel}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, totalPoolLabel: e.target.value }))}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-1.5">
                    Flexy Sub-item Label
                  </label>
                  <input
                    type="text"
                    value={localConfig.flexyLabel}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, flexyLabel: e.target.value }))}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-1.5">
                    SIM Sub-item Label
                  </label>
                  <input
                    type="text"
                    value={localConfig.simLabel}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, simLabel: e.target.value }))}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-1.5">
                    Closing Balance Sub-item Label
                  </label>
                  <input
                    type="text"
                    value={localConfig.closingLabel}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, closingLabel: e.target.value }))}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-[#EE1D23] hover:bg-red-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Allocation</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
