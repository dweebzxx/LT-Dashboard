import { useMemo } from 'react';
import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useSurveyStore } from '../../store/surveyStore';
import { calculateDerivedIndices, calculateMean, calculateStdDev } from '../../utils/calculations';

export const CompetitiveAnalysisSection = () => {
 const { filteredData } = useSurveyStore();

 const competitiveData = useMemo(() => {
  const attributes = [
   { key: 'q15_lt_rating_vs_competitors_quality_durability_0_100', name: 'Quality & Durability' },
   { key: 'q15_lt_rating_vs_competitors_safety_trust_0_100', name: 'Safety & Trust' },
   { key: 'q15_lt_rating_vs_competitors_active_imaginative_play_0_100', name: 'Active Play' },
   { key: 'q15_lt_rating_vs_competitors_educational_developmental_0_100', name: 'Educational' },
   { key: 'q15_lt_rating_vs_competitors_use_of_technology_0_100', name: 'Technology' },
   { key: 'q15_lt_rating_vs_competitors_childhood_memories_0_100', name: 'Memories' },
  ];

  const competitiveScores = attributes.map(attr => {
   const scores = filteredData.map(r => r[attr.key as keyof typeof r] as number);
   return {
    name: attr.name,
    mean: calculateMean(scores),
    stdDev: calculateStdDev(scores),
   };
  });

  const radarData = competitiveScores.map(item => ({
   attribute: item.name,
   score: item.mean,
  }));

  const competitiveStrength = filteredData.map(r => calculateDerivedIndices(r).competitiveStrength);
  const strengthStats = {
   mean: calculateMean(competitiveStrength),
   stdDev: calculateStdDev(competitiveStrength),
   distribution: [
    { range: '0-20', count: competitiveStrength.filter(s => s < 20).length },
    { range: '20-40', count: competitiveStrength.filter(s => s >= 20 && s < 40).length },
    { range: '40-60', count: competitiveStrength.filter(s => s >= 40 && s < 60).length },
    { range: '60-80', count: competitiveStrength.filter(s => s >= 60 && s < 80).length },
    { range: '80-100', count: competitiveStrength.filter(s => s >= 80).length },
   ],
  };

  const brandPreference = [1, 2, 3].map(value => {
   const count = filteredData.filter(r => r.q18_preference_vs_brands_1_3 === value).length;
   const label = value === 1 ? 'Much Less' : value === 2 ? 'Neutral' : 'Much More';
   return {
    name: label,
    value,
    count,
    percentage: (count / filteredData.length) * 100,
   };
  });

  const strengthByAge = Array.from({ length: 6 }, (_, i) => {
   const value = i + 1;
   const ageGroup = filteredData.filter(r => r.age_group === value);
   const scores = ageGroup.map(r => calculateDerivedIndices(r).competitiveStrength);
   return {
    age: ['18-24', '25-29', '30-34', '35-39', '40-44', '45+'][i],
    strength: calculateMean(scores),
    count: ageGroup.length,
   };
  });

  const gapAnalysis = competitiveScores.map(item => ({
   name: item.name,
   current: item.mean,
   target: 75,
   gap: 75 - item.mean,
  }));

  return {
   competitiveScores,
   radarData,
   strengthStats,
   brandPreference,
   strengthByAge,
   gapAnalysis,
  };
 }, [filteredData]);

 return (
  <section className="bg-white shadow-lg rounded-lg p-6">
   <h2 className="text-2xl font-bold text-gray-800 mb-2">Competitive Analysis</h2>
   <p className="text-sm text-gray-600 mb-6">Questions: Q15 (LT Ratings vs Competitors 0-100), Q16 (Competitor Brand Ratings 1-5), Q18 (Brand Preference)</p>

   <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
    <div className="text-center">
     <div className="text-sm text-gray-600 mb-2">Competitive Strength Index</div>
     <div className="text-5xl font-bold text-green-600 mb-1">{competitiveData.strengthStats.mean.toFixed(1)}</div>
     <div className="text-xs text-gray-500">out of 100</div>
     <div className="text-sm text-gray-600 mt-2">σ = {competitiveData.strengthStats.stdDev.toFixed(2)}</div>
    </div>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Competitive Performance by Attribute</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={competitiveData.competitiveScores}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
       <YAxis domain={[0, 100]} />
       <Tooltip />
       <Bar dataKey="mean" fill="#3B82F6" />
      </BarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Competitive Radar Profile</h3>
     <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={competitiveData.radarData}>
       <PolarGrid />
       <PolarAngleAxis dataKey="attribute" />
       <PolarRadiusAxis domain={[0, 100]} />
       <Tooltip />
       <Radar name="Little Tikes" dataKey="score" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
      </RadarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Brand Preference vs Competitors</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={competitiveData.brandPreference}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="name" />
       <YAxis />
       <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
       <Bar dataKey="percentage" fill="#F59E0B" />
      </BarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Competitive Strength by Age</h3>
     <ResponsiveContainer width="100%" height={300}>
      <LineChart data={competitiveData.strengthByAge}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="age" />
       <YAxis domain={[0, 100]} />
       <Tooltip />
       <Legend />
       <Line type="monotone" dataKey="strength" stroke="#8B5CF6" strokeWidth={2} name="Strength Score" />
      </LineChart>
     </ResponsiveContainer>
    </div>

    <div className="lg:col-span-2">
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Gap Analysis (Target: 75)</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={competitiveData.gapAnalysis}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
       <YAxis />
       <Tooltip />
       <Legend />
       <Bar dataKey="current" fill="#3B82F6" name="Current Score" />
       <Bar dataKey="target" fill="#10B981" name="Target Score" />
      </BarChart>
     </ResponsiveContainer>
    </div>
   </div>

   <div className="mt-6 bg-gray-50 p-4 rounded">
    <h3 className="text-lg font-semibold text-gray-800 mb-3">Competitive Insights</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
     <div>
      <div className="text-gray-600 mb-1">Strongest Attribute</div>
      <div className="font-bold text-gray-800">
       {competitiveData.competitiveScores.reduce((max, curr) => curr.mean > max.mean ? curr : max).name}
      </div>
      <div className="text-xs text-gray-500">
       Score: {competitiveData.competitiveScores.reduce((max, curr) => curr.mean > max.mean ? curr : max).mean.toFixed(1)}
      </div>
     </div>
     <div>
      <div className="text-gray-600 mb-1">Improvement Opportunity</div>
      <div className="font-bold text-gray-800">
       {competitiveData.competitiveScores.reduce((min, curr) => curr.mean < min.mean ? curr : min).name}
      </div>
      <div className="text-xs text-gray-500">
       Score: {competitiveData.competitiveScores.reduce((min, curr) => curr.mean < min.mean ? curr : min).mean.toFixed(1)}
      </div>
     </div>
     <div>
      <div className="text-gray-600 mb-1">Prefer Little Tikes More</div>
      <div className="font-bold text-gray-800">
       {competitiveData.brandPreference[2]?.percentage.toFixed(1)}%
      </div>
      <div className="text-xs text-gray-500">
       {competitiveData.brandPreference[2]?.count} respondents
      </div>
     </div>
    </div>
   </div>
  </section>
 );
};
