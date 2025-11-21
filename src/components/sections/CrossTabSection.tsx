import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSurveyStore } from '../../store/surveyStore';
import { calculateMean, getLabelForValue } from '../../utils/calculations';

export const CrossTabSection = () => {
 const { filteredData } = useSurveyStore();
 const [selectedCrossTab, setSelectedCrossTab] = useState<'age-nps' | 'parent-nostalgia' | 'income-purchase'>('age-nps');

 const crossTabData = useMemo(() => {
  const ageByNPS = Array.from({ length: 6 }, (_, i) => {
   const ageValue = i + 1;
   const ageGroup = filteredData.filter(r => r.age_group === ageValue);

   return {
    age: ['18-24', '25-29', '30-34', '35-39', '40-44', '45+'][i],
    detractors: ageGroup.filter(r => r.q19_nps_little_tikes_1_5 <= 2).length,
    passives: ageGroup.filter(r => r.q19_nps_little_tikes_1_5 === 3).length,
    promoters: ageGroup.filter(r => r.q19_nps_little_tikes_1_5 >= 4).length,
    total: ageGroup.length,
   };
  });

  const parentByNostalgia = [
   {
    segment: 'Parents (2-7)',
    low: filteredData.filter(r => r.children_2_7 === 1 && r.q11_nostalgia_little_tikes_0_100 < 34).length,
    medium: filteredData.filter(r => r.children_2_7 === 1 && r.q11_nostalgia_little_tikes_0_100 >= 34 && r.q11_nostalgia_little_tikes_0_100 < 67).length,
    high: filteredData.filter(r => r.children_2_7 === 1 && r.q11_nostalgia_little_tikes_0_100 >= 67).length,
   },
   {
    segment: 'Non-Parents',
    low: filteredData.filter(r => r.children_2_7 === 0 && r.q11_nostalgia_little_tikes_0_100 < 34).length,
    medium: filteredData.filter(r => r.children_2_7 === 0 && r.q11_nostalgia_little_tikes_0_100 >= 34 && r.q11_nostalgia_little_tikes_0_100 < 67).length,
    high: filteredData.filter(r => r.children_2_7 === 0 && r.q11_nostalgia_little_tikes_0_100 >= 67).length,
   },
  ];

  const incomeByPurchase = [1, 2, 3, 4].map(income => {
   const incomeGroup = filteredData.filter(r => r.household_income === income);
   const purchaseScores = incomeGroup.map(r => r.q8_memories_influence_purchase_1_5);

   return {
    income: getLabelForValue('household_income', income),
    avgPurchase: calculateMean(purchaseScores),
    veryLow: incomeGroup.filter(r => r.q8_memories_influence_purchase_1_5 === 1).length,
    low: incomeGroup.filter(r => r.q8_memories_influence_purchase_1_5 === 2).length,
    moderate: incomeGroup.filter(r => r.q8_memories_influence_purchase_1_5 === 3).length,
    high: incomeGroup.filter(r => r.q8_memories_influence_purchase_1_5 === 4).length,
    veryHigh: incomeGroup.filter(r => r.q8_memories_influence_purchase_1_5 === 5).length,
    total: incomeGroup.length,
   };
  });

  const calculateChiSquare = (observed: number[][], expected: number[][]): number => {
   let chiSquare = 0;
   for (let i = 0; i < observed.length; i++) {
    for (let j = 0; j < observed[i].length; j++) {
     if (expected[i][j] > 0) {
      chiSquare += Math.pow(observed[i][j] - expected[i][j], 2) / expected[i][j];
     }
    }
   }
   return chiSquare;
  };

  const ageNPSObserved = ageByNPS.map(row => [row.detractors, row.passives, row.promoters]);
  const ageNPSRowTotals = ageByNPS.map(row => row.total);
  const ageNPSColTotals = [
   ageByNPS.reduce((sum, row) => sum + row.detractors, 0),
   ageByNPS.reduce((sum, row) => sum + row.passives, 0),
   ageByNPS.reduce((sum, row) => sum + row.promoters, 0),
  ];
  const ageNPSTotal = ageNPSRowTotals.reduce((sum, val) => sum + val, 0);
  const ageNPSExpected = ageNPSRowTotals.map(rowTotal =>
   ageNPSColTotals.map(colTotal => (rowTotal * colTotal) / ageNPSTotal)
  );
  const ageNPSChiSquare = calculateChiSquare(ageNPSObserved, ageNPSExpected);

  const genderByDirection = [1, 2, 3, 4].map(gender => {
   const genderGroup = filteredData.filter(r => r.gender === gender);
   return {
    gender: getLabelForValue('gender', gender),
    vintage: genderGroup.filter(r => r.q17_future_directions_excitement_1_4 === 1).length,
    tech: genderGroup.filter(r => r.q17_future_directions_excitement_1_4 === 2).length,
    popCulture: genderGroup.filter(r => r.q17_future_directions_excitement_1_4 === 3).length,
    familyPlay: genderGroup.filter(r => r.q17_future_directions_excitement_1_4 === 4).length,
    total: genderGroup.length,
   };
  });

  const locationByModernization = [1, 2, 3].map(location => {
   const locationGroup = filteredData.filter(r => r.location === location);
   const modernScores = locationGroup.map(r => r.q14_perception_brand_feels_modern_1_5);
   const techScores = locationGroup.map(r => r.q14_perception_brand_incorporate_technology_1_5);

   return {
    location: getLabelForValue('location', location),
    modern: calculateMean(modernScores),
    tech: calculateMean(techScores),
    count: locationGroup.length,
   };
  });

  return {
   ageByNPS,
   parentByNostalgia,
   incomeByPurchase,
   genderByDirection,
   locationByModernization,
   ageNPSChiSquare,
   ageNPSDegreesOfFreedom: (ageByNPS.length - 1) * (3 - 1),
  };
 }, [filteredData]);

 const renderCrossTab = () => {
  switch (selectedCrossTab) {
   case 'age-nps':
    return (
     <div>
      <ResponsiveContainer width="100%" height={400}>
       <BarChart data={crossTabData.ageByNPS}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="age" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="detractors" stackId="a" fill="#EF4444" name="Detractors" />
        <Bar dataKey="passives" stackId="a" fill="#F59E0B" name="Passives" />
        <Bar dataKey="promoters" stackId="a" fill="#10B981" name="Promoters" />
       </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 bg-blue-50 p-4 rounded">
       <div className="text-sm">
        <strong>Chi-Square Test:</strong> χ² = {crossTabData.ageNPSChiSquare.toFixed(2)},
        df = {crossTabData.ageNPSDegreesOfFreedom}
        <div className="mt-1 text-xs text-gray-600">
         {crossTabData.ageNPSChiSquare > 12.59
          ? 'Statistically significant relationship (p < 0.05)'
          : 'No statistically significant relationship found'}
        </div>
       </div>
      </div>
     </div>
    );

   case 'parent-nostalgia':
    return (
     <div>
      <ResponsiveContainer width="100%" height={400}>
       <BarChart data={crossTabData.parentByNostalgia}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="segment" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="low" fill="#EF4444" name="Low Nostalgia (0-33)" />
        <Bar dataKey="medium" fill="#F59E0B" name="Medium Nostalgia (34-66)" />
        <Bar dataKey="high" fill="#10B981" name="High Nostalgia (67-100)" />
       </BarChart>
      </ResponsiveContainer>
      <div className="mt-4">
       <table className="w-full text-sm">
        <thead className="bg-gray-100">
         <tr>
          <th className="p-2 text-left">Segment</th>
          <th className="p-2 text-center">Low</th>
          <th className="p-2 text-center">Medium</th>
          <th className="p-2 text-center">High</th>
          <th className="p-2 text-center">Total</th>
         </tr>
        </thead>
        <tbody>
         {crossTabData.parentByNostalgia.map((row, idx) => {
          const total = row.low + row.medium + row.high;
          return (
           <tr key={idx} className="border-t border-gray-200">
            <td className="p-2 font-semibold">{row.segment}</td>
            <td className="p-2 text-center">{row.low} ({((row.low / total) * 100).toFixed(1)}%)</td>
            <td className="p-2 text-center">{row.medium} ({((row.medium / total) * 100).toFixed(1)}%)</td>
            <td className="p-2 text-center">{row.high} ({((row.high / total) * 100).toFixed(1)}%)</td>
            <td className="p-2 text-center font-semibold">{total}</td>
           </tr>
          );
         })}
        </tbody>
       </table>
      </div>
     </div>
    );

   case 'income-purchase':
    return (
     <div>
      <ResponsiveContainer width="100%" height={400}>
       <BarChart data={crossTabData.incomeByPurchase}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="income" angle={-15} textAnchor="end" height={80} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="veryLow" stackId="a" fill="#DC2626" name="Very Low" />
        <Bar dataKey="low" stackId="a" fill="#F59E0B" name="Low" />
        <Bar dataKey="moderate" stackId="a" fill="#F59E0B" name="Moderate" />
        <Bar dataKey="high" stackId="a" fill="#10B981" name="High" />
        <Bar dataKey="veryHigh" stackId="a" fill="#059669" name="Very High" />
       </BarChart>
      </ResponsiveContainer>
      <div className="mt-4">
       <table className="w-full text-sm">
        <thead className="bg-gray-100">
         <tr>
          <th className="p-2 text-left">Income</th>
          <th className="p-2 text-center">Avg Purchase Intent</th>
          <th className="p-2 text-center">Count</th>
         </tr>
        </thead>
        <tbody>
         {crossTabData.incomeByPurchase.map((row, idx) => (
          <tr key={idx} className="border-t border-gray-200">
           <td className="p-2 font-semibold">{row.income}</td>
           <td className="p-2 text-center">{row.avgPurchase.toFixed(2)}</td>
           <td className="p-2 text-center">{row.total}</td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     </div>
    );

   default:
    return null;
  }
 };

 return (
  <section className="bg-white shadow-lg rounded-lg p-6">
   <h2 className="text-2xl font-bold text-gray-800 mb-6">Cross-Tabulation Analysis</h2>

   <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">
     Select Cross-Tab Analysis
    </label>
    <select
     value={selectedCrossTab}
     onChange={(e) => setSelectedCrossTab(e.target.value as any)}
     className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded bg-white dark:bg-gray-700 text-gray-800"
    >
     <option value="age-nps">Age Group × NPS Category</option>
     <option value="parent-nostalgia">Parent Status × Nostalgia Level</option>
     <option value="income-purchase">Income Level × Purchase Influence</option>
    </select>
   </div>

   {renderCrossTab()}

   <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Gender × Future Direction</h3>
     <div className="overflow-x-auto">
      <table className="w-full text-sm">
       <thead className="bg-gray-100">
        <tr>
         <th className="p-2 text-left">Gender</th>
         <th className="p-2 text-center">Vintage</th>
         <th className="p-2 text-center">Tech</th>
         <th className="p-2 text-center">Pop Culture</th>
         <th className="p-2 text-center">Family Play</th>
        </tr>
       </thead>
       <tbody>
        {crossTabData.genderByDirection.map((row, idx) => (
         <tr key={idx} className="border-t border-gray-200">
          <td className="p-2 font-semibold">{row.gender}</td>
          <td className="p-2 text-center">{row.vintage} ({((row.vintage / row.total) * 100).toFixed(0)}%)</td>
          <td className="p-2 text-center">{row.tech} ({((row.tech / row.total) * 100).toFixed(0)}%)</td>
          <td className="p-2 text-center">{row.popCulture} ({((row.popCulture / row.total) * 100).toFixed(0)}%)</td>
          <td className="p-2 text-center">{row.familyPlay} ({((row.familyPlay / row.total) * 100).toFixed(0)}%)</td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </div>

    <div>
     <h3 className="text-lg font-semibold text-gray-800 mb-4">Location × Modernization Perception</h3>
     <ResponsiveContainer width="100%" height={250}>
      <BarChart data={crossTabData.locationByModernization}>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="location" />
       <YAxis domain={[0, 5]} />
       <Tooltip />
       <Legend />
       <Bar dataKey="modern" fill="#3B82F6" name="Feels Modern" />
       <Bar dataKey="tech" fill="#8B5CF6" name="Tech Incorporation" />
      </BarChart>
     </ResponsiveContainer>
    </div>
   </div>

   <div className="mt-6 bg-gray-50 p-4 rounded">
    <h3 className="text-lg font-semibold text-gray-800 mb-3">Statistical Notes</h3>
    <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
     <li>Chi-square tests assess whether there is a statistically significant relationship between categorical variables</li>
     <li>p &lt; 0.05 indicates a statistically significant relationship (χ² &gt; critical value)</li>
     <li>Cross-tabulations reveal patterns in how different demographic groups respond to survey questions</li>
     <li>Higher percentages indicate stronger associations between categories</li>
    </ul>
   </div>
  </section>
 );
};
