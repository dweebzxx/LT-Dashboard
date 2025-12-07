import { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ErrorBar } from 'recharts';
import { Download } from 'lucide-react';
import { useSurveyStore } from '../../store/surveyStore';
import {
 calculateMean,
 calculateMedian,
 calculateMode,
 calculateStdDev,
 calculateConfidenceInterval,
 calculateStandardError,
 calculateKendallW,
 getKendallWInterpretation,
 calculateConcentrationIndex,
 getConsensusLevel,
 calculateChiSquareGoodnessOfFit,
 calculateSpearmanRho,
 getSpearmanInterpretation,
 calculateSkewness,
} from '../../utils/calculations';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export const RankingAnalysisSection = () => {
 const { filteredData } = useSurveyStore();

 const rankingData = useMemo(() => {
  const q6Brands = [
   { key: 'q6_childhood_brand_rank_little_tikes', label: 'Little Tikes' },
   { key: 'q6_childhood_brand_rank_fisher_price', label: 'Fisher-Price' },
   { key: 'q6_childhood_brand_rank_playskool', label: 'Playskool' },
   { key: 'q6_childhood_brand_rank_toynado', label: 'Toynado' },
   { key: 'q6_childhood_brand_rank_lego', label: 'LEGO' },
   { key: 'q6_childhood_brand_rank_other', label: 'Other' },
  ];

  const q6Stats = q6Brands.map(brand => {
   const values = filteredData.map(r => r[brand.key as keyof typeof r] as number);
   const n = values.length;
   const mean = calculateMean(values);
   const sd = calculateStdDev(values);
   const se = sd / Math.sqrt(n);
   const ci = calculateConfidenceInterval(mean / 6, n);
   const mode = calculateMode(values);
   const median = calculateMedian(values);
   const pctRanked1st = (values.filter(v => v === 1).length / n) * 100;
   const pctRanked6th = (values.filter(v => v === 6).length / n) * 100;
   const pctTop2 = (values.filter(v => v <= 2).length / n) * 100;
   const pctBottom2 = (values.filter(v => v >= 5).length / n) * 100;
   const concentrationIndex = calculateConcentrationIndex(pctTop2, pctBottom2);
   const modeCount = values.filter(v => v === mode).length;
   const modePct = (modeCount / n) * 100;

   return {
    brand: brand.label,
    meanRank: mean,
    ci95: [ci[0] * 6, ci[1] * 6] as [number, number],
    se,
    sd,
    mode,
    modePct,
    median,
    pctRanked1st,
    pctRanked6th,
    concentrationIndex,
    n,
   };
  });

  const q6Rankings = filteredData.map(r => [
   r.q6_childhood_brand_rank_little_tikes,
   r.q6_childhood_brand_rank_fisher_price,
   r.q6_childhood_brand_rank_playskool,
   r.q6_childhood_brand_rank_toynado,
   r.q6_childhood_brand_rank_lego,
   r.q6_childhood_brand_rank_other,
  ]);
  const q6Kendall = calculateKendallW(q6Rankings);

  const q10Attributes = [
   { key: 'q10_rank_attributes_future_1', label: 'Quality & Durability' },
   { key: 'q10_rank_attributes_future_2', label: 'Safety & Trust' },
   { key: 'q10_rank_attributes_future_3', label: 'Active & Imaginative Play' },
   { key: 'q10_rank_attributes_future_4', label: 'Educational & Developmental' },
   { key: 'q10_rank_attributes_future_5', label: 'Use of Technology' },
   { key: 'q10_rank_attributes_future_6', label: 'My Childhood Memories' },
  ];

  const q10Stats = q10Attributes.map(attr => {
   const values = filteredData.map(r => r[attr.key as keyof typeof r] as number);
   const n = values.length;
   const mean = calculateMean(values);
   const sd = calculateStdDev(values);
   const se = sd / Math.sqrt(n);
   const ci = calculateConfidenceInterval(mean / 6, n);
   const mode = calculateMode(values);
   const median = calculateMedian(values);
   const consensusLevel = getConsensusLevel(sd);

   return {
    attribute: attr.label,
    meanRank: mean,
    ci95: [ci[0] * 6, ci[1] * 6] as [number, number],
    se,
    sd,
    mode,
    median,
    consensusLevel,
    n,
   };
  }).sort((a, b) => a.meanRank - b.meanRank);

  const q10Rankings = filteredData.map(r => [
   r.q10_rank_attributes_future_1,
   r.q10_rank_attributes_future_2,
   r.q10_rank_attributes_future_3,
   r.q10_rank_attributes_future_4,
   r.q10_rank_attributes_future_5,
   r.q10_rank_attributes_future_6,
  ]);
  const q10Kendall = calculateKendallW(q10Rankings);

  const q9Ratings = [
   filteredData.map(r => r.q9_importance_quality_durability_1_5),
   filteredData.map(r => r.q9_importance_safety_trust_1_5),
   filteredData.map(r => r.q9_importance_active_imaginative_play_1_5),
   filteredData.map(r => r.q9_importance_educational_developmental_1_5),
   filteredData.map(r => r.q9_importance_use_of_technology_1_5),
   filteredData.map(r => r.q9_importance_childhood_memories_1_5),
  ];

  const q10Ranks = [
   filteredData.map(r => r.q10_rank_attributes_future_1),
   filteredData.map(r => r.q10_rank_attributes_future_2),
   filteredData.map(r => r.q10_rank_attributes_future_3),
   filteredData.map(r => r.q10_rank_attributes_future_4),
   filteredData.map(r => r.q10_rank_attributes_future_5),
   filteredData.map(r => r.q10_rank_attributes_future_6),
  ];

  const validationData = q10Attributes.map((attr, idx) => {
   const meanRating = calculateMean(q9Ratings[idx]);
   const meanRanking = calculateMean(q10Ranks[idx]);
   return {
    attribute: attr.label,
    meanRating,
    meanRanking,
   };
  });

  const ratingValues = validationData.map(v => v.meanRating);
  const rankingValues = validationData.map(v => v.meanRanking);
  const validationCorrelation = calculateSpearmanRho(ratingValues, rankingValues);

  const q12Options = [
   { value: 1, label: 'Quality & Durability' },
   { value: 2, label: 'Safety & Trust' },
   { value: 3, label: 'Unlocking Family Memories' },
   { value: 4, label: 'Innovation & Developmental Growth' },
   { value: 5, label: 'Active & Imaginative Play' },
  ];

  const q12Stats = q12Options.map(option => {
   const count = filteredData.filter(r => r.q12_little_tikes_represents === option.value).length;
   const n = filteredData.length;
   const p = count / n;
   const ci = calculateConfidenceInterval(p, n);
   const se = calculateStandardError(p, n);

   return {
    essence: option.label,
    count,
    percentage: p * 100,
    ci95: [ci[0] * 100, ci[1] * 100] as [number, number],
    se: se * 100,
   };
  });

  const q12Observed = q12Stats.map(s => s.count);
  const q12Expected = q12Options.map(() => filteredData.length / 5);
  const q12ChiSquare = calculateChiSquareGoodnessOfFit(q12Observed, q12Expected);

  const q17Options = [
   { value: 1, label: 'Re-introducing vintage' },
   { value: 2, label: 'Tech-enhanced experiences' },
   { value: 3, label: 'Pop-culture partnerships' },
   { value: 4, label: 'Family play time advertising' },
  ];

  const q17Stats = q17Options.map(option => {
   const count = filteredData.filter(r => r.q17_future_directions_excitement_1_4 === option.value).length;
   const n = filteredData.length;
   const p = count / n;
   const ci = calculateConfidenceInterval(p, n);

   return {
    direction: option.label,
    count,
    percentage: p * 100,
    ci95: [ci[0] * 100, ci[1] * 100] as [number, number],
   };
  }).sort((a, b) => b.percentage - a.percentage);

  const q17Observed = q17Stats.map(s => s.count);
  const q17Expected = q17Options.map(() => filteredData.length / 4);
  const q17ChiSquare = calculateChiSquareGoodnessOfFit(q17Observed, q17Expected);

  const q18Options = [
   { value: 1, label: 'Much Less' },
   { value: 2, label: 'Neutral' },
   { value: 3, label: 'Much More' },
  ];

  const q18Stats = q18Options.map(option => {
   const count = filteredData.filter(r => r.q18_preference_vs_brands_1_3 === option.value).length;
   const n = filteredData.length;
   const p = count / n;
   const ci = calculateConfidenceInterval(p, n);

   return {
    preference: option.label,
    value: option.value,
    count,
    percentage: p * 100,
    ci95: [ci[0] * 100, ci[1] * 100] as [number, number],
   };
  });

  const q18Values = filteredData.map(r => r.q18_preference_vs_brands_1_3);
  const q18Mean = calculateMean(q18Values);
  const q18Median = calculateMedian(q18Values);
  const q18Mode = calculateMode(q18Values);
  const q18Skewness = calculateSkewness(q18Values);
  const netPreference = q18Stats[2].percentage - q18Stats[0].percentage;

  return {
   q6Stats,
   q6Kendall,
   q10Stats,
   q10Kendall,
   validationData,
   validationCorrelation,
   q12Stats,
   q12ChiSquare,
   q17Stats,
   q17ChiSquare,
   q18Stats,
   q18Mean,
   q18Median,
   q18Mode,
   q18Skewness,
   netPreference,
  };
 }, [filteredData]);

 const exportRankingData = () => {
  const headers = ['Analysis', 'Item', 'Mean/Count', 'SD/Percentage', 'CI_Lower', 'CI_Upper'];
  const rows: string[][] = [];

  rankingData.q6Stats.forEach(s => rows.push(['Q6 Brand Rankings', s.brand, s.meanRank.toFixed(2), s.sd.toFixed(2), s.ci95[0].toFixed(2), s.ci95[1].toFixed(2)]));
  rankingData.q10Stats.forEach(s => rows.push(['Q10 Attribute Rankings', s.attribute, s.meanRank.toFixed(2), s.sd.toFixed(2), s.ci95[0].toFixed(2), s.ci95[1].toFixed(2)]));
  rankingData.q12Stats.forEach(s => rows.push(['Q12 Brand Essence', s.essence, String(s.count), s.percentage.toFixed(1), s.ci95[0].toFixed(2), s.ci95[1].toFixed(2)]));

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ranking_analysis.csv';
  a.click();
  URL.revokeObjectURL(url);
 };

 return (
  <section className="bg-white shadow-lg rounded-lg p-6">
   <div className="flex items-center justify-between mb-2">
    <h2 className="text-2xl font-bold text-gray-800">Ranking & Preference Analysis</h2>
    <button
     onClick={exportRankingData}
     className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
    >
     <Download size={16} />
     Export Ranking Data
    </button>
   </div>
   <p className="text-sm text-gray-600 mb-6">Questions: Q6 (Childhood Brand Rankings), Q10 (Future Attribute Rankings), Q16 (Brand Ratings 1-5), Q18 (Brand Preference)</p>

   <div className="space-y-10">
    <div>
     <h3 className="text-xl font-bold text-gray-800 mb-4">Q6: Childhood Brand Rankings (1=Best, 6=Worst)</h3>
     <ResponsiveContainer width="100%" height={350}>
      <BarChart data={rankingData.q6Stats}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="brand" angle={-15} textAnchor="end" height={100} />
       <YAxis label={{ value: 'Mean Rank (Lower is Better)', angle: -90, position: 'insideLeft' }} domain={[0, 6]} />
       <Tooltip />
       <Bar dataKey="meanRank">
        {rankingData.q6Stats.map((entry, index) => (
         <Cell key={`cell-${index}`} fill={entry.brand === 'Little Tikes' ? '#3B82F6' : '#9CA3AF'} />
        ))}
        <ErrorBar dataKey="ci95" width={4} strokeWidth={2} />
       </Bar>
      </BarChart>
     </ResponsiveContainer>

     <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
       <thead className="bg-gray-100">
        <tr>
         <th className="p-2 text-left">Brand</th>
         <th className="p-2 text-center">Mean Rank</th>
         <th className="p-2 text-center">95% CI</th>
         <th className="p-2 text-center">SD</th>
         <th className="p-2 text-center">Mode</th>
         <th className="p-2 text-center">% Ranked 1st</th>
         <th className="p-2 text-center">% Ranked 6th</th>
         <th className="p-2 text-center">Concentration</th>
         <th className="p-2 text-center">N</th>
        </tr>
       </thead>
       <tbody>
        {rankingData.q6Stats.map((stat, idx) => (
         <tr key={idx} className={`border-t border-gray-200 ${stat.brand === 'Little Tikes' ? 'bg-blue-50 font-semibold' : ''}`}>
          <td className="p-2">{stat.brand}</td>
          <td className="p-2 text-center">{stat.meanRank.toFixed(2)}</td>
          <td className="p-2 text-center text-xs">[{stat.ci95[0].toFixed(2)} - {stat.ci95[1].toFixed(2)}]</td>
          <td className="p-2 text-center">{stat.sd.toFixed(2)}</td>
          <td className="p-2 text-center">{stat.mode} ({stat.modePct.toFixed(1)}%)</td>
          <td className="p-2 text-center">{stat.pctRanked1st.toFixed(1)}%</td>
          <td className="p-2 text-center">{stat.pctRanked6th.toFixed(1)}%</td>
          <td className="p-2 text-center">{stat.concentrationIndex.toFixed(2)}</td>
          <td className="p-2 text-center">{stat.n}</td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>

     <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
      <h4 className="font-semibold text-gray-800 mb-2">Competitive Positioning Insight</h4>
      <ul className="text-sm space-y-1">
       <li>Little Tikes ranked #1 by {rankingData.q6Stats[0].pctRanked1st.toFixed(1)}% of respondents as top childhood brand</li>
       <li>Mean rank: {rankingData.q6Stats[0].meanRank.toFixed(2)} (95% CI: [{rankingData.q6Stats[0].ci95[0].toFixed(2)} - {rankingData.q6Stats[0].ci95[1].toFixed(2)}])</li>
       <li>Kendall's W = {rankingData.q6Kendall.w.toFixed(3)} ({getKendallWInterpretation(rankingData.q6Kendall.w)}), p = {rankingData.q6Kendall.pValue.toFixed(4)}</li>
      </ul>
     </div>
    </div>

    <div>
     <h3 className="text-xl font-bold text-gray-800 mb-4">Q10: Attribute Importance Rankings (1=Most Important)</h3>
     <ResponsiveContainer width="100%" height={350}>
      <BarChart data={rankingData.q10Stats} layout="horizontal">
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="attribute" angle={-15} textAnchor="end" height={100} />
       <YAxis label={{ value: 'Mean Rank (Lower is Better)', angle: -90, position: 'insideLeft' }} domain={[0, 6]} />
       <Tooltip />
       <Bar dataKey="meanRank" fill="#10B981">
        <ErrorBar dataKey="ci95" width={4} strokeWidth={2} />
       </Bar>
      </BarChart>
     </ResponsiveContainer>

     <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
       <thead className="bg-gray-100">
        <tr>
         <th className="p-2 text-left">Attribute</th>
         <th className="p-2 text-center">Mean Rank</th>
         <th className="p-2 text-center">95% CI</th>
         <th className="p-2 text-center">SD</th>
         <th className="p-2 text-center">Mode</th>
         <th className="p-2 text-center">Consensus Level</th>
        </tr>
       </thead>
       <tbody>
        {rankingData.q10Stats.map((stat, idx) => (
         <tr key={idx} className="border-t border-gray-200">
          <td className="p-2">{stat.attribute}</td>
          <td className="p-2 text-center font-bold">{stat.meanRank.toFixed(2)}</td>
          <td className="p-2 text-center text-xs">[{stat.ci95[0].toFixed(2)} - {stat.ci95[1].toFixed(2)}]</td>
          <td className="p-2 text-center">{stat.sd.toFixed(2)}</td>
          <td className="p-2 text-center">{stat.mode}</td>
          <td className="p-2 text-center">{stat.consensusLevel}</td>
         </tr>
        ))}
        <tr className="border-t-2 border-gray-300 bg-gray-50/50">
         <td colSpan={6} className="p-2 text-xs">
          <strong>Overall agreement on attribute importance:</strong> W = {rankingData.q10Kendall.w.toFixed(3)}, χ² = {rankingData.q10Kendall.chiSquare.toFixed(2)}, df = {rankingData.q10Kendall.df}, p = {rankingData.q10Kendall.pValue.toFixed(4)} ({getKendallWInterpretation(rankingData.q10Kendall.w)})
         </td>
        </tr>
       </tbody>
      </table>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      <div>
       <h4 className="font-semibold text-gray-800 mb-3">Validation Check: Q10 Rankings vs Q9 Ratings</h4>
       <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
         <CartesianGrid />
         <XAxis dataKey="meanRating" label={{ value: 'Q9 Mean Rating (1-5)', position: 'insideBottom', offset: -5 }} />
         <YAxis dataKey="meanRanking" label={{ value: 'Q10 Mean Rank (1-6)', angle: -90, position: 'insideLeft' }} />
         <Tooltip cursor={{ strokeDasharray: '3 3' }} />
         <Scatter data={rankingData.validationData} fill="#8B5CF6" />
        </ScatterChart>
       </ResponsiveContainer>
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded p-4">
       <h4 className="font-semibold text-gray-800 mb-2">Convergent Validity</h4>
       <div className="text-sm space-y-2">
        <div className="flex justify-between">
         <span>Spearman's ρ:</span>
         <span className="font-bold">{rankingData.validationCorrelation.rho.toFixed(3)}</span>
        </div>
        <div className="flex justify-between">
         <span>p-value:</span>
         <span className="font-bold">{rankingData.validationCorrelation.pValue.toFixed(4)}</span>
        </div>
        <div className="flex justify-between">
         <span>95% CI:</span>
         <span className="font-bold text-xs">[{rankingData.validationCorrelation.ci95[0].toFixed(3)} - {rankingData.validationCorrelation.ci95[1].toFixed(3)}]</span>
        </div>
        <div className="pt-2 border-t border-purple-200 dark:border-purple-700 mt-2">
         <strong>Interpretation:</strong> {getSpearmanInterpretation(rankingData.validationCorrelation.rho)} indicates consistent attribute importance across question types.
        </div>
       </div>
      </div>
     </div>

     <ResponsiveContainer width="100%" height={350} className="mt-6">
      <RadarChart data={rankingData.q10Stats}>
       <PolarGrid />
       <PolarAngleAxis dataKey="attribute" />
       <PolarRadiusAxis domain={[0, 6]} />
       <Tooltip />
       <Radar name="Mean Rank" dataKey="meanRank" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
      </RadarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-xl font-bold text-gray-800 mb-4">Q12: Brand Essence - What Represents Little Tikes?</h3>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ResponsiveContainer width="100%" height={300}>
       <PieChart>
        <Pie
         data={rankingData.q12Stats}
         cx="50%"
         cy="50%"
         labelLine={false}
         label={({ essence, percentage }) => `${essence}: ${percentage.toFixed(1)}%`}
         outerRadius={100}
         fill="#8884d8"
         dataKey="percentage"
        >
         {rankingData.q12Stats.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
         ))}
        </Pie>
        <Tooltip />
       </PieChart>
      </ResponsiveContainer>

      <div className="overflow-x-auto">
       <table className="w-full text-sm">
        <thead className="bg-gray-100">
         <tr>
          <th className="p-2 text-left">Brand Essence</th>
          <th className="p-2 text-center">Count</th>
          <th className="p-2 text-center">%</th>
          <th className="p-2 text-center">95% CI</th>
         </tr>
        </thead>
        <tbody>
         {rankingData.q12Stats.map((stat, idx) => (
          <tr key={idx} className="border-t border-gray-200">
           <td className="p-2">{stat.essence}</td>
           <td className="p-2 text-center">{stat.count}</td>
           <td className="p-2 text-center font-bold">{stat.percentage.toFixed(1)}%</td>
           <td className="p-2 text-center text-xs">[{stat.ci95[0].toFixed(1)} - {stat.ci95[1].toFixed(1)}]</td>
          </tr>
         ))}
         <tr className="border-t-2 border-gray-300 bg-gray-50/50">
          <td colSpan={4} className="p-2 text-xs">
           <strong>Chi-square test:</strong> χ² = {rankingData.q12ChiSquare.chiSquare.toFixed(2)}, df = {rankingData.q12ChiSquare.df}, p = {rankingData.q12ChiSquare.pValue.toFixed(4)}
           {rankingData.q12ChiSquare.pValue < 0.05 ? ' - Distribution significantly differs from random (p < 0.05)' : ''}
          </td>
         </tr>
        </tbody>
       </table>
      </div>
     </div>

     <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-4">
      <h4 className="font-semibold text-gray-800 mb-2">Modal Essence</h4>
      <p className="text-sm">
       Most respondents ({rankingData.q12Stats[0].percentage.toFixed(1)}%) believe Little Tikes represents <strong>{rankingData.q12Stats[0].essence}</strong>
      </p>
     </div>
    </div>

    <div>
     <h3 className="text-xl font-bold text-gray-800 mb-4">Q17: Future Direction Preferences</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={rankingData.q17Stats} layout="horizontal">
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="direction" angle={-15} textAnchor="end" height={100} />
       <YAxis label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }} />
       <Tooltip />
       <Bar dataKey="percentage" fill="#F59E0B">
        {rankingData.q17Stats.map((entry, index) => (
         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
       </Bar>
      </BarChart>
     </ResponsiveContainer>

     <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
       <thead className="bg-gray-100">
        <tr>
         <th className="p-2 text-left">Direction</th>
         <th className="p-2 text-center">Count</th>
         <th className="p-2 text-center">%</th>
         <th className="p-2 text-center">95% CI</th>
         <th className="p-2 text-center">Rank</th>
        </tr>
       </thead>
       <tbody>
        {rankingData.q17Stats.map((stat, idx) => (
         <tr key={idx} className="border-t border-gray-200">
          <td className="p-2">{stat.direction}</td>
          <td className="p-2 text-center">{stat.count}</td>
          <td className="p-2 text-center font-bold">{stat.percentage.toFixed(1)}%</td>
          <td className="p-2 text-center text-xs">[{stat.ci95[0].toFixed(1)} - {stat.ci95[1].toFixed(1)}]</td>
          <td className="p-2 text-center">#{idx + 1}</td>
         </tr>
        ))}
        <tr className="border-t-2 border-gray-300 bg-gray-50/50">
         <td colSpan={5} className="p-2 text-xs">
          <strong>Chi-square test:</strong> χ² = {rankingData.q17ChiSquare.chiSquare.toFixed(2)}, df = {rankingData.q17ChiSquare.df}, p = {rankingData.q17ChiSquare.pValue.toFixed(4)}
         </td>
        </tr>
       </tbody>
      </table>
     </div>

     <div className="bg-green-50 border border-green-200 rounded p-4 mt-4">
      <h4 className="font-semibold text-gray-800 mb-2">Key Insights</h4>
      <ul className="text-sm space-y-1 list-disc list-inside">
       <li>Most preferred: {rankingData.q17Stats[0].direction} ({rankingData.q17Stats[0].percentage.toFixed(1)}%)</li>
       <li>Least preferred: {rankingData.q17Stats[3].direction} ({rankingData.q17Stats[3].percentage.toFixed(1)}%)</li>
      </ul>
     </div>
    </div>

    <div>
     <h3 className="text-xl font-bold text-gray-800 mb-4">Q18: Brand Preference vs Competitors</h3>
     <ResponsiveContainer width="100%" height={200}>
      <BarChart data={rankingData.q18Stats} layout="horizontal">
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="preference" />
       <YAxis label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }} />
       <Tooltip />
       <Bar dataKey="percentage">
        {rankingData.q18Stats.map((entry, index) => (
         <Cell key={`cell-${index}`} fill={entry.value === 1 ? '#EF4444' : entry.value === 2 ? '#9CA3AF' : '#10B981'} />
        ))}
       </Bar>
      </BarChart>
     </ResponsiveContainer>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      <div className="overflow-x-auto">
       <table className="w-full text-sm">
        <thead className="bg-gray-100">
         <tr>
          <th className="p-2 text-left">Preference</th>
          <th className="p-2 text-center">Count</th>
          <th className="p-2 text-center">%</th>
          <th className="p-2 text-center">95% CI</th>
         </tr>
        </thead>
        <tbody>
         {rankingData.q18Stats.map((stat, idx) => (
          <tr key={idx} className="border-t border-gray-200">
           <td className="p-2">{stat.preference}</td>
           <td className="p-2 text-center">{stat.count}</td>
           <td className="p-2 text-center font-bold">{stat.percentage.toFixed(1)}%</td>
           <td className="p-2 text-center text-xs">[{stat.ci95[0].toFixed(1)} - {stat.ci95[1].toFixed(1)}]</td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4">
       <h4 className="font-semibold text-gray-800 mb-3">Summary Statistics</h4>
       <div className="text-sm space-y-2">
        <div className="flex justify-between">
         <span>Mean score (1-3):</span>
         <span className="font-bold">{rankingData.q18Mean.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
         <span>Median:</span>
         <span className="font-bold">{rankingData.q18Median}</span>
        </div>
        <div className="flex justify-between">
         <span>Mode:</span>
         <span className="font-bold">{rankingData.q18Mode}</span>
        </div>
        <div className="flex justify-between">
         <span>Skewness:</span>
         <span className="font-bold">{rankingData.q18Skewness.toFixed(3)}</span>
        </div>
        <div className="pt-2 border-t border-blue-200 mt-2">
         <div className="flex justify-between">
          <span className="font-semibold">Net Preference:</span>
          <span className={`font-bold text-lg ${rankingData.netPreference > 0 ? 'text-green-600' : rankingData.netPreference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
           {rankingData.netPreference > 0 ? '+' : ''}{rankingData.netPreference.toFixed(1)}%
          </span>
         </div>
         <div className="text-xs text-gray-600 mt-1">
          (% Much More - % Much Less)
         </div>
        </div>
        <div className="pt-2 text-xs">
         Distribution skewed toward {rankingData.q18Skewness < -0.3 ? 'preference' : rankingData.q18Skewness > 0.3 ? 'against' : 'neutral'}
        </div>
       </div>
      </div>
     </div>
    </div>
   </div>
  </section>
 );
};
