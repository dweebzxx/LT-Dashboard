import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell } from 'recharts';
import { Download, Gauge } from 'lucide-react';
import { useSurveyStore } from '../../store/surveyStore';
import {
 calculateMean,
 calculateMedian,
 calculateMode,
 calculateStdDev,
 calculateSkewness,
 calculateCronbachAlpha,
 calculateItemTotalCorrelation,
 calculatePercentile,
 calculateTTest,
 getMeanInterpretation,
 getAlphaInterpretation,
 calculateConfidenceInterval,
} from '../../utils/calculations';

const LIKERT_COLORS = {
 1: '#DC2626',
 2: '#FCA5A5',
 3: '#9CA3AF',
 4: '#86EFAC',
 5: '#15803D',
};

const LIKERT_LABELS = {
 1: 'Strongly Disagree',
 2: 'Disagree',
 3: 'Neither',
 4: 'Agree',
 5: 'Strongly Agree',
};

interface LikertStats {
 label: string;
 distribution: { category: string; count: number; percentage: number; cumulative: number }[];
 n: number;
 mean: number;
 sem: number;
 ci95: [number, number];
 sd: number;
 median: number;
 mode: number;
 skewness: number;
 interpretation: string;
}

export const BrandPerceptionSentimentSection = () => {
 const { filteredData } = useSurveyStore();

 const perceptionData = useMemo(() => {
  const calculateLikertStats = (values: number[], label: string): LikertStats => {
   const n = values.length;
   const mean = calculateMean(values);
   const sd = calculateStdDev(values);
   const sem = sd / Math.sqrt(n);
   const ci95Lower = mean - 1.96 * sem;
   const ci95Upper = mean + 1.96 * sem;

   const distribution = [1, 2, 3, 4, 5].map((cat, idx) => {
    const count = values.filter(v => v === cat).length;
    const percentage = (count / n) * 100;
    const cumulative = values.filter(v => v <= cat).length / n * 100;
    return {
     category: LIKERT_LABELS[cat as keyof typeof LIKERT_LABELS],
     count,
     percentage,
     cumulative,
    };
   });

   return {
    label,
    distribution,
    n,
    mean,
    sem,
    ci95: [ci95Lower, ci95Upper],
    sd,
    median: calculateMedian(values),
    mode: calculateMode(values),
    skewness: calculateSkewness(values),
    interpretation: getMeanInterpretation(mean),
   };
  };

  const q7Items = [
   { key: 'q7_memories_childhood_toys_vivid_memories_1_5', label: 'I have vivid memories of playing with my favorite toys' },
   { key: 'q7_memories_childhood_toys_reminds_childhood_1_5', label: 'Seeing my favorite toys today reminds me of my childhood' },
   { key: 'q7_memories_childhood_toys_want_child_experience_1_5', label: 'I want my child to experience my favorite childhood toy' },
   { key: 'q7_memories_childhood_toys_not_relevant_today_1_5', label: 'My favorite childhood toys do not feel relevant today [REVERSE]' },
  ];

  const q7Stats = q7Items.map(item => {
   const values = filteredData.map(r => r[item.key as keyof typeof r] as number);
   return calculateLikertStats(values, item.label);
  });

  const q7ItemsData = q7Items.map(item => filteredData.map(r => r[item.key as keyof typeof r] as number));
  const q7Alpha = calculateCronbachAlpha(q7ItemsData);
  const q7TotalScores = filteredData.map((_, i) => q7ItemsData.reduce((sum, item) => sum + item[i], 0));
  const q7Correlations = q7ItemsData.map(item => calculateItemTotalCorrelation(item, q7TotalScores));

  const q8Stats = calculateLikertStats(
   filteredData.map(r => r.q8_memories_influence_purchase_1_5),
   'To what extent do childhood memories influence purchasing?'
  );

  const q9Items = [
   { key: 'q9_importance_quality_durability_1_5', label: 'Quality & Durability' },
   { key: 'q9_importance_safety_trust_1_5', label: 'Safety & Trust' },
   { key: 'q9_importance_active_imaginative_play_1_5', label: 'Active & Imaginative Play' },
   { key: 'q9_importance_educational_developmental_1_5', label: 'Educational & Developmental Value' },
   { key: 'q9_importance_use_of_technology_1_5', label: 'Use of Technology' },
   { key: 'q9_importance_childhood_memories_1_5', label: 'My Childhood Memories' },
  ];

  const q9Stats = q9Items.map(item => {
   const values = filteredData.map(r => r[item.key as keyof typeof r] as number);
   return calculateLikertStats(values, item.label);
  });

  const q9ItemsData = q9Items.map(item => filteredData.map(r => r[item.key as keyof typeof r] as number));
  const q9Alpha = calculateCronbachAlpha(q9ItemsData);
  const q9TotalScores = filteredData.map((_, i) => q9ItemsData.reduce((sum, item) => sum + item[i], 0));
  const q9Correlations = q9ItemsData.map(item => calculateItemTotalCorrelation(item, q9TotalScores));

  const q13Items = [
   { key: 'q13_emotional_impact_makes_nostalgic_1_5', label: 'Little Tikes makes me feel nostalgic' },
   { key: 'q13_emotional_impact_nostalgia_buy_likelihood_1_5', label: 'Nostalgia makes me more likely to buy Little Tikes' },
   { key: 'q13_emotional_impact_trust_vs_newer_1_5', label: 'Nostalgia makes me trust Little Tikes more than newer brands' },
  ];

  const q13Stats = q13Items.map(item => {
   const values = filteredData.map(r => r[item.key as keyof typeof r] as number);
   return calculateLikertStats(values, item.label);
  });

  const q13ItemsData = q13Items.map(item => filteredData.map(r => r[item.key as keyof typeof r] as number));
  const q13Alpha = calculateCronbachAlpha(q13ItemsData);
  const q13TotalScores = filteredData.map((_, i) => q13ItemsData.reduce((sum, item) => sum + item[i], 0));
  const q13Correlations = q13ItemsData.map(item => calculateItemTotalCorrelation(item, q13TotalScores));

  const q14Items = [
   { key: 'q14_perception_brand_feels_modern_1_5', label: 'Little Tikes feels modern and up-to-date' },
   { key: 'q14_perception_brand_incorporate_technology_1_5', label: 'Should incorporate more technology or digital play' },
   { key: 'q14_perception_brand_keep_traditional_1_5', label: 'Should keep traditional look and feel' },
   { key: 'q14_perception_brand_trendy_social_media_1_5', label: 'Featured in trendy or social-media-relevant ways' },
  ];

  const q14Stats = q14Items.map(item => {
   const values = filteredData.map(r => r[item.key as keyof typeof r] as number);
   return calculateLikertStats(values, item.label);
  });

  const q14ItemsData = q14Items.map(item => filteredData.map(r => r[item.key as keyof typeof r] as number));
  const q14Alpha = calculateCronbachAlpha(q14ItemsData);
  const q14TotalScores = filteredData.map((_, i) => q14ItemsData.reduce((sum, item) => sum + item[i], 0));
  const q14Correlations = q14ItemsData.map(item => calculateItemTotalCorrelation(item, q14TotalScores));

  const q16Brands = [
   { key: 'q16_competitor_brand_rating_fisher_price_1_5', label: 'Fisher-Price' },
   { key: 'q16_competitor_brand_rating_step2_1_5', label: 'Step2' },
   { key: 'q16_competitor_brand_rating_melissa_doug_1_5', label: 'Melissa & Doug' },
   { key: 'q16_competitor_brand_rating_lego_1_5', label: 'LEGO' },
   { key: 'q16_competitor_brand_rating_tonies_1_5', label: 'Tonies' },
   { key: 'q16_competitor_brand_rating_lovevery_1_5', label: 'Lovevery' },
   { key: 'q16_competitor_brand_rating_toynado_1_5', label: 'Toynado' },
   { key: 'q16_competitor_brand_rating_little_tikes_1_5', label: 'Little Tikes' },
  ];

  const q16Stats = q16Brands.map(brand => {
   const values = filteredData.map(r => r[brand.key as keyof typeof r] as number);
   return calculateLikertStats(values, brand.label);
  });

  const q19Stats = calculateLikertStats(
   filteredData.map(r => r.q19_nps_little_tikes_1_5),
   'Likelihood to recommend Little Tikes to another parent'
  );

  const q11Values = filteredData.map(r => r.q11_nostalgia_little_tikes_0_100);
  const q11Stats = {
   mean: calculateMean(q11Values),
   median: calculateMedian(q11Values),
   sd: calculateStdDev(q11Values),
   ci95: calculateConfidenceInterval(calculateMean(q11Values) / 100, q11Values.length),
   min: Math.min(...q11Values),
   max: Math.max(...q11Values),
   q1: calculatePercentile(q11Values, 25),
   q3: calculatePercentile(q11Values, 75),
   pctAbove50: (q11Values.filter(v => v > 50).length / q11Values.length) * 100,
   pctBelow25: (q11Values.filter(v => v < 25).length / q11Values.length) * 100,
  };

  const q15Attributes = [
   { key: 'q15_lt_rating_vs_competitors_quality_durability_0_100', label: 'Quality & Durability' },
   { key: 'q15_lt_rating_vs_competitors_safety_trust_0_100', label: 'Safety & Trust' },
   { key: 'q15_lt_rating_vs_competitors_active_imaginative_play_0_100', label: 'Active & Imaginative Play' },
   { key: 'q15_lt_rating_vs_competitors_educational_developmental_0_100', label: 'Educational & Developmental Value' },
   { key: 'q15_lt_rating_vs_competitors_use_of_technology_0_100', label: 'Use of Technology' },
   { key: 'q15_lt_rating_vs_competitors_childhood_memories_0_100', label: 'My Childhood Memories' },
  ];

  const q15Stats = q15Attributes.map(attr => {
   const values = filteredData.map(r => r[attr.key as keyof typeof r] as number);
   const mean = calculateMean(values);
   const sd = calculateStdDev(values);
   const n = values.length;
   const ci = calculateConfidenceInterval(mean / 100, n);
   const tTest = calculateTTest(values, 50);
   const pctAbove50 = (values.filter(v => v > 50).length / n) * 100;

   return {
    label: attr.label,
    mean,
    ci95: [ci[0] * 100, ci[1] * 100] as [number, number],
    sd,
    pctAbove50,
    tTest,
    competitive: mean > 50 ? 'Strong vs competitors' : 'Below market',
   };
  });

  return {
   q7Stats,
   q7Alpha,
   q7Correlations,
   q8Stats,
   q9Stats,
   q9Alpha,
   q9Correlations,
   q13Stats,
   q13Alpha,
   q13Correlations,
   q14Stats,
   q14Alpha,
   q14Correlations,
   q16Stats,
   q19Stats,
   q11Stats,
   q15Stats,
  };
 }, [filteredData]);

 const exportPerceptionCSV = () => {
  const headers = ['Scale', 'Item', 'Mean', '95% CI Lower', '95% CI Upper', 'SD', 'Median', 'Mode', 'Skewness', 'Interpretation'];
  const rows: string[][] = [];

  perceptionData.q7Stats.forEach(stat => rows.push(['Q7 Memory & Nostalgia', stat.label, stat.mean.toFixed(2), stat.ci95[0].toFixed(2), stat.ci95[1].toFixed(2), stat.sd.toFixed(2), stat.median.toFixed(1), String(stat.mode), stat.skewness.toFixed(3), stat.interpretation]));
  rows.push(['Q7 Scale Reliability', 'Cronbach Alpha', String(perceptionData.q7Alpha.toFixed(3)), '', '', '', '', '', '', getAlphaInterpretation(perceptionData.q7Alpha)]);

  rows.push(['Q8 Memory Influence', perceptionData.q8Stats.label, perceptionData.q8Stats.mean.toFixed(2), perceptionData.q8Stats.ci95[0].toFixed(2), perceptionData.q8Stats.ci95[1].toFixed(2), perceptionData.q8Stats.sd.toFixed(2), perceptionData.q8Stats.median.toFixed(1), String(perceptionData.q8Stats.mode), perceptionData.q8Stats.skewness.toFixed(3), perceptionData.q8Stats.interpretation]);

  perceptionData.q9Stats.forEach(stat => rows.push(['Q9 Importance Ratings', stat.label, stat.mean.toFixed(2), stat.ci95[0].toFixed(2), stat.ci95[1].toFixed(2), stat.sd.toFixed(2), stat.median.toFixed(1), String(stat.mode), stat.skewness.toFixed(3), stat.interpretation]));
  rows.push(['Q9 Scale Reliability', 'Cronbach Alpha', String(perceptionData.q9Alpha.toFixed(3)), '', '', '', '', '', '', getAlphaInterpretation(perceptionData.q9Alpha)]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'brand_perception_sentiment.csv';
  a.click();
  URL.revokeObjectURL(url);
 };

 const renderLikertChart = (stats: LikertStats) => {
  const stackedData = [{
   name: 'Distribution',
   ...Object.fromEntries(stats.distribution.map(d => [d.category, d.percentage]))
  }];

  return (
   <div className="mb-8">
    <h4 className="text-md font-semibold text-gray-800 mb-3">{stats.label}</h4>
    <ResponsiveContainer width="100%" height={80}>
     <BarChart data={stackedData} layout="horizontal" stackOffset="expand">
      <XAxis type="number" domain={[0, 1]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} hide />
      <YAxis type="category" dataKey="name" width={0} />
      <Tooltip
       formatter={(value: number) => `${(value).toFixed(1)}%`}
       content={({ payload }) => {
        if (!payload || !payload.length) return null;
        return (
         <div className="bg-white shadow-lg p-3 border border-gray-300 rounded shadow">
          {stats.distribution.map((d, idx) => (
           <div key={idx} style={{ color: LIKERT_COLORS[(idx + 1) as keyof typeof LIKERT_COLORS] }}>
            {d.category}: {d.count} ({d.percentage.toFixed(1)}%)
           </div>
          ))}
         </div>
        );
       }}
      />
      {[1, 2, 3, 4, 5].map(cat => (
       <Bar
        key={cat}
        dataKey={LIKERT_LABELS[cat as keyof typeof LIKERT_LABELS]}
        stackId="a"
        fill={LIKERT_COLORS[cat as keyof typeof LIKERT_COLORS]}
       />
      ))}
     </BarChart>
    </ResponsiveContainer>

    <div className="overflow-x-auto mt-3">
     <table className="w-full text-xs">
      <thead className="bg-gray-100">
       <tr>
        <th className="p-2 text-left">Response Distribution</th>
        {stats.distribution.map((d, idx) => (
         <th key={idx} className="p-2 text-center">{d.category}</th>
        ))}
       </tr>
      </thead>
      <tbody>
       <tr className="border-t border-gray-200">
        <td className="p-2 font-medium">Count</td>
        {stats.distribution.map((d, idx) => (
         <td key={idx} className="p-2 text-center">{d.count}</td>
        ))}
       </tr>
       <tr className="border-t border-gray-200">
        <td className="p-2 font-medium">%</td>
        {stats.distribution.map((d, idx) => (
         <td key={idx} className="p-2 text-center">{d.percentage.toFixed(1)}%</td>
        ))}
       </tr>
       <tr className="border-t border-gray-200">
        <td className="p-2 font-medium">Cumulative %</td>
        {stats.distribution.map((d, idx) => (
         <td key={idx} className="p-2 text-center">{d.cumulative.toFixed(1)}%</td>
        ))}
       </tr>
      </tbody>
     </table>

     <table className="w-full text-xs mt-3">
      <thead className="bg-gray-100">
       <tr>
        <th className="p-2 text-left" colSpan={2}>Summary Statistics</th>
       </tr>
      </thead>
      <tbody>
       <tr className="border-t border-gray-200">
        <td className="p-2 font-medium">N</td>
        <td className="p-2">{stats.n}</td>
       </tr>
       <tr className="border-t border-gray-200">
        <td className="p-2 font-medium">Mean (1-5)</td>
        <td className="p-2">{stats.mean.toFixed(2)}</td>
       </tr>
       <tr className="border-t border-gray-200">
        <td className="p-2 font-medium">Standard Error (SEM)</td>
        <td className="p-2">{stats.sem.toFixed(3)}</td>
       </tr>
       <tr className="border-t border-gray-200">
        <td className="p-2 font-medium">95% CI</td>
        <td className="p-2">[{stats.ci95[0].toFixed(2)} - {stats.ci95[1].toFixed(2)}]</td>
       </tr>
       <tr className="border-t border-gray-200">
        <td className="p-2 font-medium">Standard Deviation</td>
        <td className="p-2">{stats.sd.toFixed(2)}</td>
       </tr>
       <tr className="border-t border-gray-200">
        <td className="p-2 font-medium">Median</td>
        <td className="p-2">{stats.median.toFixed(1)}</td>
       </tr>
       <tr className="border-t border-gray-200">
        <td className="p-2 font-medium">Mode</td>
        <td className="p-2">{stats.mode}</td>
       </tr>
       <tr className="border-t border-gray-200">
        <td className="p-2 font-medium">Skewness</td>
        <td className="p-2">{stats.skewness.toFixed(3)}</td>
       </tr>
       <tr className="border-t-2 border-gray-300 bg-blue-50 ">
        <td className="p-2 font-bold">Interpretation</td>
        <td className="p-2 font-bold">{stats.interpretation}</td>
       </tr>
      </tbody>
     </table>
    </div>
   </div>
  );
 };

 const renderReliabilityTable = (alpha: number, correlations: number[], items: { label: string }[]) => (
  <div className="bg-gray-50 p-4 rounded mb-6">
   <h4 className="text-md font-semibold text-gray-800 mb-3">Scale Reliability</h4>
   <div className="mb-3">
    <div className="flex justify-between items-center">
     <span className="font-medium">Cronbach's Alpha:</span>
     <span className="text-lg font-bold text-blue-600">α = {alpha.toFixed(3)}</span>
    </div>
    <div className="text-sm text-gray-600 mt-1">
     {getAlphaInterpretation(alpha)}
    </div>
   </div>
   <div className="text-sm">
    <div className="font-medium mb-2">Corrected Item-Total Correlations:</div>
    <ul className="space-y-1">
     {items.map((item, idx) => (
      <li key={idx} className="flex justify-between">
       <span className="text-gray-700 truncate mr-2">{item.label}</span>
       <span className="font-mono">{correlations[idx].toFixed(3)}</span>
      </li>
     ))}
    </ul>
   </div>
  </div>
 );

 return (
  <section className="bg-white shadow-lg rounded-lg p-6">
   <div className="flex items-center justify-between mb-2">
    <h2 className="text-2xl font-bold text-gray-800">Brand Perception & Sentiment Analysis</h2>
    <button
     onClick={exportPerceptionCSV}
     className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
    >
     <Download size={16} />
     Export Perception & Sentiment CSV
    </button>
   </div>
   <p className="text-sm text-gray-600 mb-6">Questions: Q7 (Childhood Memories), Q12 (Brand Representation), Q13 (Emotional Impact), Q14 (Modern/Traditional Perception)</p>

   <div className="space-y-10">
    <div>
     <h3 className="text-xl font-bold text-gray-800 mb-4">Memory & Nostalgia Scale (Q7)</h3>
     {perceptionData.q7Stats.map((stat, idx) => (
      <div key={idx}>{renderLikertChart(stat)}</div>
     ))}
     {renderReliabilityTable(
      perceptionData.q7Alpha,
      perceptionData.q7Correlations,
      [
       { label: 'Vivid memories' },
       { label: 'Reminds childhood' },
       { label: 'Want child experience' },
       { label: 'Not relevant [R]' }
      ]
     )}
    </div>

    <div>
     <h3 className="text-xl font-bold text-gray-800 mb-4">Memory Influence on Purchase (Q8)</h3>
     {renderLikertChart(perceptionData.q8Stats)}
    </div>

    <div>
     <h3 className="text-xl font-bold text-gray-800 mb-4">Importance Ratings (Q9)</h3>
     {perceptionData.q9Stats.map((stat, idx) => (
      <div key={idx}>{renderLikertChart(stat)}</div>
     ))}
     {renderReliabilityTable(
      perceptionData.q9Alpha,
      perceptionData.q9Correlations,
      [
       { label: 'Quality & Durability' },
       { label: 'Safety & Trust' },
       { label: 'Active Play' },
       { label: 'Educational' },
       { label: 'Technology' },
       { label: 'Memories' }
      ]
     )}
    </div>

    <div>
     <h3 className="text-xl font-bold text-gray-800 mb-4">Emotional Impact (Q13)</h3>
     {perceptionData.q13Stats.map((stat, idx) => (
      <div key={idx}>{renderLikertChart(stat)}</div>
     ))}
     {renderReliabilityTable(
      perceptionData.q13Alpha,
      perceptionData.q13Correlations,
      [
       { label: 'Makes nostalgic' },
       { label: 'Buy likelihood' },
       { label: 'Trust vs newer' }
      ]
     )}
    </div>

    <div>
     <h3 className="text-xl font-bold text-gray-800 mb-4">Brand Perception (Q14)</h3>
     {perceptionData.q14Stats.map((stat, idx) => (
      <div key={idx}>{renderLikertChart(stat)}</div>
     ))}
     {renderReliabilityTable(
      perceptionData.q14Alpha,
      perceptionData.q14Correlations,
      [
       { label: 'Feels modern' },
       { label: 'More technology' },
       { label: 'Keep traditional' },
       { label: 'Social media' }
      ]
     )}
    </div>

    <div>
     <h3 className="text-xl font-bold text-gray-800 mb-4">Competitor Brand Ratings (Q16)</h3>
     <ResponsiveContainer width="100%" height={400}>
      <BarChart data={perceptionData.q16Stats.map(s => ({ brand: s.label, mean: s.mean, ciLower: s.ci95[0], ciUpper: s.ci95[1] }))}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="brand" angle={-15} textAnchor="end" height={100} />
       <YAxis domain={[0, 5]} />
       <Tooltip />
       <Bar dataKey="mean">
        {perceptionData.q16Stats.map((stat, idx) => (
         <Cell key={idx} fill={stat.mean >= 4 ? '#15803D' : stat.mean >= 3 ? '#F59E0B' : '#DC2626'} />
        ))}
       </Bar>
      </BarChart>
     </ResponsiveContainer>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {perceptionData.q16Stats.map((stat, idx) => (
       <div key={idx} className="text-sm">
        {renderLikertChart(stat)}
       </div>
      ))}
     </div>
    </div>

    <div>
     <h3 className="text-xl font-bold text-gray-800 mb-4">NPS Likelihood (Q19)</h3>
     {renderLikertChart(perceptionData.q19Stats)}
    </div>

    <div>
     <h3 className="text-xl font-bold text-gray-800 mb-4">Nostalgia Slider (Q11: 0-100)</h3>
     <div className="flex items-center justify-center mb-6">
      <div className="relative w-64 h-64">
       <svg viewBox="0 0 100 100" className="transform -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle
         cx="50"
         cy="50"
         r="40"
         fill="none"
         stroke={perceptionData.q11Stats.mean > 66 ? '#15803D' : perceptionData.q11Stats.mean > 33 ? '#F59E0B' : '#10B981'}
         strokeWidth="8"
         strokeDasharray={`${(perceptionData.q11Stats.mean / 100) * 251.2} 251.2`}
         strokeLinecap="round"
        />
       </svg>
       <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Gauge className="w-8 h-8 text-gray-400 mb-2" />
        <div className="text-3xl font-bold text-gray-800">{perceptionData.q11Stats.mean.toFixed(1)}</div>
        <div className="text-sm text-gray-600">out of 100</div>
       </div>
      </div>
     </div>

     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div className="bg-gray-50 p-3 rounded">
       <div className="text-gray-600">Mean</div>
       <div className="text-lg font-bold">{perceptionData.q11Stats.mean.toFixed(1)}</div>
      </div>
      <div className="bg-gray-50 p-3 rounded">
       <div className="text-gray-600">Median</div>
       <div className="text-lg font-bold">{perceptionData.q11Stats.median.toFixed(0)}</div>
      </div>
      <div className="bg-gray-50 p-3 rounded">
       <div className="text-gray-600">Std Dev</div>
       <div className="text-lg font-bold">{perceptionData.q11Stats.sd.toFixed(1)}</div>
      </div>
      <div className="bg-gray-50 p-3 rounded">
       <div className="text-gray-600">95% CI</div>
       <div className="text-sm font-bold">[{(perceptionData.q11Stats.ci95[0] * 100).toFixed(1)} - {(perceptionData.q11Stats.ci95[1] * 100).toFixed(1)}]</div>
      </div>
      <div className="bg-gray-50 p-3 rounded">
       <div className="text-gray-600">Min/Max</div>
       <div className="text-lg font-bold">{perceptionData.q11Stats.min} / {perceptionData.q11Stats.max}</div>
      </div>
      <div className="bg-gray-50 p-3 rounded">
       <div className="text-gray-600">Q1 (25th)</div>
       <div className="text-lg font-bold">{perceptionData.q11Stats.q1.toFixed(0)}</div>
      </div>
      <div className="bg-gray-50 p-3 rounded">
       <div className="text-gray-600">Q3 (75th)</div>
       <div className="text-lg font-bold">{perceptionData.q11Stats.q3.toFixed(0)}</div>
      </div>
      <div className="bg-gray-50 p-3 rounded">
       <div className="text-gray-600">% &gt; 50</div>
       <div className="text-lg font-bold">{perceptionData.q11Stats.pctAbove50.toFixed(1)}%</div>
      </div>
     </div>
    </div>

    <div>
     <h3 className="text-xl font-bold text-gray-800 mb-4">Competitive Attribute Ratings (Q15: 0-100)</h3>
     <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={perceptionData.q15Stats.map(s => ({ attribute: s.label, score: s.mean }))}>
       <PolarGrid />
       <PolarAngleAxis dataKey="attribute" />
       <PolarRadiusAxis domain={[0, 100]} />
       <Tooltip />
       <Radar name="Little Tikes" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
      </RadarChart>
     </ResponsiveContainer>

     <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
       <thead className="bg-gray-100">
        <tr>
         <th className="p-2 text-left">Attribute</th>
         <th className="p-2 text-center">Mean</th>
         <th className="p-2 text-center">95% CI</th>
         <th className="p-2 text-center">SD</th>
         <th className="p-2 text-center">% Above 50</th>
         <th className="p-2 text-left">Competitive Strength</th>
        </tr>
       </thead>
       <tbody>
        {perceptionData.q15Stats.map((stat, idx) => (
         <tr key={idx} className="border-t border-gray-200">
          <td className="p-2">{stat.label}</td>
          <td className="p-2 text-center font-bold">{stat.mean.toFixed(1)}</td>
          <td className="p-2 text-center text-xs">[{stat.ci95[0].toFixed(1)} - {stat.ci95[1].toFixed(1)}]</td>
          <td className="p-2 text-center">{stat.sd.toFixed(1)}</td>
          <td className="p-2 text-center">{stat.pctAbove50.toFixed(1)}%</td>
          <td className="p-2">
           <span className={`px-2 py-1 rounded text-xs ${stat.mean > 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {stat.competitive}
           </span>
           <div className="text-xs text-gray-600 mt-1">
            t({stat.tTest.df})={stat.tTest.t.toFixed(2)}, p={stat.tTest.p.toFixed(3)}
           </div>
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </div>
   </div>
  </section>
 );
};
