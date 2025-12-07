import { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSurveyStore } from '../../store/surveyStore';
import { calculateMean, getLabelForValue } from '../../utils/calculations';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const FutureDirectionSection = () => {
 const { filteredData } = useSurveyStore();

 const futureData = useMemo(() => {
  const q17Distribution = [1, 2, 3, 4].map(value => {
   const count = filteredData.filter(r => r.q17_future_directions_excitement_1_4 === value).length;
   return {
    name: getLabelForValue('q17_future_directions_excitement_1_4', value),
    value,
    count,
    percentage: (count / filteredData.length) * 100,
   };
  }).sort((a, b) => b.percentage - a.percentage);

  const excitementByAge = Array.from({ length: 6 }, (_, i) => {
   const value = i + 1;
   const ageGroup = filteredData.filter(r => r.age_group === value);
   const directionCounts = [1, 2, 3, 4].map(dir => ({
    direction: dir,
    count: ageGroup.filter(r => r.q17_future_directions_excitement_1_4 === dir).length,
   }));
   const topDirection = directionCounts.reduce((max, curr) => curr.count > max.count ? curr : max);

   return {
    age: ['18-24', '25-29', '30-34', '35-39', '40-44', '45+'][i],
    topDirection: getLabelForValue('q17_future_directions_excitement_1_4', topDirection.direction),
    count: ageGroup.length,
   };
  });

  const parentPreference = [
   {
    segment: 'Parents (2-7)',
    preferences: [1, 2, 3, 4].map(value => {
     const parents = filteredData.filter(r => r.children_2_7 === 1);
     const count = parents.filter(r => r.q17_future_directions_excitement_1_4 === value).length;
     return {
      name: getLabelForValue('q17_future_directions_excitement_1_4', value),
      percentage: (count / parents.length) * 100,
     };
    }),
   },
   {
    segment: 'Non-Parents',
    preferences: [1, 2, 3, 4].map(value => {
     const nonParents = filteredData.filter(r => r.children_2_7 === 0);
     const count = nonParents.filter(r => r.q17_future_directions_excitement_1_4 === value).length;
     return {
      name: getLabelForValue('q17_future_directions_excitement_1_4', value),
      percentage: (count / nonParents.length) * 100,
     };
    }),
   },
  ];

  const nostalgiaCorrelation = [1, 2, 3, 4].map(value => {
   const group = filteredData.filter(r => r.q17_future_directions_excitement_1_4 === value);
   const nostalgiaScores = group.map(r => r.q11_nostalgia_little_tikes_0_100);
   return {
    direction: getLabelForValue('q17_future_directions_excitement_1_4', value),
    avgNostalgia: calculateMean(nostalgiaScores),
    count: group.length,
   };
  });

  const strategicRecommendations = [
   {
    direction: 'Re-introducing vintage',
    support: q17Distribution.find(d => d.value === 1)?.percentage || 0,
    targetAudience: 'High nostalgia scorers (70+)',
    rationale: 'Leverages emotional connection to childhood memories',
   },
   {
    direction: 'Tech-enhanced experiences',
    support: q17Distribution.find(d => d.value === 2)?.percentage || 0,
    targetAudience: 'Ages 18-34, urban parents',
    rationale: 'Addresses modernization needs while maintaining play value',
   },
   {
    direction: 'Pop-culture partnership',
    support: q17Distribution.find(d => d.value === 3)?.percentage || 0,
    targetAudience: 'Social media active, younger parents',
    rationale: 'Increases brand relevance and social shareability',
   },
   {
    direction: 'Family play time advertising',
    support: q17Distribution.find(d => d.value === 4)?.percentage || 0,
    targetAudience: 'All segments, especially parents',
    rationale: 'Reinforces core brand values of family connection',
   },
  ];

  return {
   q17Distribution,
   excitementByAge,
   parentPreference,
   nostalgiaCorrelation,
   strategicRecommendations,
  };
 }, [filteredData]);

 return (
  <section className="bg-white shadow-lg rounded-lg p-6">
   <h2 className="text-2xl font-bold text-gray-800 mb-2">Future Direction & Strategic Insights</h2>
   <p className="text-sm text-gray-600 mb-6">Question Q17: Most exciting future directions (1-4 ranking)</p>

   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Direction Excitement Distribution</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={futureData.q17Distribution}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="name" angle={-20} textAnchor="end" height={120} />
       <YAxis />
       <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
       <Bar dataKey="percentage" fill="#3B82F6" />
      </BarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Direction Preference Share</h3>
     <ResponsiveContainer width="100%" height={300}>
      <PieChart>
       <Pie
        data={futureData.q17Distribution}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percentage }) => `${percentage.toFixed(0)}%`}
        outerRadius={80}
        fill="#8884d8"
        dataKey="percentage"
       >
        {futureData.q17Distribution.map((_, index) => (
         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
       </Pie>
       <Tooltip />
       <Legend />
      </PieChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Nostalgia Score by Direction</h3>
     <ResponsiveContainer width="100%" height={300}>
      <BarChart data={futureData.nostalgiaCorrelation}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="direction" angle={-20} textAnchor="end" height={120} />
       <YAxis domain={[0, 100]} />
       <Tooltip />
       <Bar dataKey="avgNostalgia" fill="#10B981" />
      </BarChart>
     </ResponsiveContainer>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Parent vs Non-Parent Preferences</h3>
     <div className="space-y-4">
      {futureData.parentPreference.map((segment, idx) => (
       <div key={idx} className="bg-gray-50 p-4 rounded">
        <div className="font-semibold text-gray-800 mb-2">{segment.segment}</div>
        <div className="space-y-1 text-sm">
         {segment.preferences
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 3)
          .map((pref, i) => (
           <div key={i} className="flex justify-between">
            <span className="text-gray-700">{i + 1}. {pref.name}</span>
            <span className="font-semibold text-gray-800">{pref.percentage.toFixed(1)}%</span>
           </div>
          ))}
        </div>
       </div>
      ))}
     </div>
    </div>
   </div>

   <div>
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Strategic Recommendations</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     {futureData.strategicRecommendations.map((rec, idx) => (
      <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border-l-4 border-blue-600">
       <div className="flex items-start justify-between mb-2">
        <h4 className="font-bold text-gray-800">{rec.direction}</h4>
        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
         {rec.support.toFixed(0)}%
        </span>
       </div>
       <div className="space-y-2 text-sm">
        <div>
         <span className="text-gray-600">Target: </span>
         <span className="text-gray-800font-medium">{rec.targetAudience}</span>
        </div>
        <div>
         <span className="text-gray-600">Rationale: </span>
         <span className="text-gray-700">{rec.rationale}</span>
        </div>
       </div>
      </div>
     ))}
    </div>
   </div>

   <div className="mt-6 bg-yellow-50 p-4 rounded border-l-4 border-yellow-600">
    <h3 className="text-lg font-semibold text-gray-800 mb-2">Key Takeaway</h3>
    <p className="text-sm text-gray-700">
     The most popular direction is <strong>{futureData.q17Distribution[0]?.name}</strong> with{' '}
     <strong>{futureData.q17Distribution[0]?.percentage.toFixed(1)}%</strong> support. This direction shows{' '}
     an average nostalgia score of{' '}
     <strong>
      {futureData.nostalgiaCorrelation
       .find(n => n.direction === futureData.q17Distribution[0]?.name)
       ?.avgNostalgia.toFixed(1)}
     </strong>
     , indicating strong emotional resonance with respondents.
    </p>
   </div>
  </section>
 );
};
