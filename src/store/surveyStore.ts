import { create } from 'zustand';
import { SurveyResponse, FilterState } from '../types/survey';

interface SurveyStore {
  data: SurveyResponse[];
  filteredData: SurveyResponse[];
  filters: FilterState;
  darkMode: boolean;
  setData: (data: SurveyResponse[]) => void;
  setFilters: (filters: FilterState) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  toggleDarkMode: () => void;
}

const defaultFilters: FilterState = {
  ageGroups: [],
  genders: [],
  locations: [],
  incomes: [],
  npsRange: [1, 5],
  nostalgiaRange: [0, 100],
  hasChildren27: 'all',
  numberOfChildren: [],
};

export const useSurveyStore = create<SurveyStore>((set, get) => ({
  data: [],
  filteredData: [],
  filters: defaultFilters,
  darkMode: false,

  setData: (data) => {
    const safeData = Array.isArray(data) ? data : [];
    set({ data: safeData, filteredData: safeData });
  },

  setFilters: (filters) => set({ filters }),

  applyFilters: () => {
    const { data, filters } = get();

    if (!Array.isArray(data) || data.length === 0) {
      set({ filteredData: [] });
      return;
    }

    const filtered = data.filter((row) => {
      if (filters.ageGroups.length > 0 && !filters.ageGroups.includes(row.age_group)) {
        return false;
      }

      if (filters.genders.length > 0 && !filters.genders.includes(row.gender)) {
        return false;
      }

      if (filters.locations.length > 0 && !filters.locations.includes(row.location)) {
        return false;
      }

      if (filters.incomes.length > 0 && !filters.incomes.includes(row.household_income)) {
        return false;
      }

      if (row.q19_nps_little_tikes_1_5 < filters.npsRange[0] || row.q19_nps_little_tikes_1_5 > filters.npsRange[1]) {
        return false;
      }

      if (row.q11_nostalgia_little_tikes_0_100 < filters.nostalgiaRange[0] || row.q11_nostalgia_little_tikes_0_100 > filters.nostalgiaRange[1]) {
        return false;
      }

      if (filters.hasChildren27 === 'yes' && row.children_2_7 !== 1) {
        return false;
      }
      if (filters.hasChildren27 === 'no' && row.children_2_7 !== 0) {
        return false;
      }

      if (filters.numberOfChildren && filters.numberOfChildren.length > 0) {
        const numChildren = row.number_of_children;
        // Options: 1, 2, 3, 4 (where 4 means 4 or more)
        const includesFourPlus = filters.numberOfChildren.includes(4);

        let match = false;
        if (filters.numberOfChildren.includes(numChildren)) {
          match = true;
        } else if (includesFourPlus && numChildren >= 4) {
          match = true;
        }

        if (!match) {
          return false;
        }
      }

      return true;
    });

    set({ filteredData: filtered });
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
    get().applyFilters();
  },

  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));
