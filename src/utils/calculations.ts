import { SurveyResponse, DerivedIndices } from '../types/survey';

export const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return defaultValue;
  }
  return Number(value);
};

export const safeString = (value: any, defaultValue: string = ''): string => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.join(',');
  }
  return String(value);
};

export const safeFixed = (value: any, decimals: number = 2, defaultValue: string = '0.00'): string => {
  const num = safeNumber(value, NaN);
  if (isNaN(num)) {
    return defaultValue;
  }
  return num.toFixed(decimals);
};

export const safeSplit = (value: any, delimiter: string = ','): string[] => {
  const str = safeString(value, '');
  if (str === '') {
    return [];
  }
  return str.split(delimiter).filter(item => item.trim() !== '');
};

export const calculateDerivedIndices = (row: SurveyResponse): DerivedIndices => {
  const q11Scaled = safeNumber(row.q11_nostalgia_little_tikes_0_100, 0) / 20;

  const nostalgiaIntensity = (
    (safeNumber(row.q7_memories_childhood_toys_vivid_memories_1_5, 0) +
      safeNumber(row.q7_memories_childhood_toys_reminds_childhood_1_5, 0) +
      safeNumber(row.q7_memories_childhood_toys_want_child_experience_1_5, 0) +
      (6 - safeNumber(row.q7_memories_childhood_toys_not_relevant_today_1_5, 0)) +
      q11Scaled +
      safeNumber(row.q13_emotional_impact_makes_nostalgic_1_5, 0)) / 6
  ) * 20;

  const brandTrust = (
    ((7 - safeNumber(row.q6_childhood_brand_rank_little_tikes, 0)) +
      safeNumber(row.q13_emotional_impact_trust_vs_newer_1_5, 0) +
      safeNumber(row.q19_nps_little_tikes_1_5, 0) +
      ((safeNumber(row.q15_lt_rating_vs_competitors_quality_durability_0_100, 0) +
        safeNumber(row.q15_lt_rating_vs_competitors_safety_trust_0_100, 0)) / 40)) / 4
  ) * 20;

  const purchaseIntent = (
    (safeNumber(row.q8_memories_influence_purchase_1_5, 0) +
      safeNumber(row.q13_emotional_impact_nostalgia_buy_likelihood_1_5, 0) +
      safeNumber(row.q18_preference_vs_brands_1_3, 0) +
      safeNumber(row.q19_nps_little_tikes_1_5, 0)) / 4
  ) * 20;

  const modernizationScore = (
    (safeNumber(row.q14_perception_brand_feels_modern_1_5, 0) +
      safeNumber(row.q14_perception_brand_incorporate_technology_1_5, 0) +
      (6 - safeNumber(row.q14_perception_brand_keep_traditional_1_5, 0)) +
      safeNumber(row.q14_perception_brand_trendy_social_media_1_5, 0)) / 4
  ) * 20;

  const competitiveStrength = (
    (safeNumber(row.q15_lt_rating_vs_competitors_quality_durability_0_100, 0) +
      safeNumber(row.q15_lt_rating_vs_competitors_safety_trust_0_100, 0) +
      safeNumber(row.q15_lt_rating_vs_competitors_active_imaginative_play_0_100, 0) +
      safeNumber(row.q15_lt_rating_vs_competitors_educational_developmental_0_100, 0) +
      safeNumber(row.q15_lt_rating_vs_competitors_use_of_technology_0_100, 0) +
      safeNumber(row.q15_lt_rating_vs_competitors_childhood_memories_0_100, 0)) / 6
  );

  const attributePriority = {
    'Quality & Durability': ((7 - safeNumber(row.q10_rank_attributes_future_1, 0)) / 6) * 100,
    'Safety & Trust': ((7 - safeNumber(row.q10_rank_attributes_future_2, 0)) / 6) * 100,
    'Active & Imaginative Play': ((7 - safeNumber(row.q10_rank_attributes_future_3, 0)) / 6) * 100,
    'Educational & Developmental': ((7 - safeNumber(row.q10_rank_attributes_future_4, 0)) / 6) * 100,
    'Use of Technology': ((7 - safeNumber(row.q10_rank_attributes_future_5, 0)) / 6) * 100,
    'Childhood Memories': ((7 - safeNumber(row.q10_rank_attributes_future_6, 0)) / 6) * 100,
  };

  const parentProfile = row.children_2_7 === 1 ? 'Active Parent' : 'Non-Parent/Future Parent';

  const platformsArray = safeSplit(row.platforms_selections, ',');
  const platforms = platformsArray.length;
  const digitalAdoption = Math.min((platforms / 7) * 100, 100);

  return {
    nostalgiaIntensity,
    brandTrust,
    purchaseIntent,
    modernizationScore,
    competitiveStrength,
    attributePriority,
    parentProfile,
    digitalAdoption,
  };
};

export const calculateMean = (values: number[]): number => {
  if (!values || values.length === 0) return 0;
  const safeValues = values.map(v => safeNumber(v, 0)).filter(v => !isNaN(v));
  if (safeValues.length === 0) return 0;
  return safeValues.reduce((sum, val) => sum + val, 0) / safeValues.length;
};

export const calculateMedian = (values: number[]): number => {
  if (!values || values.length === 0) return 0;
  const safeValues = values.map(v => safeNumber(v, 0)).filter(v => !isNaN(v));
  if (safeValues.length === 0) return 0;
  const sorted = [...safeValues].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

export const calculateStdDev = (values: number[]): number => {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return Math.sqrt(calculateMean(squaredDiffs));
};

export const calculateMode = (values: number[]): number => {
  if (values.length === 0) return 0;
  const frequency: Record<number, number> = {};
  values.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1;
  });
  return Number(Object.keys(frequency).reduce((a, b) => frequency[Number(a)] > frequency[Number(b)] ? a : b));
};

export const calculatePercentage = (count: number, total: number): number => {
  if (total === 0) return 0;
  return (count / total) * 100;
};

export const calculateNPS = (responses: SurveyResponse[]): { score: number; promoters: number; passives: number; detractors: number } => {
  const promoters = responses.filter(r => r.q19_nps_little_tikes_1_5 >= 4).length;
  const passives = responses.filter(r => r.q19_nps_little_tikes_1_5 === 3).length;
  const detractors = responses.filter(r => r.q19_nps_little_tikes_1_5 <= 2).length;
  const total = responses.length;

  const score = ((promoters - detractors) / total) * 100;

  return {
    score,
    promoters: (promoters / total) * 100,
    passives: (passives / total) * 100,
    detractors: (detractors / total) * 100,
  };
};

export const calculateConfidenceInterval = (p: number, n: number, z: number = 1.96): [number, number] => {
  if (n === 0) return [0, 0];
  const se = Math.sqrt((p * (1 - p)) / n);
  return [Math.max(0, p - z * se), Math.min(1, p + z * se)];
};

export const calculateStandardError = (p: number, n: number): number => {
  if (n === 0) return 0;
  return Math.sqrt((p * (1 - p)) / n);
};

export const calculateChiSquareGoodnessOfFit = (observed: number[], expected: number[]): { chiSquare: number; pValue: number; df: number } => {
  if (observed.length !== expected.length || observed.length === 0) {
    return { chiSquare: 0, pValue: 1, df: 0 };
  }

  let chiSquare = 0;
  for (let i = 0; i < observed.length; i++) {
    if (expected[i] > 0) {
      chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }
  }

  const df = observed.length - 1;
  const pValue = chiSquareToPValue(chiSquare, df);

  return { chiSquare, pValue, df };
};

const chiSquareToPValue = (chiSquare: number, df: number): number => {
  if (df === 1) {
    if (chiSquare >= 3.841) return 0.05;
    if (chiSquare >= 2.706) return 0.10;
    return 0.20;
  } else if (df === 2) {
    if (chiSquare >= 5.991) return 0.05;
    if (chiSquare >= 4.605) return 0.10;
    return 0.20;
  } else if (df === 3) {
    if (chiSquare >= 7.815) return 0.05;
    if (chiSquare >= 6.251) return 0.10;
    return 0.20;
  } else if (df === 5) {
    if (chiSquare >= 11.070) return 0.05;
    if (chiSquare >= 9.236) return 0.10;
    return 0.20;
  }

  if (chiSquare >= 3.841) return 0.05;
  if (chiSquare >= 2.706) return 0.10;
  return 0.20;
};

export const calculateSkewness = (values: number[]): number => {
  if (values.length < 3) return 0;
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);
  if (stdDev === 0) return 0;

  const n = values.length;
  const cubedDiffs = values.map(val => Math.pow((val - mean) / stdDev, 3));
  const sum = cubedDiffs.reduce((acc, val) => acc + val, 0);

  return (n / ((n - 1) * (n - 2))) * sum;
};

export const calculateCronbachAlpha = (items: number[][]): number => {
  const k = items.length;
  if (k < 2) return 0;

  const itemVariances = items.map(item => {
    const variance = calculateStdDev(item) ** 2;
    return variance;
  });

  const totalScores = items[0].map((_, i) => items.reduce((sum, item) => sum + item[i], 0));
  const totalVariance = calculateStdDev(totalScores) ** 2;

  const sumItemVariances = itemVariances.reduce((sum, v) => sum + v, 0);

  const alpha = (k / (k - 1)) * (1 - sumItemVariances / totalVariance);
  return alpha;
};

export const calculateItemTotalCorrelation = (item: number[], totalScore: number[]): number => {
  const n = item.length;
  if (n === 0) return 0;

  const meanItem = calculateMean(item);
  const meanTotal = calculateMean(totalScore);

  let numerator = 0;
  let sumItemSq = 0;
  let sumTotalSq = 0;

  for (let i = 0; i < n; i++) {
    const itemDiff = item[i] - meanItem;
    const totalDiff = totalScore[i] - meanTotal;
    numerator += itemDiff * totalDiff;
    sumItemSq += itemDiff * itemDiff;
    sumTotalSq += totalDiff * totalDiff;
  }

  const denominator = Math.sqrt(sumItemSq * sumTotalSq);
  if (denominator === 0) return 0;

  return numerator / denominator;
};

export const calculatePercentile = (values: number[], percentile: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

export const calculateTTest = (values: number[], testValue: number): { t: number; df: number; p: number } => {
  const n = values.length;
  const mean = calculateMean(values);
  const sd = calculateStdDev(values);
  const se = sd / Math.sqrt(n);

  const t = (mean - testValue) / se;
  const df = n - 1;

  let p = 0.05;
  const absT = Math.abs(t);
  if (absT >= 2.576) p = 0.010;
  else if (absT >= 1.960) p = 0.050;
  else if (absT >= 1.645) p = 0.100;
  else p = 0.200;

  return { t, df, p };
};

export const getMeanInterpretation = (mean: number): string => {
  if (mean >= 4.5) return 'Strongly Agree (highly favorable)';
  if (mean >= 3.5) return 'Agree (favorable)';
  if (mean >= 2.5) return 'Neutral (mixed)';
  if (mean >= 1.5) return 'Disagree (unfavorable)';
  return 'Strongly Disagree (highly unfavorable)';
};

export const getAlphaInterpretation = (alpha: number): string => {
  if (alpha >= 0.80) return 'Good internal consistency';
  if (alpha >= 0.70) return 'Acceptable internal consistency';
  return 'Consider with caution';
};

export const calculateChiSquare = (observed: number[][], expected: number[][]): { chiSquare: number; df: number; pValue: number } => {
  let chiSquare = 0;
  const rows = observed.length;
  const cols = observed[0].length;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (expected[i][j] > 0) {
        chiSquare += Math.pow(observed[i][j] - expected[i][j], 2) / expected[i][j];
      }
    }
  }

  const df = (rows - 1) * (cols - 1);
  const pValue = chiSquareToPValue(chiSquare, df);

  return { chiSquare, df, pValue };
};

export const calculateCramersV = (chiSquare: number, n: number, rows: number, cols: number): number => {
  const minDim = Math.min(rows - 1, cols - 1);
  if (minDim === 0 || n === 0) return 0;
  return Math.sqrt(chiSquare / (n * minDim));
};

export const getCramersVInterpretation = (v: number): string => {
  if (v < 0.10) return 'Negligible association';
  if (v < 0.20) return 'Weak association';
  if (v < 0.40) return 'Moderate association';
  return 'Strong association';
};

export const calculateSpearmanRho = (x: number[], y: number[]): { rho: number; pValue: number; ci95: [number, number] } => {
  const n = x.length;
  if (n < 3) return { rho: 0, pValue: 1, ci95: [0, 0] };

  const rankX = getRanks(x);
  const rankY = getRanks(y);

  const meanRankX = calculateMean(rankX);
  const meanRankY = calculateMean(rankY);

  let numerator = 0;
  let sumXSq = 0;
  let sumYSq = 0;

  for (let i = 0; i < n; i++) {
    const diffX = rankX[i] - meanRankX;
    const diffY = rankY[i] - meanRankY;
    numerator += diffX * diffY;
    sumXSq += diffX * diffX;
    sumYSq += diffY * diffY;
  }

  const denominator = Math.sqrt(sumXSq * sumYSq);
  const rho = denominator > 0 ? numerator / denominator : 0;

  const t = rho * Math.sqrt((n - 2) / (1 - rho * rho));
  const pValue = tTestToPValue(t, n - 2);

  const se = Math.sqrt((1 - rho * rho) / (n - 2));
  const ci95Lower = rho - 1.96 * se;
  const ci95Upper = rho + 1.96 * se;

  return { rho, pValue, ci95: [Math.max(-1, ci95Lower), Math.min(1, ci95Upper)] };
};

const getRanks = (values: number[]): number[] => {
  const sorted = values.map((val, idx) => ({ val, idx })).sort((a, b) => a.val - b.val);
  const ranks = new Array(values.length);

  for (let i = 0; i < sorted.length; i++) {
    ranks[sorted[i].idx] = i + 1;
  }

  return ranks;
};

const tTestToPValue = (t: number, df: number): number => {
  const absT = Math.abs(t);
  if (df <= 30) {
    if (absT >= 2.750) return 0.010;
    if (absT >= 2.042) return 0.050;
    if (absT >= 1.697) return 0.100;
  } else {
    if (absT >= 2.576) return 0.010;
    if (absT >= 1.960) return 0.050;
    if (absT >= 1.645) return 0.100;
  }
  return 0.200;
};

export const getSpearmanInterpretation = (rho: number): string => {
  const absRho = Math.abs(rho);
  const direction = rho >= 0 ? 'positive' : 'negative';

  if (absRho < 0.20) return `Negligible ${direction} correlation`;
  if (absRho < 0.40) return `Weak ${direction} correlation`;
  if (absRho < 0.60) return `Moderate ${direction} correlation`;
  if (absRho < 0.80) return `Strong ${direction} correlation`;
  return `Very strong ${direction} correlation`;
};

export const calculateExpectedFrequencies = (observed: number[][]): number[][] => {
  const rows = observed.length;
  const cols = observed[0].length;
  const expected: number[][] = [];

  const rowTotals = observed.map(row => row.reduce((sum, val) => sum + val, 0));
  const colTotals: number[] = [];
  for (let j = 0; j < cols; j++) {
    colTotals[j] = observed.reduce((sum, row) => sum + row[j], 0);
  }
  const grandTotal = rowTotals.reduce((sum, val) => sum + val, 0);

  for (let i = 0; i < rows; i++) {
    expected[i] = [];
    for (let j = 0; j < cols; j++) {
      expected[i][j] = (rowTotals[i] * colTotals[j]) / grandTotal;
    }
  }

  return expected;
};

export const checkExpectedFrequencyWarning = (expected: number[][]): boolean => {
  let countBelow5 = 0;
  let totalCells = 0;

  for (let i = 0; i < expected.length; i++) {
    for (let j = 0; j < expected[i].length; j++) {
      totalCells++;
      if (expected[i][j] < 5) countBelow5++;
    }
  }

  return (countBelow5 / totalCells) > 0.20;
};

export const calculateKendallW = (rankings: number[][]): { w: number; chiSquare: number; df: number; pValue: number } => {
  const n = rankings.length;
  const k = rankings[0].length;

  const rankSums = new Array(k).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < k; j++) {
      rankSums[j] += rankings[i][j];
    }
  }

  const meanRankSum = rankSums.reduce((sum, val) => sum + val, 0) / k;
  const s = rankSums.reduce((sum, val) => sum + Math.pow(val - meanRankSum, 2), 0);

  const w = (12 * s) / (n * n * (k * k * k - k));

  const chiSquare = n * (k - 1) * w;
  const df = k - 1;
  const pValue = chiSquareToPValue(chiSquare, df);

  return { w, chiSquare, df, pValue };
};

export const getKendallWInterpretation = (w: number): string => {
  if (w < 0.1) return 'Very weak agreement';
  if (w < 0.3) return 'Weak agreement';
  if (w < 0.5) return 'Moderate agreement';
  if (w < 0.7) return 'Strong agreement';
  return 'Very strong agreement';
};

export const calculateConcentrationIndex = (rankedTop: number, rankedBottom: number): number => {
  if (rankedBottom === 0) return rankedTop > 0 ? 999 : 1;
  return rankedTop / rankedBottom;
};

export const getConsensusLevel = (sd: number): string => {
  if (sd < 1.0) return 'High consensus';
  if (sd < 1.5) return 'Medium consensus';
  return 'Low consensus';
};

export const getLabelForValue = (field: string, value: number): string => {
  const labels: Record<string, Record<number, string>> = {
    age_group: { 1: '18-24', 2: '25-29', 3: '30-34', 4: '35-39', 5: '40-44', 6: '45+' },
    gender: { 1: 'Male', 2: 'Female', 3: 'Non-binary', 4: 'Prefer not to say' },
    location: { 1: 'Urban', 2: 'Suburban', 3: 'Rural' },
    household_income: { 1: '<$50K', 2: '$50-99K', 3: '$100-149K', 4: '$150K+', 5: 'Prefer not to answer' },
    number_of_children: { 1: '1 child', 2: '2 children', 3: '3 children', 4: '4 or more children' },
    q12_little_tikes_represents: {
      1: 'Quality & Durability',
      2: 'Safety & Trust',
      3: 'Unlocking Family Memories',
      4: 'Innovation & Developmental Growth',
      5: 'Active & Imaginative Play',
    },
    q17_future_directions_excitement_1_4: {
      1: 'Re-introducing vintage',
      2: 'Tech-enhanced experiences',
      3: 'Pop-culture partnership',
      4: 'Family play time advertising',
    },
    q18_preference_vs_brands_1_3: {
      1: 'Much less',
      2: 'Neutral',
      3: 'Much more',
    },
  };

  return labels[field]?.[value] || String(value);
};
