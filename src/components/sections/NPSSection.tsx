import { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSurveyStore } from '../../store/surveyStore';
import { calculateNPS, calculateMean } from '../../utils/calculations';

const NPS_COLORS = {
 promoters: '#10B981',
 passives: '#F59E0B',
 detractors: '#EF4444',
};

export const NPSSection = () => {
 const { filteredData } = useSurveyStore();

 const npsData = useMemo(() => {
  const npsResults = calculateNPS(filteredData);

  const distribution = [
   { name: 'Promoters (4-5)', value: npsResults.promoters, color: NPS_COLORS.promoters },
   { name: 'Passives (3)', value: npsResults.passives, color: NPS_COLORS.passives },
   { name: 'Detractors (1-2)', value: npsResults.detractors, color: NPS_COLORS.detractors },
  ];

  const scoreDistribution = [1, 2, 3, 4, 5].map(score => {
   const count = filteredData.filter(r => r.q19_nps_little_tikes_1_5 === score).length;
   return {
    score,
    count,
    percentage: (count / filteredData.length) * 100,
   };
  });

  const npsByAge = Array.from({ length: 6 }, (_, i) => {
   const value = i + 1;
   const ageGroup = filteredData.filter(r => r.age_group === value);
   const ageNPS = calculateNPS(ageGroup);
   return {
    age: ['18-24', '25-29', '30-34', '35-39', '40-44', '45+'][i],
    nps: ageNPS.score,
    promoters: ageNPS.promoters,
    count: ageGroup.length,
   };
  });

  const npsByParent = [
   {
    segment: 'Parents (2-7)',
    data: calculateNPS(filteredData.filter(r => r.children_2_7 === 1)),
   },
   {
    segment: 'Non-Parents',
    data: calculateNPS(filteredData.filter(r => r.children_2_7 === 0)),
   },
  ];

  const npsByNostalgia = [
   { range: 'Low (0-33)', nps: calculateNPS(filteredData.filter(r => r.q11_nostalgia_little_tikes_0_100 < 34)).score },
   { range: 'Medium (34-66)', nps: calculateNPS(filteredData.filter(r => r.q11_nostalgia_little_tikes_0_100 >= 34 && r.q11_nostalgia_little_tikes_0_100 < 67)).score },
   { range: 'High (67-100)', nps: calculateNPS(filteredData.filter(r => r.q11_nostalgia_little_tikes_0_100 >= 67)).score },
  ];

  const correlationWithPurchase = filteredData.map(r => ({
   nps: r.q19_nps_little_tikes_1_5,
   purchase: r.q8_memories_influence_purchase_1_5,
   nostalgia: r.q11_nostalgia_little_tikes_0_100,
  }));

  const avgPurchaseByNPS = [1, 2, 3, 4, 5].map(score => {
   const group = filteredData.filter(r => r.q19_nps_little_tikes_1_5 === score);
   const purchaseScores = group.map(r => r.q8_memories_influence_purchase_1_5);
   return {
    nps: score,
    avgPurchase: calculateMean(purchaseScores),
    count: group.length,
   };
  });

  return {
   npsResults,
   distribution,
   scoreDistribution,
   npsByAge,
   npsByParent,
   npsByNostalgia,
   avgPurchaseByNPS,
  };
 }, [filteredData]);

 const getNPSColor = (score: number) => {
  if (score >= 50) return 'text-green-600';
  if (score >= 0) return 'text-yellow-600';
  return 'text-red-600';
 };

 const getNPSLabel = (score: number) => {
  if (score >= 70) return 'Excellent';
  if (score >= 50) return 'Great';
  if (score >= 30) return 'Good';
  if (score >= 0) return 'Needs Improvement';
  return 'Critical';
 };

 return (
  <section className="bg-white shadow-lg rounded-lg p-6">
   <h2 className="text-2xl font-bold text-gray-800 mb-2">Net Promoter Score (NPS) Analysis</h2>
   <p className="text-sm text-gray-600 mb-6">Survey Question Q19: "How likely are you to recommend Little Tikes to others?" (1-5 scale)</p>

   <div className="mb-6 bg-gradient-to-r from-blue-50 via-green-50 to-emerald-50 p-6 rounded-lg">
    <div className="text-center">
     <div className="text-sm text-gray-600 mb-2">Overall NPS Score</div>
     <div className={`text-6xl font-bold mb-2 ${getNPSColor(npsData.npsResults.score)}`}>
      {npsData.npsResults.score.toFixed(1)}
     </div>
     <div className="text-lg font-semibold text-gray-700 mb-4">
      {getNPSLabel(npsData.npsResults.score)}
     </div>
     <div className="grid grid-cols-3 gap-4 text-sm max-w-2xl mx-auto">
      <div>
       <div className="text-gray-600">Promoters</div>
       <div className="text-2xl font-bold text-green-600">{npsData.npsResults.promoters.toFixed(1)}%</div>
      </div>
      <div>
       <div className="text-gray-600">Passives</div>
       <div className="text-2xl font-bold text-yellow-600">{npsData.npsResults.passives.toFixed(1)}%</div>
      </div>
      <div>
       <div className="text-gray-600">Detractors</div>
       <div className="text-2xl font-bold text-red-600">{npsData.npsResults.detractors.toFixed(1)}%</div>
      </div>
     </div>
    </div>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">NPS Distribution</h3>
     <ResponsiveContainer width="100%" height={300}>
      <PieChart>
       <Pie
        data={npsData.distribution}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
       >
        {npsData.distribution.map((entry, index) => (
         <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
       </Pie>
       <Tooltip />
      </PieChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Score Distribution (1-5)</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={npsData.scoreDistribution}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="score" />
       <YAxis />
       <Tooltip />
       <Bar dataKey="count" fill="#3B82F6" />
      </BarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">NPS by Age Group</h3>
     <ResponsiveContainer width="100%" height={300}>
      <LineChart data={npsData.npsByAge}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="age" />
       <YAxis />
       <Tooltip />
       <Legend />
       <Line type="monotone" dataKey="nps" stroke="#10B981" strokeWidth={2} name="NPS Score" />
       <Line type="monotone" dataKey="promoters" stroke="#3B82F6" strokeWidth={2} name="Promoters %" />
      </LineChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-1">NPS by Nostalgia Level</h3>
     <p className="text-xs text-gray-500 mb-3">Q19 (NPS) segmented by Q11 (Nostalgia 0-100)</p>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={npsData.npsByNostalgia}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="range" />
       <YAxis />
       <Tooltip />
       <Bar dataKey="nps" fill="#8B5CF6" />
      </BarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-1">Purchase Intent by NPS</h3>
     <p className="text-xs text-gray-500 mb-3">Q8 (Memory Influence on Purchase) by Q19 (NPS)</p>
     <ResponsiveContainer width="100%" height={300}>
      <LineChart data={npsData.avgPurchaseByNPS}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="nps" label={{ value: 'NPS Score', position: 'insideBottom', offset: -5 }} />
       <YAxis domain={[1, 5]} label={{ value: 'Avg Purchase Intent', angle: -90, position: 'insideLeft' }} />
       <Tooltip />
       <Line type="monotone" dataKey="avgPurchase" stroke="#F59E0B" strokeWidth={2} />
      </LineChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">NPS by Segment</h3>
     <div className="space-y-4">
      {npsData.npsByParent.map((segment, idx) => (
       <div key={idx} className="bg-gray-50 p-4 rounded">
        <div className="font-semibold text-gray-800 mb-3">{segment.segment}</div>
        <div className="grid grid-cols-3 gap-2 text-sm">
         <div>
          <div className="text-gray-600 text-xs">NPS</div>
          <div className={`text-xl font-bold ${getNPSColor(segment.data.score)}`}>
           {segment.data.score.toFixed(1)}
          </div>
         </div>
         <div>
          <div className="text-gray-600 text-xs">Promoters</div>
          <div className="text-xl font-bold text-green-600">{segment.data.promoters.toFixed(0)}%</div>
         </div>
         <div>
          <div className="text-gray-600 text-xs">Detractors</div>
          <div className="text-xl font-bold text-red-600">{segment.data.detractors.toFixed(0)}%</div>
         </div>
        </div>
       </div>
      ))}
     </div>
    </div>
   </div>

   <div className="mt-6 bg-gray-50 p-4 rounded">
    <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Insights</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
     <div>
      <div className="text-gray-600 mb-1">Highest NPS Age Group</div>
      <div className="font-bold text-gray-800">
       {npsData.npsByAge.reduce((max, curr) => curr.nps > max.nps ? curr : max).age}
      </div>
      <div className="text-xs text-gray-500">
       NPS: {npsData.npsByAge.reduce((max, curr) => curr.nps > max.nps ? curr : max).nps.toFixed(1)}
      </div>
     </div>
     <div>
      <div className="text-gray-600 mb-1">Nostalgia Impact</div>
      <div className="font-bold text-gray-800">
       High nostalgia = {npsData.npsByNostalgia[2]?.nps.toFixed(1)} NPS
      </div>
      <div className="text-xs text-gray-500">
       vs Low = {npsData.npsByNostalgia[0]?.nps.toFixed(1)} NPS
      </div>
     </div>
     <div>
      <div className="text-gray-600 mb-1">Score 5 Purchase Intent</div>
      <div className="font-bold text-gray-800">
       {npsData.avgPurchaseByNPS.find(d => d.nps === 5)?.avgPurchase.toFixed(2)}/5
      </div>
      <div className="text-xs text-gray-500">
       Strong correlation with loyalty
      </div>
     </div>
    </div>
   </div>
  </section>
 );
};
