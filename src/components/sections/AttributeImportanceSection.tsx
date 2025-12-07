import { useMemo } from 'react';
import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSurveyStore } from '../../store/surveyStore';
import { calculateDerivedIndices, calculateMean } from '../../utils/calculations';

export const AttributeImportanceSection = () => {
 const { filteredData } = useSurveyStore();

 const attributeData = useMemo(() => {
  const attributes = [
   { key: 'q10_rank_attributes_future_1', name: 'Quality & Durability' },
   { key: 'q10_rank_attributes_future_2', name: 'Safety & Trust' },
   { key: 'q10_rank_attributes_future_3', name: 'Active & Imaginative Play' },
   { key: 'q10_rank_attributes_future_4', name: 'Educational & Developmental' },
   { key: 'q10_rank_attributes_future_5', name: 'Use of Technology' },
   { key: 'q10_rank_attributes_future_6', name: 'Childhood Memories' },
  ];

  const rankingData = attributes.map(attr => {
   const ranks = filteredData.map(r => r[attr.key as keyof typeof r] as number);
   const avgRank = calculateMean(ranks);
   const priority = ((7 - avgRank) / 6) * 100;
   return {
    name: attr.name,
    avgRank,
    priority,
   };
  }).sort((a, b) => a.avgRank - b.avgRank);

  const priorityData = rankingData.map(item => ({
   name: item.name,
   priority: item.priority,
  }));

  const radarData = attributes.map(attr => {
   const scores = filteredData.map(r => {
    const indices = calculateDerivedIndices(r);
    const attrName = attr.name as keyof typeof indices.attributePriority;
    return indices.attributePriority[attrName] || 0;
   });
   return {
    attribute: attr.name.split(' & ').join(' '),
    score: calculateMean(scores),
   };
  });

  const byDemographic = {
   byAge: Array.from({ length: 6 }, (_, i) => {
    const value = i + 1;
    const ageGroup = filteredData.filter(r => r.age_group === value);
    const topAttribute = attributes.reduce((acc, attr) => {
     const ranks = ageGroup.map(r => r[attr.key as keyof typeof r] as number);
     const avgRank = calculateMean(ranks);
     if (avgRank < acc.rank) {
      return { name: attr.name, rank: avgRank };
     }
     return acc;
    }, { name: '', rank: 7 });

    return {
     age: ['18-24', '25-29', '30-34', '35-39', '40-44', '45+'][i],
     topAttribute: topAttribute.name,
     count: ageGroup.length,
    };
   }),
   byParent: [
    {
     segment: 'Parents (2-7)',
     top3: attributes.map(attr => {
      const parents = filteredData.filter(r => r.children_2_7 === 1);
      const ranks = parents.map(r => r[attr.key as keyof typeof r] as number);
      return { name: attr.name, avgRank: calculateMean(ranks) };
     }).sort((a, b) => a.avgRank - b.avgRank).slice(0, 3),
    },
    {
     segment: 'Non-Parents',
     top3: attributes.map(attr => {
      const nonParents = filteredData.filter(r => r.children_2_7 === 0);
      const ranks = nonParents.map(r => r[attr.key as keyof typeof r] as number);
      return { name: attr.name, avgRank: calculateMean(ranks) };
     }).sort((a, b) => a.avgRank - b.avgRank).slice(0, 3),
    },
   ],
  };

  const correlationMatrix = attributes.map(attr1 => {
   return attributes.map(attr2 => {
    const values1 = filteredData.map(r => r[attr1.key as keyof typeof r] as number);
    const values2 = filteredData.map(r => r[attr2.key as keyof typeof r] as number);
    const mean1 = calculateMean(values1);
    const mean2 = calculateMean(values2);

    let correlation = 0;
    const n = values1.length;
    let sum = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;

    for (let i = 0; i < n; i++) {
     const diff1 = values1[i] - mean1;
     const diff2 = values2[i] - mean2;
     sum += diff1 * diff2;
     sum1Sq += diff1 * diff1;
     sum2Sq += diff2 * diff2;
    }

    const denom = Math.sqrt(sum1Sq * sum2Sq);
    correlation = denom !== 0 ? sum / denom : 0;

    return correlation;
   });
  });

  return {
   rankingData,
   priorityData,
   radarData,
   byDemographic,
   correlationMatrix,
   attributes: attributes.map(a => a.name),
  };
 }, [filteredData]);

 return (
  <section className="bg-white shadow-lg rounded-lg p-6">
   <h2 className="text-2xl font-bold text-gray-800 mb-2">Attribute Importance & Priority</h2>
   <p className="text-sm text-gray-600 mb-6">Questions: Q9 (Importance Ratings 1-5), Q10 (Ranking Future Priorities), Q15 (LT Ratings vs Competitors 0-100)</p>

   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Average Rankings (Lower is Better)</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={attributeData.rankingData} layout="vertical">
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis type="number" domain={[0, 7]} />
       <YAxis dataKey="name" type="category" width={150} />
       <Tooltip />
       <Bar dataKey="avgRank" fill="#3B82F6" />
      </BarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Priority Score (0-100)</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={attributeData.priorityData} layout="vertical">
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis type="number" domain={[0, 100]} />
       <YAxis dataKey="name" type="category" width={150} />
       <Tooltip />
       <Bar dataKey="priority" fill="#10B981" />
      </BarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Attribute Priority Radar</h3>
     <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={attributeData.radarData}>
       <PolarGrid />
       <PolarAngleAxis dataKey="attribute" />
       <PolarRadiusAxis domain={[0, 100]} />
       <Tooltip />
       <Radar name="Priority" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
      </RadarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Priorities by Segment</h3>
     <div className="space-y-4">
      {attributeData.byDemographic.byParent.map((segment, idx) => (
       <div key={idx} className="bg-gray-50 p-4 rounded">
        <div className="font-semibold text-gray-800 mb-2">{segment.segment}</div>
        <ol className="space-y-1 text-sm">
         {segment.top3.map((attr, i) => (
          <li key={i} className="flex justify-between">
           <span className="text-gray-700">{i + 1}. {attr.name}</span>
           <span className="text-gray-500">Rank: {attr.avgRank.toFixed(2)}</span>
          </li>
         ))}
        </ol>
       </div>
      ))}
     </div>
    </div>
   </div>

   <div>
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Attribute Correlation Heatmap</h3>
    <div className="overflow-x-auto">
     <table className="w-full text-xs">
      <thead>
       <tr>
        <th className="p-2 text-left">Attribute</th>
        {attributeData.attributes.map((attr, idx) => (
         <th key={idx} className="p-2 text-center transform -rotate-45 h-32" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          {attr}
         </th>
        ))}
       </tr>
      </thead>
      <tbody>
       {attributeData.attributes.map((attr1, i) => (
        <tr key={i}>
         <td className="p-2 font-semibold text-gray-700">{attr1}</td>
         {attributeData.correlationMatrix[i].map((corr, j) => {
          const intensity = Math.abs(corr);
          const color = corr > 0
           ? `rgba(16, 185, 129, ${intensity})`
           : `rgba(239, 68, 68, ${intensity})`;
          return (
           <td
            key={j}
            className="p-2 text-center border border-gray-200"
            style={{ backgroundColor: color }}
           >
            {corr.toFixed(2)}
           </td>
          );
         })}
        </tr>
       ))}
      </tbody>
     </table>
    </div>
   </div>
  </section>
 );
};
