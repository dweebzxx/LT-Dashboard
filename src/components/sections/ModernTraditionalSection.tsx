import { useMemo } from 'react';
import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSurveyStore } from '../../store/surveyStore';
import { calculateDerivedIndices, calculateMean, calculateStdDev, safeFixed } from '../../utils/calculations';

export const ModernTraditionalSection = () => {
 const { filteredData } = useSurveyStore();

 const modernizationData = useMemo(() => {
  if (!filteredData || filteredData.length === 0) {
   return null;
  }
  const q14Scores = {
   modern: filteredData.map(r => r.q14_perception_brand_feels_modern_1_5),
   technology: filteredData.map(r => r.q14_perception_brand_incorporate_technology_1_5),
   traditional: filteredData.map(r => r.q14_perception_brand_keep_traditional_1_5),
   trendy: filteredData.map(r => r.q14_perception_brand_trendy_social_media_1_5),
  };

  const perceptionData = [
   {
    attribute: 'Feels Modern',
    score: calculateMean(q14Scores.modern),
    stdDev: calculateStdDev(q14Scores.modern),
   },
   {
    attribute: 'Incorporate Technology',
    score: calculateMean(q14Scores.technology),
    stdDev: calculateStdDev(q14Scores.technology),
   },
   {
    attribute: 'Keep Traditional',
    score: calculateMean(q14Scores.traditional),
    stdDev: calculateStdDev(q14Scores.traditional),
   },
   {
    attribute: 'Trendy/Social Media',
    score: calculateMean(q14Scores.trendy),
    stdDev: calculateStdDev(q14Scores.trendy),
   },
  ];

  const modernizationScores = filteredData.map(r => calculateDerivedIndices(r).modernizationScore);
  const modernizationStats = {
   mean: calculateMean(modernizationScores),
   stdDev: calculateStdDev(modernizationScores),
   distribution: [
    { range: '0-20', count: modernizationScores.filter(s => s < 20).length },
    { range: '20-40', count: modernizationScores.filter(s => s >= 20 && s < 40).length },
    { range: '40-60', count: modernizationScores.filter(s => s >= 40 && s < 60).length },
    { range: '60-80', count: modernizationScores.filter(s => s >= 60 && s < 80).length },
    { range: '80-100', count: modernizationScores.filter(s => s >= 80).length },
   ],
  };

  const comparisonData = [
   {
    aspect: 'Modern',
    current: calculateMean(q14Scores.modern),
    desired: 4.0,
   },
   {
    aspect: 'Technology',
    current: calculateMean(q14Scores.technology),
    desired: 3.8,
   },
   {
    aspect: 'Traditional',
    current: calculateMean(q14Scores.traditional),
    desired: 4.2,
   },
   {
    aspect: 'Trendy',
    current: calculateMean(q14Scores.trendy),
    desired: 3.5,
   },
  ];

  const ageModernization = Array.from({ length: 6 }, (_, i) => {
   const value = i + 1;
   const ageGroup = filteredData.filter(r => r.age_group === value);
   const scores = ageGroup.map(r => calculateDerivedIndices(r).modernizationScore);
   return {
    age: ['18-24', '25-29', '30-34', '35-39', '40-44', '45+'][i],
    score: calculateMean(scores),
    count: ageGroup.length,
   };
  });

  return {
   perceptionData,
   modernizationStats,
   comparisonData,
   ageModernization,
  };
 }, [filteredData]);

 if (!modernizationData) {
  return (
   <section className="bg-white shadow-lg rounded-lg p-6">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Modern vs Traditional Perception</h2>
    <p className="text-gray-600">No data available. Please load survey data.</p>
   </section>
  );
 }

 return (
  <section className="bg-white shadow-lg rounded-lg p-6">
   <h2 className="text-2xl font-bold text-gray-800 mb-2">Modern vs Traditional Perception</h2>
   <p className="text-sm text-gray-600 mb-6">Question Q14: Brand perception (Modern/Tech/Traditional/Trendy, 1-5 scale)</p>

   <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg">
    <div className="text-center">
     <div className="text-sm text-gray-600 mb-2">Modernization Index</div>
     <div className="text-5xl font-bold text-purple-600 mb-1">{safeFixed(modernizationData.modernizationStats.mean, 1)}</div>
     <div className="text-xs text-gray-500">out of 100</div>
     <div className="text-sm text-gray-600 mt-2">σ = {safeFixed(modernizationData.modernizationStats.stdDev, 2)}</div>
    </div>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Brand Perception Scores (1-5)</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={modernizationData.perceptionData}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="attribute" angle={-15} textAnchor="end" height={80} />
       <YAxis domain={[0, 5]} />
       <Tooltip />
       <Bar dataKey="score" fill="#8B5CF6" />
      </BarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Current vs Desired Perception</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={modernizationData.comparisonData}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="aspect" />
       <YAxis domain={[0, 5]} />
       <Tooltip />
       <Legend />
       <Bar dataKey="current" fill="#3B82F6" name="Current" />
       <Bar dataKey="desired" fill="#10B981" name="Desired" />
      </BarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Modernization by Age Group</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={modernizationData.ageModernization}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="age" />
       <YAxis domain={[0, 100]} />
       <Tooltip />
       <Bar dataKey="score" fill="#F59E0B" />
      </BarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Modernization Score Distribution</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={modernizationData.modernizationStats.distribution}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="range" />
       <YAxis />
       <Tooltip />
       <Bar dataKey="count" fill="#EC4899" />
      </BarChart>
     </ResponsiveContainer>
    </div>
   </div>

   <div className="mt-6 bg-gray-50 p-4 rounded">
    <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Findings</h3>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
     {modernizationData.perceptionData.map((item, idx) => (
      <div key={idx}>
       <div className="text-gray-600 mb-1">{item.attribute}</div>
       <div className="font-bold text-gray-800 text-xl">{safeFixed(item.score, 2)}</div>
       <div className="text-xs text-gray-500">σ = {safeFixed(item.stdDev, 2)}</div>
      </div>
     ))}
    </div>
   </div>
  </section>
 );
};
