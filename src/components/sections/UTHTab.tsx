import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsDown, ChevronsUp } from 'lucide-react';
import { useSurveyStore } from '../../store/surveyStore';
import { getLabelForValue } from '../../utils/calculations';

export const UTHTab = () => {
  const { filteredData } = useSurveyStore();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

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

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    setCollapsedSections({});
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    columnStats.forEach(stat => {
      allCollapsed[stat.key] = true;
    });
    setCollapsedSections(allCollapsed);
  };

  const getValueLabel = (key: string, value: string): string => {
    // Exclusions
    if (
      key === 'platforms_selections' ||
      key.startsWith('q15_') ||
      key.startsWith('q11_') ||
      key === 'q6_childhood_brand_other_text' ||
      key === 'platforms_other_text'
    ) {
      return value;
    }

    const numericValue = Number(value);
    if (isNaN(numericValue)) return value;

    // Helper to format label
    const fmt = (label: string) => `${value} (${label})`;

    // Check exact match in getLabelForValue
    const exactLabel = getLabelForValue(key, numericValue);
    if (exactLabel !== String(numericValue)) {
        return fmt(exactLabel);
    }

    // Pattern matching
    if (key.startsWith('q6_') && key.includes('rank')) return fmt(`Rank ${value}`);
    if (key.startsWith('q10_') && key.includes('rank')) return fmt(`Rank ${value}`);

    // Likert scales (1-5)
    // q7, q8, q9, q13, q14, q16, q19
    if (
        key.startsWith('q7_') ||
        key.startsWith('q8_') ||
        key.startsWith('q9_') ||
        key.startsWith('q13_') ||
        key.startsWith('q14_') ||
        key.startsWith('q16_') ||
        key.startsWith('q19_')
    ) {
        switch (numericValue) {
            case 1: return fmt('Strongly Disagree');
            case 2: return fmt('Disagree');
            case 3: return fmt('Neither');
            case 4: return fmt('Agree');
            case 5: return fmt('Strongly Agree');
        }
    }

    return value;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Under the Hood (UTH) Data Check</h2>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm font-medium"
          >
            <ChevronsDown size={16} />
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <ChevronsUp size={16} />
            Collapse All
          </button>
        </div>
      </div>

      {columnStats.map((stat) => (
        <div key={stat.key} className="bg-white shadow rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection(stat.key)}
            className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition-colors text-left focus:outline-none"
          >
            <h3 className="text-lg font-semibold text-gray-800">{stat.key}</h3>
            {collapsedSections[stat.key] ? (
              <ChevronDown className="text-gray-500" />
            ) : (
              <ChevronUp className="text-gray-500" />
            )}
          </button>

          {!collapsedSections[stat.key] && (
            <div className="p-6 border-t border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Value</th>
                      <th scope="col" className="px-6 py-3">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stat.counts)
                        .sort((a, b) => {
                            const valA = Number(a[0]);
                            const valB = Number(b[0]);
                            if (!isNaN(valA) && !isNaN(valB)) {
                                return valA - valB;
                            }
                            return a[0].localeCompare(b[0]);
                        })
                        .map(([value, count]) => (
                      <tr key={value} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{getValueLabel(stat.key, value)}</td>
                        <td className="px-6 py-4">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
