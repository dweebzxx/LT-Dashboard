import { useMemo } from 'react';
import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSurveyStore } from '../../store/surveyStore';
import { calculateDerivedIndices, calculateMean, getLabelForValue } from '../../utils/calculations';

export const BrandPerceptionSection = () => {
 const { filteredData } = useSurveyStore();

 const brandData = useMemo(() => {
  const rankingData = [
   { brand: 'Fisher-Price', rank: calculateMean(filteredData.map(r => r.q6_childhood_brand_rank_fisher_price)) },
   { brand: 'Little Tikes', rank: calculateMean(filteredData.map(r => r.q6_childhood_brand_rank_little_tikes)) },
   { brand: 'LEGO', rank: calculateMean(filteredData.map(r => r.q6_childhood_brand_rank_lego)) },
   { brand: 'Mattel', rank: calculateMean(filteredData.map(r => r.q6_childhood_brand_rank_mattel)) },
   { brand: 'Hasbro', rank: calculateMean(filteredData.map(r => r.q6_childhood_brand_rank_hasbro)) },
   { brand: 'Playskool', rank: calculateMean(filteredData.map(r => r.q6_childhood_brand_rank_playskool)) },
  ].sort((a, b) => a.rank - b.rank);

  const q12Distribution = [1, 2, 3, 4, 5].map(value => {
   const count = filteredData.filter(r => r.q12_little_tikes_represents === value).length;
   return {
    name: getLabelForValue('q12_little_tikes_represents', value),
    value: count,
    percentage: (count / filteredData.length) * 100,
   };
  }).sort((a, b) => b.percentage - a.percentage);

  const emotionalImpact = [
   {
    attribute: 'Makes Nostalgic',
    score: calculateMean(filteredData.map(r => r.q13_emotional_impact_makes_nostalgic_1_5)),
   },
   {
    attribute: 'Trust vs Newer',
    score: calculateMean(filteredData.map(r => r.q13_emotional_impact_trust_vs_newer_1_5)),
   },
   {
    attribute: 'Nostalgia Buy Likelihood',
    score: calculateMean(filteredData.map(r => r.q13_emotional_impact_nostalgia_buy_likelihood_1_5)),
   },
  ];

  const brandTrustScores = filteredData.map(r => calculateDerivedIndices(r).brandTrust);
  const brandTrustStats = {
   mean: calculateMean(brandTrustScores),
   distribution: [
    { range: '0-20', count: brandTrustScores.filter(s => s < 20).length },
    { range: '20-40', count: brandTrustScores.filter(s => s >= 20 && s < 40).length },
    { range: '40-60', count: brandTrustScores.filter(s => s >= 40 && s < 60).length },
    { range: '60-80', count: brandTrustScores.filter(s => s >= 60 && s < 80).length },
    { range: '80-100', count: brandTrustScores.filter(s => s >= 80).length },
   ],
  };

  return {
   rankingData,
   q12Distribution,
   emotionalImpact,
   brandTrustStats,
  };
 }, [filteredData]);

 return (
  <section className="bg-white shadow-lg rounded-lg p-6">
   <h2 className="text-2xl font-bold text-gray-800 mb-6">Brand Perception & Trust</h2>

   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Childhood Brand Rankings (Lower is Better)</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={brandData.rankingData} layout="vertical">
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis type="number" domain={[0, 7]} />
       <YAxis dataKey="brand" type="category" width={100} />
       <Tooltip />
       <Bar dataKey="rank" fill="#3B82F6" />
      </BarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">What Little Tikes Represents</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={brandData.q12Distribution}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="name" angle={-20} textAnchor="end" height={120} />
       <YAxis />
       <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
       <Bar dataKey="percentage" fill="#10B981" />
      </BarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Emotional Impact Scores (1-5)</h3>
     <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={brandData.emotionalImpact}>
       <PolarGrid />
       <PolarAngleAxis dataKey="attribute" />
       <PolarRadiusAxis domain={[0, 5]} />
       <Tooltip />
       <Radar name="Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
      </RadarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Brand Trust Index Distribution</h3>
     <div className="mb-4">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded text-center">
       <div className="text-sm text-gray-600 mb-1">Average Brand Trust Score</div>
       <div className="text-4xl font-bold text-blue-600">{brandData.brandTrustStats.mean.toFixed(1)}</div>
       <div className="text-xs text-gray-500 mt-1">out of 100</div>
      </div>
     </div>
     <ResponsiveContainer width="100%" height={180}>
      <BarChart data={brandData.brandTrustStats.distribution}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="range" />
       <YAxis />
       <Tooltip />
       <Bar dataKey="count" fill="#F59E0B" />
      </BarChart>
     </ResponsiveContainer>
    </div>
   </div>

   <div className="mt-6 bg-gray-50 p-4 rounded">
    <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Insights</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
     <div>
      <div className="text-gray-600 mb-1">Top Brand Association</div>
      <div className="font-semibold text-gray-800">{brandData.q12Distribution[0]?.name}</div>
      <div className="text-xs text-gray-500">{brandData.q12Distribution[0]?.percentage.toFixed(1)}% of respondents</div>
     </div>
     <div>
      <div className="text-gray-600 mb-1">Childhood Brand Ranking</div>
      <div className="font-semibold text-gray-800">
       #{brandData.rankingData.findIndex(b => b.brand === 'Little Tikes') + 1} of 6
      </div>
      <div className="text-xs text-gray-500">Average rank: {brandData.rankingData.find(b => b.brand === 'Little Tikes')?.rank.toFixed(2)}</div>
     </div>
     <div>
      <div className="text-gray-600 mb-1">Emotional Resonance</div>
      <div className="font-semibold text-gray-800">
       {calculateMean(brandData.emotionalImpact.map(e => e.score)).toFixed(2)}/5
      </div>
      <div className="text-xs text-gray-500">Average across all metrics</div>
     </div>
    </div>
   </div>
  </section>
 );
};
