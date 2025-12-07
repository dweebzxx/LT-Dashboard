import { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, X } from 'lucide-react';
import { useSurveyStore } from '../../store/surveyStore';
import {
 calculateMean,
 calculateMedian,
 calculateStdDev,
 calculateMode,
 calculateConfidenceInterval,
 safeNumber,
 safeFixed,
 calculateStandardError,
 calculateChiSquareGoodnessOfFit,
 calculateSkewness,
 getLabelForValue
} from '../../utils/calculations';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

interface DemographicStats {
 category: string;
 count: number;
 percentage: number;
 ci95: [number, number];
 se: number;
 value?: number;
}

export const DemographicsSection = () => {
 const { data, filteredData, filters, setFilters, applyFilters, resetFilters } = useSurveyStore();

 const hasActiveFilters = useMemo(() => {
  return filters.ageGroups.length > 0 ||
      filters.genders.length > 0 ||
      filters.locations.length > 0 ||
      filters.incomes.length > 0 ||
      filters.hasChildren27 !== 'all';
 }, [filters]);

 const demographics = useMemo(() => {
  const n = filteredData.length;

  const ageStats: DemographicStats[] = Array.from({ length: 6 }, (_, i) => {
   const value = i + 1;
   const count = filteredData.filter(r => r.age_group === value).length;
   const p = count / n;
   const ci95 = calculateConfidenceInterval(p, n);
   const se = calculateStandardError(p, n);

   return {
    category: getLabelForValue('age_group', value),
    count,
    percentage: p * 100,
    ci95: [ci95[0] * 100, ci95[1] * 100],
    se: se * 100,
    value,
   };
  });

  const ageValues = filteredData.map(r => r.age_group);
  const ageChiSquare = calculateChiSquareGoodnessOfFit(
   ageStats.map(s => s.count),
   Array(6).fill(n / 6)
  );
  const modeAge = calculateMode(ageValues);

  const genderStats: DemographicStats[] = [1, 2, 3, 4].map(value => {
   const count = filteredData.filter(r => r.gender === value).length;
   const p = count / n;
   const ci95 = calculateConfidenceInterval(p, n);
   const se = calculateStandardError(p, n);

   return {
    category: getLabelForValue('gender', value),
    count,
    percentage: p * 100,
    ci95: [ci95[0] * 100, ci95[1] * 100],
    se: se * 100,
    value,
   };
  });

  const genderChiSquare = calculateChiSquareGoodnessOfFit(
   genderStats.map(s => s.count),
   Array(4).fill(n / 4)
  );

  const locationStats: DemographicStats[] = [1, 2, 3].map(value => {
   const count = filteredData.filter(r => r.location === value).length;
   const p = count / n;
   const ci95 = calculateConfidenceInterval(p, n);
   const se = calculateStandardError(p, n);

   return {
    category: getLabelForValue('location', value),
    count,
    percentage: p * 100,
    ci95: [ci95[0] * 100, ci95[1] * 100],
    se: se * 100,
    value,
   };
  });

  const locationChiSquare = calculateChiSquareGoodnessOfFit(
   locationStats.map(s => s.count),
   Array(3).fill(n / 3)
  );
  const modeLocation = calculateMode(filteredData.map(r => r.location));

  const incomeStats: DemographicStats[] = [1, 2, 3, 4, 5].map(value => {
   const count = filteredData.filter(r => r.household_income === value).length;
   const p = count / n;
   const ci95 = calculateConfidenceInterval(p, n);
   const se = calculateStandardError(p, n);

   return {
    category: getLabelForValue('household_income', value),
    count,
    percentage: p * 100,
    ci95: [ci95[0] * 100, ci95[1] * 100],
    se: se * 100,
    value,
   };
  });

  const incomeValues = filteredData.filter(r => r.household_income <= 4).map(r => r.household_income);
  const medianIncome = calculateMedian(incomeValues);
  const incomeSkewness = calculateSkewness(incomeValues);
  const preferNotAnswerPct = (incomeStats.find(s => s.value === 5)?.percentage || 0);

  const childrenStats: DemographicStats[] = [1, 2, 3, 4, 5].map(value => {
   const count = filteredData.filter(r => r.number_of_children === value).length;
   const p = count / n;
   const ci95 = calculateConfidenceInterval(p, n);
   const se = calculateStandardError(p, n);

   return {
    category: getLabelForValue('number_of_children', value),
    count,
    percentage: p * 100,
    ci95: [ci95[0] * 100, ci95[1] * 100],
    se: se * 100,
    value,
   };
  });

  const childrenWithKids = filteredData.filter(r => r.number_of_children >= 1 && r.number_of_children <= 4);
  const childrenNumbers = childrenWithKids.map(r => r.number_of_children);
  const meanChildren = calculateMean(childrenNumbers);
  const medianChildren = calculateMedian(childrenNumbers);
  const modeChildren = calculateMode(childrenNumbers);
  const stdDevChildren = calculateStdDev(childrenNumbers);
  const childrenCI = calculateConfidenceInterval(meanChildren / 4, childrenWithKids.length);
  const noKidsCount = childrenStats.find(s => s.value === 5)?.count || 0;

  return {
   ageStats,
   ageChiSquare,
   modeAge,
   genderStats,
   genderChiSquare,
   locationStats,
   locationChiSquare,
   modeLocation,
   incomeStats,
   medianIncome,
   incomeSkewness,
   preferNotAnswerPct,
   childrenStats,
   meanChildren,
   medianChildren,
   modeChildren,
   stdDevChildren,
   childrenCI: [childrenCI[0] * 4, childrenCI[1] * 4],
   noKidsCount,
   totalN: n,
  };
 }, [filteredData]);

 const handleAgeClick = (value: number) => {
  const newAgeGroups = filters.ageGroups.includes(value)
   ? filters.ageGroups.filter(v => v !== value)
   : [...filters.ageGroups, value];
  setFilters({ ...filters, ageGroups: newAgeGroups });
  setTimeout(() => applyFilters(), 0);
 };

 const handleGenderClick = (value: number) => {
  const newGenders = filters.genders.includes(value)
   ? filters.genders.filter(v => v !== value)
   : [...filters.genders, value];
  setFilters({ ...filters, genders: newGenders });
  setTimeout(() => applyFilters(), 0);
 };

 const handleLocationClick = (value: number) => {
  const newLocations = filters.locations.includes(value)
   ? filters.locations.filter(v => v !== value)
   : [...filters.locations, value];
  setFilters({ ...filters, locations: newLocations });
  setTimeout(() => applyFilters(), 0);
 };

 const handleIncomeClick = (value: number) => {
  const newIncomes = filters.incomes.includes(value)
   ? filters.incomes.filter(v => v !== value)
   : [...filters.incomes, value];
  setFilters({ ...filters, incomes: newIncomes });
  setTimeout(() => applyFilters(), 0);
 };

 const exportDemographicsCSV = () => {
  const allStats = [
   ...demographics.ageStats.map(s => ({ variable: 'Age Group', ...s })),
   ...demographics.genderStats.map(s => ({ variable: 'Gender', ...s })),
   ...demographics.locationStats.map(s => ({ variable: 'Location', ...s })),
   ...demographics.incomeStats.map(s => ({ variable: 'Household Income', ...s })),
   ...demographics.childrenStats.map(s => ({ variable: 'Number of Children', ...s })),
  ];

  const headers = ['Variable', 'Category', 'N', 'Percentage', '95% CI Lower', '95% CI Upper', 'SE'];
  const rows = allStats.map(s => [
   s.variable,
   s.category,
   s.count,
   s.percentage.toFixed(1),
   s.ci95[0].toFixed(2),
   s.ci95[1].toFixed(2),
   s.se.toFixed(3),
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'demographics_analysis.csv';
  a.click();
  URL.revokeObjectURL(url);
 };

 const renderStatsTable = (stats: DemographicStats[], chiSquare: { chiSquare: number; pValue: number; df: number }, mode?: number) => (
  <div className="overflow-x-auto mt-4">
   <table className="w-full text-sm">
    <thead className="bg-gray-100">
     <tr>
      <th className="p-2 text-left">Category</th>
      <th className="p-2 text-center">N</th>
      <th className="p-2 text-center">%</th>
      <th className="p-2 text-center">95% CI</th>
      <th className="p-2 text-center">SE</th>
     </tr>
    </thead>
    <tbody>
     {stats.map((stat, idx) => (
      <tr
       key={idx}
       className={`border-t border-gray-200 ${mode === stat.value ? 'bg-blue-50 ' : ''}`}
      >
       <td className="p-2 font-medium">{stat.category} {mode === stat.value && <span className="text-xs text-blue-600">*Modal</span>}</td>
       <td className="p-2 text-center">{stat.count}</td>
       <td className="p-2 text-center">{stat.percentage.toFixed(1)}%</td>
       <td className="p-2 text-center text-xs">[{stat.ci95[0].toFixed(2)} - {stat.ci95[1].toFixed(2)}]</td>
       <td className="p-2 text-center">{stat.se.toFixed(3)}</td>
      </tr>
     ))}
     <tr className="border-t-2 border-gray-300 bg-gray-50/50">
      <td colSpan={5} className="p-2 text-xs">
       <strong>Chi-square test:</strong> χ² = {chiSquare.chiSquare.toFixed(2)}, df = {chiSquare.df}, p = {chiSquare.pValue.toFixed(3)}
       {chiSquare.pValue < 0.05 && <span className="text-blue-600"> *</span>}
      </td>
     </tr>
     <tr className="bg-gray-50/50">
      <td colSpan={5} className="p-2 text-xs">
       <strong>Total N = {demographics.totalN}</strong>
      </td>
     </tr>
    </tbody>
   </table>
  </div>
 );

 return (
  <section className="bg-white shadow-lg rounded-lg p-6">
   <div className="flex items-center justify-between mb-2">
    <h2 className="text-2xl font-bold text-gray-800">Demographics Analysis</h2>
    <button
     onClick={exportDemographicsCSV}
     className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
    >
     <Download size={16} />
     Export Demographics CSV
    </button>
   </div>
   <p className="text-sm text-gray-600 mb-6">Screening Questions: Age Group, Gender, Location, Household Income, Number of Children</p>

   {hasActiveFilters && (
    <div className="mb-6 bg-blue-50 border border-blue-200 rounded p-4">
     <div className="flex items-center justify-between">
      <div className="flex-1">
       <div className="font-semibold text-blue-900 mb-2">Active Filters:</div>
       <div className="flex flex-wrap gap-2 text-sm">
        {filters.ageGroups.map(ag => (
         <span key={ag} className="bg-blue-600 text-white px-2 py-1 rounded">
          Age: {getLabelForValue('age_group', ag)}
         </span>
        ))}
        {filters.genders.map(g => (
         <span key={g} className="bg-blue-600 text-white px-2 py-1 rounded">
          Gender: {getLabelForValue('gender', g)}
         </span>
        ))}
        {filters.locations.map(l => (
         <span key={l} className="bg-blue-600 text-white px-2 py-1 rounded">
          Location: {getLabelForValue('location', l)}
         </span>
        ))}
        {filters.incomes.map(i => (
         <span key={i} className="bg-blue-600 text-white px-2 py-1 rounded">
          Income: {getLabelForValue('household_income', i)}
         </span>
        ))}
       </div>
       <div className="mt-2 text-sm text-blue-800 dark:text-blue-300">
        Filtered N = {demographics.totalN} (Original N = {data.length})
       </div>
      </div>
      <button
       onClick={resetFilters}
       className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
      >
       <X size={16} />
       Reset All Filters
      </button>
     </div>
    </div>
   )}

   <div className="space-y-8">
    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Age Group Distribution</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart
       data={demographics.ageStats}
       layout="vertical"
       onClick={(data) => {
        if (data && data.activePayload && data.activePayload[0]) {
         handleAgeClick(data.activePayload[0].payload.value);
        }
       }}
      >
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis type="number" domain={[0, 'auto']} />
       <YAxis dataKey="category" type="category" width={80} />
       <Tooltip
        formatter={(value: number) => `${value.toFixed(1)}%`}
        content={({ active, payload }) => {
         if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
           <div className="bg-white shadow-lg p-3 border border-gray-300 rounded shadow">
            <div className="font-semibold">{data.category}</div>
            <div>Count: {data.count}</div>
            <div>Percentage: {data.percentage.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">Click to filter</div>
           </div>
          );
         }
         return null;
        }}
       />
       <Bar dataKey="percentage" fill="#3B82F6" cursor="pointer">
        {demographics.ageStats.map((entry, index) => (
         <Cell
          key={`cell-${index}`}
          fill={filters.ageGroups.includes(entry.value || 0) ? '#1E40AF' : '#3B82F6'}
         />
        ))}
       </Bar>
      </BarChart>
     </ResponsiveContainer>
     {renderStatsTable(demographics.ageStats, demographics.ageChiSquare, demographics.modeAge)}
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Gender Distribution</h3>
     <ResponsiveContainer width="100%" height={300}>
      <PieChart>
       <Pie
        data={demographics.genderStats}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
        outerRadius={100}
        fill="#8884d8"
        dataKey="percentage"
        onClick={(data) => handleGenderClick(data.value)}
        cursor="pointer"
       >
        {demographics.genderStats.map((entry, index) => (
         <Cell
          key={`cell-${index}`}
          fill={filters.genders.includes(entry.value || 0) ? '#1E40AF' : COLORS[index % COLORS.length]}
         />
        ))}
       </Pie>
       <Tooltip
        content={({ active, payload }) => {
         if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
           <div className="bg-white shadow-lg p-3 border border-gray-300 rounded shadow">
            <div className="font-semibold">{data.category}</div>
            <div>Count: {data.count}</div>
            <div>Percentage: {data.percentage.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">Click to filter</div>
           </div>
          );
         }
         return null;
        }}
       />
      </PieChart>
     </ResponsiveContainer>
     {renderStatsTable(demographics.genderStats, demographics.genderChiSquare)}
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Location Distribution</h3>
     <ResponsiveContainer width="100%" height={300}>
      <PieChart>
       <Pie
        data={demographics.locationStats}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
        outerRadius={100}
        innerRadius={60}
        fill="#8884d8"
        dataKey="percentage"
        onClick={(data) => handleLocationClick(data.value)}
        cursor="pointer"
       >
        {demographics.locationStats.map((entry, index) => (
         <Cell
          key={`cell-${index}`}
          fill={filters.locations.includes(entry.value || 0) ? '#1E40AF' : COLORS[index % COLORS.length]}
         />
        ))}
       </Pie>
       <Tooltip
        content={({ active, payload }) => {
         if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
           <div className="bg-white shadow-lg p-3 border border-gray-300 rounded shadow">
            <div className="font-semibold">{data.category}</div>
            <div>Count: {data.count}</div>
            <div>Percentage: {data.percentage.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">Click to filter</div>
           </div>
          );
         }
         return null;
        }}
       />
      </PieChart>
     </ResponsiveContainer>
     {renderStatsTable(demographics.locationStats, demographics.locationChiSquare, demographics.modeLocation)}
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Household Income Distribution</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart
       data={demographics.incomeStats}
       layout="vertical"
       onClick={(data) => {
        if (data && data.activePayload && data.activePayload[0]) {
         handleIncomeClick(data.activePayload[0].payload.value);
        }
       }}
      >
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis type="number" domain={[0, 'auto']} />
       <YAxis dataKey="category" type="category" width={150} />
       <Tooltip
        formatter={(value: number) => `${value.toFixed(1)}%`}
        content={({ active, payload }) => {
         if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
           <div className="bg-white shadow-lg p-3 border border-gray-300 rounded shadow">
            <div className="font-semibold">{data.category}</div>
            <div>Count: {data.count}</div>
            <div>Percentage: {data.percentage.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">Click to filter</div>
           </div>
          );
         }
         return null;
        }}
       />
       <Bar dataKey="percentage" fill="#10B981" cursor="pointer">
        {demographics.incomeStats.map((entry, index) => (
         <Cell
          key={`cell-${index}`}
          fill={filters.incomes.includes(entry.value || 0) ? '#065F46' : '#10B981'}
         />
        ))}
       </Bar>
      </BarChart>
     </ResponsiveContainer>
     <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
       <thead className="bg-gray-100">
        <tr>
         <th className="p-2 text-left">Category</th>
         <th className="p-2 text-center">N</th>
         <th className="p-2 text-center">%</th>
         <th className="p-2 text-center">95% CI</th>
         <th className="p-2 text-center">SE</th>
        </tr>
       </thead>
       <tbody>
        {demographics.incomeStats.map((stat, idx) => (
         <tr key={idx} className="border-t border-gray-200">
          <td className="p-2 font-medium">{stat.category}</td>
          <td className="p-2 text-center">{stat.count}</td>
          <td className="p-2 text-center">{stat.percentage.toFixed(1)}%</td>
          <td className="p-2 text-center text-xs">[{stat.ci95[0].toFixed(2)} - {stat.ci95[1].toFixed(2)}]</td>
          <td className="p-2 text-center">{stat.se.toFixed(3)}</td>
         </tr>
        ))}
        <tr className="border-t-2 border-gray-300 bg-gray-50/50">
         <td colSpan={5} className="p-2 text-xs">
          <strong>Median income bracket:</strong> {getLabelForValue('household_income', Math.round(demographics.medianIncome))}
         </td>
        </tr>
        <tr className="bg-gray-50/50">
         <td colSpan={5} className="p-2 text-xs">
          <strong>Skewness coefficient:</strong> {demographics.incomeSkewness.toFixed(3)} (distribution shape)
         </td>
        </tr>
        <tr className="bg-gray-50/50">
         <td colSpan={5} className="p-2 text-xs">
          <strong>Note:</strong> {demographics.preferNotAnswerPct.toFixed(1)}% preferred not to answer
         </td>
        </tr>
       </tbody>
      </table>
     </div>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Number of Children Distribution</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={demographics.childrenStats}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="category" angle={-15} textAnchor="end" height={80} />
       <YAxis />
       <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
       <Bar dataKey="percentage" fill="#F59E0B" />
      </BarChart>
     </ResponsiveContainer>
     <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
       <thead className="bg-gray-100">
        <tr>
         <th className="p-2 text-left">Category</th>
         <th className="p-2 text-center">N</th>
         <th className="p-2 text-center">%</th>
         <th className="p-2 text-center">95% CI</th>
         <th className="p-2 text-center">SE</th>
        </tr>
       </thead>
       <tbody>
        {demographics.childrenStats.map((stat, idx) => (
         <tr key={idx} className="border-t border-gray-200">
          <td className="p-2 font-medium">{stat.category}</td>
          <td className="p-2 text-center">{stat.count}</td>
          <td className="p-2 text-center">{stat.percentage.toFixed(1)}%</td>
          <td className="p-2 text-center text-xs">[{stat.ci95[0].toFixed(2)} - {stat.ci95[1].toFixed(2)}]</td>
          <td className="p-2 text-center">{stat.se.toFixed(3)}</td>
         </tr>
        ))}
        <tr className="border-t-2 border-gray-300 bg-gray-50/50">
         <td colSpan={5} className="p-2 text-xs">
          <strong>Mean number of children (excluding "no kids"):</strong> {demographics.meanChildren.toFixed(2)}
          {' '}(95% CI: [{demographics.childrenCI[0].toFixed(2)} - {demographics.childrenCI[1].toFixed(2)}])
         </td>
        </tr>
        <tr className="bg-gray-50/50">
         <td colSpan={5} className="p-2 text-xs">
          <strong>Standard Deviation:</strong> {demographics.stdDevChildren.toFixed(2)}
         </td>
        </tr>
        <tr className="bg-gray-50/50">
         <td colSpan={5} className="p-2 text-xs">
          <strong>Median:</strong> {demographics.medianChildren} | <strong>Mode:</strong> {demographics.modeChildren}
         </td>
        </tr>
        <tr className="bg-gray-50/50">
         <td colSpan={5} className="p-2 text-xs">
          <strong>NOTE:</strong> {demographics.noKidsCount} respondents don't have kids (excluded from mean calculation)
         </td>
        </tr>
       </tbody>
      </table>
     </div>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Demographics Summary Table</h3>
     <div className="overflow-x-auto">
      <table className="w-full text-xs">
       <thead className="bg-gray-100">
        <tr>
         <th className="p-2 text-left">Variable</th>
         <th className="p-2 text-left">Category</th>
         <th className="p-2 text-center">N</th>
         <th className="p-2 text-center">%</th>
         <th className="p-2 text-center">95% CI</th>
         <th className="p-2 text-center">SE</th>
         <th className="p-2 text-left">Notes</th>
        </tr>
       </thead>
       <tbody>
        {[
         ...demographics.ageStats.map(s => ({ var: 'Age Group', ...s, note: s.value === demographics.modeAge ? 'Modal' : '' })),
         ...demographics.genderStats.map(s => ({ var: 'Gender', ...s, note: '' })),
         ...demographics.locationStats.map(s => ({ var: 'Location', ...s, note: s.value === demographics.modeLocation ? 'Modal' : '' })),
         ...demographics.incomeStats.map(s => ({ var: 'Income', ...s, note: '' })),
         ...demographics.childrenStats.map(s => ({ var: 'Children', ...s, note: '' })),
        ].map((row, idx) => (
         <tr key={idx} className="border-t border-gray-200">
          <td className="p-2">{row.var}</td>
          <td className="p-2">{row.category}</td>
          <td className="p-2 text-center">{row.count}</td>
          <td className="p-2 text-center">{safeFixed(row.percentage, 1)}%</td>
          <td className="p-2 text-center">[{safeFixed(row.ci95?.[0], 2)}-{safeFixed(row.ci95?.[1], 2)}]</td>
          <td className="p-2 text-center">{safeFixed(row.se, 3)}</td>
          <td className="p-2">{row.note}</td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </div>

    <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
     <h4 className="font-semibold text-yellow-900 mb-2">Data Quality Notes</h4>
     <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
      <li>All confidence intervals calculated at 95% confidence level (z = 1.96)</li>
      <li>Chi-square tests compare observed distribution to equal distribution across categories</li>
      <li>Significance marked with * when p &lt; 0.05</li>
      <li>Modal categories highlighted in statistics tables</li>
      <li>Click any chart segment to filter the entire dashboard</li>
      <li>No missing values detected in demographic variables</li>
      <li>Total sample size: N = {data.length}</li>
     </ul>
    </div>
   </div>
  </section>
 );
};
