import { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { useSurveyStore } from '../../store/surveyStore';
import { calculateDerivedIndices, calculateMean, calculateMedian, calculateStdDev, safeFixed, safeNumber } from '../../utils/calculations';

export const NostalgiaSection = () => {
 const { filteredData } = useSurveyStore();

 const nostalgiaData = useMemo(() => {
  if (!filteredData || filteredData.length === 0) {
   return null;
  }
  const nostalgiaScores = filteredData.map(r => r.q11_nostalgia_little_tikes_0_100);

  const intensityScores = filteredData.map(r => calculateDerivedIndices(r).nostalgiaIntensity);

  const q7Distribution = {
   vivid_memories: filteredData.map(r => r.q7_memories_childhood_toys_vivid_memories_1_5),
   reminds_childhood: filteredData.map(r => r.q7_memories_childhood_toys_reminds_childhood_1_5),
   want_child_experience: filteredData.map(r => r.q7_memories_childhood_toys_want_child_experience_1_5),
   not_relevant: filteredData.map(r => r.q7_memories_childhood_toys_not_relevant_today_1_5),
  };

  const distributionData = [
   { name: 'Vivid Memories', mean: calculateMean(q7Distribution.vivid_memories) },
   { name: 'Reminds Childhood', mean: calculateMean(q7Distribution.reminds_childhood) },
   { name: 'Want Child Experience', mean: calculateMean(q7Distribution.want_child_experience) },
   { name: 'Not Relevant Today', mean: calculateMean(q7Distribution.not_relevant) },
  ];

  const nostalgiaByAge = Array.from({ length: 6 }, (_, i) => {
   const value = i + 1;
   const ageGroup = filteredData.filter(r => r.age_group === value);
   const scores = ageGroup.map(r => r.q11_nostalgia_little_tikes_0_100);
   return {
    age: ['18-24', '25-29', '30-34', '35-39', '40-44', '45+'][i],
    mean: calculateMean(scores),
    count: ageGroup.length,
   };
  });

  const purchaseInfluence = filteredData.map(r => r.q8_memories_influence_purchase_1_5);

  const scatterData = filteredData.map(r => ({
   nostalgia: r.q11_nostalgia_little_tikes_0_100,
   purchase: r.q8_memories_influence_purchase_1_5,
   age: r.age_group,
  }));

  return {
   nostalgiaScores: {
    mean: calculateMean(nostalgiaScores),
    median: calculateMedian(nostalgiaScores),
    stdDev: calculateStdDev(nostalgiaScores),
   },
   intensityScores: {
    mean: calculateMean(intensityScores),
    median: calculateMedian(intensityScores),
    stdDev: calculateStdDev(intensityScores),
   },
   distributionData,
   nostalgiaByAge,
   purchaseInfluence: {
    mean: calculateMean(purchaseInfluence),
    median: calculateMedian(purchaseInfluence),
    stdDev: calculateStdDev(purchaseInfluence),
   },
   scatterData,
  };
 }, [filteredData]);

 if (!nostalgiaData) {
  return (
   <section className="bg-white shadow-lg rounded-lg p-6">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Nostalgia Analysis</h2>
    <p className="text-gray-600">No data available. Please load survey data.</p>
   </section>
  );
 }

 return (
  <section className="bg-white shadow-lg rounded-lg p-6">
   <h2 className="text-2xl font-bold text-gray-800 mb-2">Nostalgia Analysis</h2>
   <p className="text-sm text-gray-600 mb-6">Primary Questions: Q7 (Memory Impact), Q8 (Purchase Influence), Q11 (Nostalgia 0-100)</p>

   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div className="bg-blue-50 p-4 rounded">
     <h3 className="text-lg font-semibold text-gray-800 mb-1">Nostalgia Score (0-100)</h3>
     <p className="text-xs text-gray-500 mb-2">Q11: "Rate your nostalgia for Little Tikes"</p>
     <div className="space-y-2">
      <div className="flex justify-between">
       <span className="text-gray-600">Mean:</span>
       <span className="font-semibold text-gray-800">{safeFixed(nostalgiaData.nostalgiaScores.mean, 2)}</span>
      </div>
      <div className="flex justify-between">
       <span className="text-gray-600">Median:</span>
       <span className="font-semibold text-gray-800">{safeFixed(nostalgiaData.nostalgiaScores.median, 2)}</span>
      </div>
      <div className="flex justify-between">
       <span className="text-gray-600">Std Dev:</span>
       <span className="font-semibold text-gray-800">{safeFixed(nostalgiaData.nostalgiaScores.stdDev, 2)}</span>
      </div>
     </div>
    </div>

    <div className="bg-green-50 p-4 rounded">
     <h3 className="text-lg font-semibold text-gray-800 mb-1">Nostalgia Intensity Index</h3>
     <p className="text-xs text-gray-500 mb-2">Composite: Q7 + Q11 + Q13a</p>
     <div className="space-y-2">
      <div className="flex justify-between">
       <span className="text-gray-600">Mean:</span>
       <span className="font-semibold text-gray-800">{safeFixed(nostalgiaData.intensityScores.mean, 2)}</span>
      </div>
      <div className="flex justify-between">
       <span className="text-gray-600">Median:</span>
       <span className="font-semibold text-gray-800">{safeFixed(nostalgiaData.intensityScores.median, 2)}</span>
      </div>
      <div className="flex justify-between">
       <span className="text-gray-600">Std Dev:</span>
       <span className="font-semibold text-gray-800">{safeFixed(nostalgiaData.intensityScores.stdDev, 2)}</span>
      </div>
     </div>
    </div>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-1">Memory Impact Distribution (Q7)</h3>
     <p className="text-xs text-gray-500 mb-3">Q7: Childhood toy memories (1-5 scale)</p>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={nostalgiaData.distributionData}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
       <YAxis domain={[0, 5]} />
       <Tooltip />
       <Bar dataKey="mean" fill="#3B82F6" />
      </BarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-1">Nostalgia by Age Group</h3>
     <p className="text-xs text-gray-500 mb-3">Q11 (Nostalgia) segmented by Age Group</p>
     <ResponsiveContainer width="100%" height={300}>
      <LineChart data={nostalgiaData.nostalgiaByAge}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="age" />
       <YAxis domain={[0, 100]} />
       <Tooltip />
       <Legend />
       <Line type="monotone" dataKey="mean" stroke="#10B981" strokeWidth={2} name="Avg Nostalgia Score" />
      </LineChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-1">Purchase Influence Statistics</h3>
     <p className="text-xs text-gray-500 mb-3">Q8: "Childhood memories influence purchases"</p>
     <div className="bg-gray-50 p-4 rounded h-[300px] flex flex-col justify-center">
      <div className="space-y-4">
       <div className="flex justify-between items-center">
        <span className="text-gray-600">Mean Score (1-5):</span>
        <span className="text-3xl font-bold text-blue-600">{safeFixed(nostalgiaData.purchaseInfluence.mean, 2)}</span>
       </div>
       <div className="flex justify-between">
        <span className="text-gray-600">Median:</span>
        <span className="font-semibold text-gray-800">{safeFixed(nostalgiaData.purchaseInfluence.median, 2)}</span>
       </div>
       <div className="flex justify-between">
        <span className="text-gray-600">Std Dev:</span>
        <span className="font-semibold text-gray-800">{safeFixed(nostalgiaData.purchaseInfluence.stdDev, 2)}</span>
       </div>
      </div>
     </div>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-1">Nostalgia vs Purchase Intent</h3>
     <p className="text-xs text-gray-500 mb-3">Q11 (Nostalgia) vs Q8 (Purchase Influence)</p>
     <ResponsiveContainer width="100%" height={300}>
      <ScatterChart>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="nostalgia" name="Nostalgia" domain={[0, 100]} />
       <YAxis dataKey="purchase" name="Purchase" domain={[1, 5]} />
       <Tooltip cursor={{ strokeDasharray: '3 3' }} />
       <Scatter name="Respondents" data={nostalgiaData.scatterData} fill="#8B5CF6" />
      </ScatterChart>
     </ResponsiveContainer>
    </div>
   </div>
  </section>
 );
};
