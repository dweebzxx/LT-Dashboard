import { useMemo } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { SurveyResponse } from '../../types/survey';

export const UnderTheHoodSection = () => {
  const { filteredData } = useSurveyStore();

  const summaryData = useMemo(() => {
    if (filteredData.length === 0) return [];

    const keys = Object.keys(filteredData[0]) as (keyof SurveyResponse)[];
    return keys.map(key => {
      const values = filteredData.map(r => r[key]);
      const definedValues = values.filter(v => v !== undefined && v !== null && v !== '');
      const count = definedValues.length;

      // Check if it's likely qualitative data (string and has length > 0 and many unique values relative to count)
      const isQualitative = definedValues.length > 0 && typeof definedValues[0] === 'string' && new Set(definedValues).size > 5;

      // Get sample if qualitative
      const samples = isQualitative ? definedValues.slice(0, 5).join(' | ') : '';

      return {
        question: key,
        count,
        isQualitative,
        samples
      };
    });
  }, [filteredData]);

  return (
    <section className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Under The Hood (Data Summary)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="p-3 font-semibold text-gray-700">Question / Field</th>
              <th className="p-3 font-semibold text-gray-700">Response Count</th>
              <th className="p-3 font-semibold text-gray-700">Data Type</th>
              <th className="p-3 font-semibold text-gray-700">Sample Data (First 5)</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-800">{item.question}</td>
                <td className="p-3 text-gray-600">{item.count}</td>
                <td className="p-3 text-gray-600">
                  {item.isQualitative ? (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Qualitative</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Quantitative/Categorical</span>
                  )}
                </td>
                <td className="p-3 text-gray-500 italic truncate max-w-xs" title={item.samples}>
                  {item.samples || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
