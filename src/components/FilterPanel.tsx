import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { useSurveyStore } from '../store/surveyStore';
import { FilterState } from '../types/survey';

export const FilterPanel = () => {
  const { filters, setFilters, applyFilters, resetFilters } = useSurveyStore();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const handleApply = () => {
    setFilters(localFilters);
    applyFilters();
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultFilters: FilterState = {
      ageGroups: [],
      genders: [],
      locations: [],
      incomes: [],
      npsRange: [1, 5],
      nostalgiaRange: [0, 100],
      hasChildren27: 'all',
    };
    setLocalFilters(defaultFilters);
    setFilters(defaultFilters);
    resetFilters();
  };

  const toggleSelection = (category: keyof FilterState, value: number) => {
    const current = localFilters[category] as number[];
    if (current.includes(value)) {
      setLocalFilters({
        ...localFilters,
        [category]: current.filter(v => v !== value),
      });
    } else {
      setLocalFilters({
        ...localFilters,
        [category]: [...current, value],
      });
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 mb-6 border-l-8 border-red-500">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
      >
        <Filter size={20} />
        {isOpen ? 'Hide Filters' : 'Show Filters'}
      </button>

      {isOpen && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Age Groups</label>
            <div className="space-y-1">
              {[
                { value: 1, label: '18-24' },
                { value: 2, label: '25-29' },
                { value: 3, label: '30-34' },
                { value: 4, label: '35-39' },
                { value: 5, label: '40-44' },
                { value: 6, label: '45+' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(localFilters.ageGroups as number[]).includes(value)}
                    onChange={() => toggleSelection('ageGroups', value)}
                    className="rounded"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Gender</label>
            <div className="space-y-1">
              {[
                { value: 1, label: 'Male' },
                { value: 2, label: 'Female' },
                { value: 3, label: 'Non-binary' },
                { value: 4, label: 'Prefer not to say' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(localFilters.genders as number[]).includes(value)}
                    onChange={() => toggleSelection('genders', value)}
                    className="rounded"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <div className="space-y-1">
              {[
                { value: 1, label: 'Urban' },
                { value: 2, label: 'Suburban' },
                { value: 3, label: 'Rural' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(localFilters.locations as number[]).includes(value)}
                    onChange={() => toggleSelection('locations', value)}
                    className="rounded"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Household Income</label>
            <div className="space-y-1">
              {[
                { value: 1, label: '<$50K' },
                { value: 2, label: '$50-99K' },
                { value: 3, label: '$100-149K' },
                { value: 4, label: '$150K+' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(localFilters.incomes as number[]).includes(value)}
                    onChange={() => toggleSelection('incomes', value)}
                    className="rounded"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">NPS Score Range (1-5)</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                max="5"
                value={localFilters.npsRange[0]}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  npsRange: [parseInt(e.target.value), localFilters.npsRange[1]],
                })}
                className="w-20 px-2 py-1 border rounded"
              />
              <span>to</span>
              <input
                type="number"
                min="1"
                max="5"
                value={localFilters.npsRange[1]}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  npsRange: [localFilters.npsRange[0], parseInt(e.target.value)],
                })}
                className="w-20 px-2 py-1 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nostalgia Range (0-100)</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                max="100"
                value={localFilters.nostalgiaRange[0]}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  nostalgiaRange: [parseInt(e.target.value), localFilters.nostalgiaRange[1]],
                })}
                className="w-20 px-2 py-1 border rounded"
              />
              <span>to</span>
              <input
                type="number"
                min="0"
                max="100"
                value={localFilters.nostalgiaRange[1]}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  nostalgiaRange: [localFilters.nostalgiaRange[0], parseInt(e.target.value)],
                })}
                className="w-20 px-2 py-1 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Has Children 2-7</label>
            <select
              value={localFilters.hasChildren27}
              onChange={(e) => setLocalFilters({
                ...localFilters,
                hasChildren27: e.target.value as 'all' | 'yes' | 'no',
              })}
              className="w-full px-2 py-1 border rounded"
            >
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Number of Children</label>
            <div className="space-y-1">
              {[
                { value: 1, label: '1 child' },
                { value: 2, label: '2 children' },
                { value: 3, label: '3 children' },
                { value: 4, label: '4 or more children' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(localFilters.numberOfChildren || []).includes(value)}
                    onChange={() => toggleSelection('numberOfChildren', value)}
                    className="rounded"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="col-span-full flex gap-2 justify-end mt-4">
            <button
              onClick={handleReset}
              className="px-6 py-3 border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 font-semibold transition-all"
            >
              <X size={18} />
              Reset
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg transition-all transform hover:scale-105"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
