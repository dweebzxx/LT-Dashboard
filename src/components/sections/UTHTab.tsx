import { useMemo } from 'react';
import { useSurveyStore } from '../../store/surveyStore';

export const UTHTab = () => {
  const { filteredData } = useSurveyStore();

  const columnStats = useMemo(() => {
    if (filteredData.length === 0) return [];

    const keys = Object.keys(filteredData[0]);
    return keys.map((key) => {
      const counts: Record<string, number> = {};
      filteredData.forEach((row) => {
        const value = row[key as keyof typeof row];
        const stringValue = String(value);
        counts[stringValue] = (counts[stringValue] || 0) + 1;
      });
      return { key, counts };
    });
  }, [filteredData]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Under the Hood (UTH) Data Check</h2>
      {columnStats.map((stat) => (
        <div key={stat.key} className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{stat.key}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Value</th>
                  <th scope="col" className="px-6 py-3">Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stat.counts).map(([value, count]) => (
                  <tr key={value} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{value}</td>
                    <td className="px-6 py-4">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};
