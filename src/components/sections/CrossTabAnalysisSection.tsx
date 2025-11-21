import { useMemo, useState } from 'react';
import { Download, Copy, X } from 'lucide-react';
import { useSurveyStore } from '../../store/surveyStore';
import {
 calculateChiSquare,
 calculateCramersV,
 getCramersVInterpretation,
 calculateSpearmanRho,
 getSpearmanInterpretation,
 calculateExpectedFrequencies,
 checkExpectedFrequencyWarning,
 getLabelForValue,
} from '../../utils/calculations';

type AnalysisType = 'frequency' | 'row_pct' | 'col_pct' | 'chi_square' | 'effect_size';

interface Variable {
 key: string;
 label: string;
 type: 'categorical' | 'ordinal';
 values: number[];
 getLabel: (value: number) => string;
}

const VARIABLES: Variable[] = [
 { key: 'age_group', label: 'Age Group', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => getLabelForValue('age_group', v) },
 { key: 'gender', label: 'Gender', type: 'categorical', values: [1, 2, 3, 4], getLabel: (v) => getLabelForValue('gender', v) },
 { key: 'location', label: 'Location', type: 'categorical', values: [1, 2, 3], getLabel: (v) => getLabelForValue('location', v) },
 { key: 'household_income', label: 'Household Income', type: 'ordinal', values: [1, 2, 3, 4], getLabel: (v) => getLabelForValue('household_income', v) },
 { key: 'q19_nps_little_tikes_1_5', label: 'NPS Score', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Score ${v}` },
 { key: 'q18_preference_vs_brands_1_3', label: 'Brand Preference', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => getLabelForValue('q18_preference_vs_brands_1_3', v) },
 { key: 'q8_memories_influence_purchase_1_5', label: 'Memory Influence', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'q11_nostalgia_quartile', label: 'Nostalgia Quartile', type: 'ordinal', values: [1, 2, 3, 4], getLabel: (v) => ['0-25', '26-50', '51-75', '76-100'][v - 1] },
 { key: 'q6_childhood_brand_rank_little_tikes', label: 'LT Childhood Rank', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => `Rank ${v}` },
 { key: 'q16_competitor_brand_rating_little_tikes_1_5', label: 'LT Competitor Rating', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Rating ${v}` },
];

export const CrossTabAnalysisSection = () => {
 const { filteredData } = useSurveyStore();
 const [rowVar, setRowVar] = useState<string>('age_group');
 const [colVar, setColVar] = useState<string>('q19_nps_little_tikes_1_5');
 const [analysisType, setAnalysisType] = useState<AnalysisType>('row_pct');
 const [showResults, setShowResults] = useState(true);

 const enrichedData = useMemo(() => {
  return filteredData.map(row => {
   const nostalgia = row.q11_nostalgia_little_tikes_0_100;
   let quartile = 1;
   if (nostalgia > 75) quartile = 4;
   else if (nostalgia > 50) quartile = 3;
   else if (nostalgia > 25) quartile = 2;

   return {
    ...row,
    q11_nostalgia_quartile: quartile,
   };
  });
 }, [filteredData]);

 const crossTabData = useMemo(() => {
  if (!rowVar || !colVar || !showResults) return null;

  const rowVariable = VARIABLES.find(v => v.key === rowVar);
  const colVariable = VARIABLES.find(v => v.key === colVar);

  if (!rowVariable || !colVariable) return null;

  const observed: number[][] = [];
  const rowLabels: string[] = [];
  const colLabels: string[] = [];

  rowVariable.values.forEach((rowVal, i) => {
   rowLabels.push(rowVariable.getLabel(rowVal));
   observed[i] = [];

   colVariable.values.forEach((colVal, j) => {
    if (i === 0) colLabels.push(colVariable.getLabel(colVal));

    const count = enrichedData.filter(d => {
     const rowData = d[rowVar as keyof typeof d];
     const colData = d[colVar as keyof typeof d];
     return rowData === rowVal && colData === colVal;
    }).length;

    observed[i][j] = count;
   });
  });

  const rowTotals = observed.map(row => row.reduce((sum, val) => sum + val, 0));
  const colTotals: number[] = [];
  for (let j = 0; j < colVariable.values.length; j++) {
   colTotals[j] = observed.reduce((sum, row) => sum + row[j], 0);
  }
  const grandTotal = rowTotals.reduce((sum, val) => sum + val, 0);

  const expected = calculateExpectedFrequencies(observed);
  const chiSquareResult = calculateChiSquare(observed, expected);
  const cramersV = calculateCramersV(chiSquareResult.chiSquare, grandTotal, observed.length, observed[0].length);
  const hasExpectedWarning = checkExpectedFrequencyWarning(expected);

  let spearmanResult = null;
  if (rowVariable.type === 'ordinal' && colVariable.type === 'ordinal') {
   const xValues: number[] = [];
   const yValues: number[] = [];

   enrichedData.forEach(d => {
    const xVal = d[rowVar as keyof typeof d] as number;
    const yVal = d[colVar as keyof typeof d] as number;
    if (xVal !== undefined && yVal !== undefined) {
     xValues.push(xVal);
     yValues.push(yVal);
    }
   });

   spearmanResult = calculateSpearmanRho(xValues, yValues);
  }

  return {
   rowVariable,
   colVariable,
   observed,
   expected,
   rowLabels,
   colLabels,
   rowTotals,
   colTotals,
   grandTotal,
   chiSquareResult,
   cramersV,
   hasExpectedWarning,
   spearmanResult,
  };
 }, [enrichedData, rowVar, colVar, showResults]);

 const getCellValue = (rowIdx: number, colIdx: number): string => {
  if (!crossTabData) return '';

  const { observed, rowTotals, colTotals } = crossTabData;
  const count = observed[rowIdx][colIdx];

  switch (analysisType) {
   case 'frequency':
    return String(count);
   case 'row_pct':
    return `${((count / rowTotals[rowIdx]) * 100).toFixed(1)}%`;
   case 'col_pct':
    return `${((count / colTotals[colIdx]) * 100).toFixed(1)}%`;
   case 'chi_square':
   case 'effect_size':
    return `${count} (${((count / crossTabData.grandTotal) * 100).toFixed(1)}%)`;
   default:
    return String(count);
  }
 };

 const getIntensityColor = (rowIdx: number, colIdx: number): string => {
  if (!crossTabData) return 'bg-gray-50';

  const { observed, expected } = crossTabData;
  const obs = observed[rowIdx][colIdx];
  const exp = expected[rowIdx][colIdx];

  if (exp === 0) return 'bg-gray-50';

  const ratio = obs / exp;

  if (ratio > 1.5) return 'bg-green-200 bg-green-200';
  if (ratio > 1.2) return 'bg-green-100 bg-green-200/50';
  if (ratio > 0.8) return 'bg-gray-50';
  if (ratio > 0.5) return 'bg-red-100 bg-red-100';
  return 'bg-red-200 bg-red-200';
 };

 const generateSummary = (): string => {
  if (!crossTabData) return '';

  const { rowVariable, colVariable, chiSquareResult, cramersV, spearmanResult } = crossTabData;
  const sigLevel = chiSquareResult.pValue < 0.001 ? '***' : chiSquareResult.pValue < 0.01 ? '**' : chiSquareResult.pValue < 0.05 ? '*' : '';
  const isSignificant = chiSquareResult.pValue < 0.05;

  let summary = `There is ${isSignificant ? 'a statistically significant' : 'no statistically significant'} association between ${rowVariable.label} and ${colVariable.label} `;
  summary += `(χ²=${chiSquareResult.chiSquare.toFixed(2)}, df=${chiSquareResult.df}, p=${chiSquareResult.pValue.toFixed(4)}${sigLevel}, V=${cramersV.toFixed(2)}). `;
  summary += `The effect size is ${getCramersVInterpretation(cramersV).toLowerCase()}`;

  if (spearmanResult) {
   summary += `, with ${getSpearmanInterpretation(spearmanResult.rho).toLowerCase()} (ρ=${spearmanResult.rho.toFixed(3)}, p=${spearmanResult.pValue.toFixed(4)})`;
  }

  summary += '.';

  return summary;
 };

 const exportCrossTab = () => {
  if (!crossTabData) return;

  const { rowLabels, colLabels, observed, rowTotals, colTotals, grandTotal, chiSquareResult, cramersV } = crossTabData;

  const headers = ['', ...colLabels, 'Total'];
  const rows = rowLabels.map((label, i) => [
   label,
   ...observed[i].map(String),
   String(rowTotals[i])
  ]);
  rows.push(['Total', ...colTotals.map(String), String(grandTotal)]);
  rows.push([]);
  rows.push(['Chi-Square', String(chiSquareResult.chiSquare.toFixed(3))]);
  rows.push(['df', String(chiSquareResult.df)]);
  rows.push(['p-value', String(chiSquareResult.pValue.toFixed(4))]);
  rows.push(['Cramér\'s V', String(cramersV.toFixed(3))]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crosstab_${rowVar}_${colVar}.csv`;
  a.click();
  URL.revokeObjectURL(url);
 };

 const copyStatsToClipboard = () => {
  if (!crossTabData) return;

  const { chiSquareResult, cramersV, spearmanResult } = crossTabData;
  const sigLevel = chiSquareResult.pValue < 0.001 ? '***' : chiSquareResult.pValue < 0.01 ? '**' : chiSquareResult.pValue < 0.05 ? '*' : '';

  let text = `Chi-Square Test Results:\n`;
  text += `χ² = ${chiSquareResult.chiSquare.toFixed(3)}\n`;
  text += `df = ${chiSquareResult.df}\n`;
  text += `p = ${chiSquareResult.pValue.toFixed(4)}${sigLevel}\n`;
  text += `Cramér's V = ${cramersV.toFixed(3)}\n`;
  text += `Effect Size: ${getCramersVInterpretation(cramersV)}\n`;

  if (spearmanResult) {
   text += `\nSpearman's Rho:\n`;
   text += `ρ = ${spearmanResult.rho.toFixed(3)}\n`;
   text += `p = ${spearmanResult.pValue.toFixed(4)}\n`;
   text += `95% CI: [${spearmanResult.ci95[0].toFixed(3)} - ${spearmanResult.ci95[1].toFixed(3)}]\n`;
  }

  navigator.clipboard.writeText(text);
 };

 const renderVariableList = () => (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Variable Definitions & Sources</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-2">Variable Label</th>
              <th className="px-4 py-2">Source Column</th>
              <th className="px-4 py-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {VARIABLES.map((v) => (
              <tr key={v.key} className="bg-white border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-900">{v.label}</td>
                <td className="px-4 py-2 font-mono text-xs">{v.key}</td>
                <td className="px-4 py-2 capitalize">{v.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

 const predefinedCrossTabs = [
  { row: 'age_group', col: 'q19_nps_little_tikes_1_5', label: 'Age × NPS' },
  { row: 'gender', col: 'q19_nps_little_tikes_1_5', label: 'Gender × NPS' },
  { row: 'household_income', col: 'q19_nps_little_tikes_1_5', label: 'Income × NPS' },
  { row: 'location', col: 'q19_nps_little_tikes_1_5', label: 'Location × NPS' },
  { row: 'age_group', col: 'q18_preference_vs_brands_1_3', label: 'Age × Brand Preference' },
  { row: 'household_income', col: 'q18_preference_vs_brands_1_3', label: 'Income × Brand Preference' },
  { row: 'q11_nostalgia_quartile', col: 'q19_nps_little_tikes_1_5', label: 'Nostalgia × NPS' },
  { row: 'q8_memories_influence_purchase_1_5', col: 'age_group', label: 'Memory Influence × Age' },
  { row: 'q6_childhood_brand_rank_little_tikes', col: 'q16_competitor_brand_rating_little_tikes_1_5', label: 'Childhood Rank × Rating' },
 ];

 return (
  <section className="bg-white shadow-lg rounded-lg p-6">
   <h2 className="text-2xl font-bold text-gray-800 mb-6">Cross-Tabulation Analysis Engine</h2>

   <div className="bg-gray-50 p-6 rounded-lg mb-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Cross-Tab Builder</h3>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
       Row Variable
      </label>
      <select
       value={rowVar}
       onChange={(e) => setRowVar(e.target.value)}
       className="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-lg text-gray-800"
      >
       {VARIABLES.map(v => (
        <option key={v.key} value={v.key}>{v.label}</option>
       ))}
      </select>
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
       Column Variable
      </label>
      <select
       value={colVar}
       onChange={(e) => setColVar(e.target.value)}
       className="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-lg text-gray-800"
      >
       {VARIABLES.map(v => (
        <option key={v.key} value={v.key}>{v.label}</option>
       ))}
      </select>
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
       Analysis Type
      </label>
      <select
       value={analysisType}
       onChange={(e) => setAnalysisType(e.target.value as AnalysisType)}
       className="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-lg text-gray-800"
      >
       <option value="frequency">Frequency (Counts)</option>
       <option value="row_pct">Row Percentage</option>
       <option value="col_pct">Column Percentage</option>
       <option value="chi_square">Chi-Square Stats</option>
       <option value="effect_size">Effect Size Analysis</option>
      </select>
     </div>
    </div>

    <div className="flex gap-3">
     <button
      onClick={() => setShowResults(true)}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
     >
      Generate Cross-Tab
     </button>
     <button
      onClick={() => setShowResults(false)}
      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center gap-2"
     >
      <X size={16} />
      Clear Selection
     </button>
    </div>

    <div className="mt-4">
     <div className="text-sm font-medium text-gray-700 mb-2">Quick Select Pre-Defined:</div>
     <div className="flex flex-wrap gap-2">
      {predefinedCrossTabs.map((preset, idx) => (
       <button
        key={idx}
        onClick={() => {
         setRowVar(preset.row);
         setColVar(preset.col);
         setShowResults(true);
        }}
        className="px-3 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
       >
        {preset.label}
       </button>
      ))}
     </div>
    </div>
   </div>

   {crossTabData && showResults && (
    <>
     <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Contingency Table</h3>
      <div className="overflow-x-auto">
       <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-100">
         <tr>
          <th className="p-2 border border-gray-300 text-left">
           {crossTabData.rowVariable.label} \ {crossTabData.colVariable.label}
          </th>
          {crossTabData.colLabels.map((label, idx) => (
           <th key={idx} className="p-2 border border-gray-300 text-center">{label}</th>
          ))}
          <th className="p-2 border border-gray-300 text-center font-bold">Total</th>
         </tr>
        </thead>
        <tbody>
         {crossTabData.rowLabels.map((rowLabel, i) => (
          <tr key={i}>
           <td className="p-2 border border-gray-300 font-medium">{rowLabel}</td>
           {crossTabData.colLabels.map((_, j) => (
            <td
             key={j}
             className={`p-2 border border-gray-300 text-center ${getIntensityColor(i, j)}`}
            >
             {getCellValue(i, j)}
            </td>
           ))}
           <td className="p-2 border border-gray-300 text-center font-bold bg-gray-100">
            {crossTabData.rowTotals[i]}
           </td>
          </tr>
         ))}
         <tr className="bg-gray-100 font-bold">
          <td className="p-2 border border-gray-300">Total</td>
          {crossTabData.colTotals.map((total, idx) => (
           <td key={idx} className="p-2 border border-gray-300 text-center">{total}</td>
          ))}
          <td className="p-2 border border-gray-300 text-center">{crossTabData.grandTotal}</td>
         </tr>
        </tbody>
       </table>
      </div>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
       <h3 className="text-lg font-semibold text-gray-800 mb-3">Chi-Square Test</h3>
       <div className="space-y-2 text-sm">
        <div className="flex justify-between">
         <span>χ² (Chi-square):</span>
         <span className="font-bold">{crossTabData.chiSquareResult.chiSquare.toFixed(3)}</span>
        </div>
        <div className="flex justify-between">
         <span>df (Degrees of Freedom):</span>
         <span className="font-bold">{crossTabData.chiSquareResult.df}</span>
        </div>
        <div className="flex justify-between">
         <span>p-value:</span>
         <span className="font-bold">
          {crossTabData.chiSquareResult.pValue.toFixed(4)}
          {crossTabData.chiSquareResult.pValue < 0.001 && ' ***'}
          {crossTabData.chiSquareResult.pValue >= 0.001 && crossTabData.chiSquareResult.pValue < 0.01 && ' **'}
          {crossTabData.chiSquareResult.pValue >= 0.01 && crossTabData.chiSquareResult.pValue < 0.05 && ' *'}
         </span>
        </div>
        <div className="pt-2 border-t border-blue-200 ">
         <div className="font-semibold">
          {crossTabData.chiSquareResult.pValue < 0.05 ? 'Statistically Significant' : 'No Significant Association'}
         </div>
        </div>
        <div className="flex justify-between">
         <span>Sample Size (N):</span>
         <span className="font-bold">{crossTabData.grandTotal}</span>
        </div>
        {crossTabData.hasExpectedWarning && (
         <div className="pt-2 text-xs text-yellow-700 ">
          ⚠️ Warning: &gt;20% of cells have expected count &lt; 5
         </div>
        )}
       </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded p-4">
       <h3 className="text-lg font-semibold text-gray-800 mb-3">Effect Size</h3>
       <div className="space-y-2 text-sm">
        <div className="flex justify-between">
         <span>Cramér's V:</span>
         <span className="font-bold text-xl">{crossTabData.cramersV.toFixed(3)}</span>
        </div>
        <div className="pt-2 border-t border-green-200 ">
         <div className="font-semibold">{getCramersVInterpretation(crossTabData.cramersV)}</div>
        </div>
        <div className="text-xs mt-3 space-y-1">
         <div>V &lt; 0.10 = Negligible</div>
         <div>V 0.10-0.20 = Weak</div>
         <div>V 0.20-0.40 = Moderate</div>
         <div>V &gt; 0.40 = Strong</div>
        </div>
       </div>
      </div>
     </div>

     {crossTabData.spearmanResult && (
      <div className="bg-purple-50 border border-purple-200 rounded p-4 mb-6">
       <h3 className="text-lg font-semibold text-gray-800 mb-3">Ordinal Association (Spearman's Rho)</h3>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
         <div className="flex justify-between mb-2">
          <span>ρ (Spearman's Rho):</span>
          <span className="font-bold text-xl">{crossTabData.spearmanResult.rho.toFixed(3)}</span>
         </div>
         <div className="flex justify-between mb-2">
          <span>p-value:</span>
          <span className="font-bold">{crossTabData.spearmanResult.pValue.toFixed(4)}</span>
         </div>
         <div className="flex justify-between">
          <span>95% CI:</span>
          <span className="font-bold">
           [{crossTabData.spearmanResult.ci95[0].toFixed(3)} - {crossTabData.spearmanResult.ci95[1].toFixed(3)}]
          </span>
         </div>
        </div>
        <div>
         <div className="font-semibold mb-2">Interpretation:</div>
         <div>{getSpearmanInterpretation(crossTabData.spearmanResult.rho)}</div>
        </div>
       </div>
      </div>
     )}

     <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Summary Interpretation</h3>
      <p className="text-sm text-gray-700">{generateSummary()}</p>
     </div>

     <div className="flex gap-3">
      <button
       onClick={exportCrossTab}
       className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
      >
       <Download size={16} />
       Save This Cross-Tab
      </button>
      <button
       onClick={copyStatsToClipboard}
       className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
      >
       <Copy size={16} />
       Copy Stats to Clipboard
      </button>
     </div>
    </>
   )}
   {renderVariableList()}
  </section>
 );
};
