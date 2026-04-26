import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  filters: {
    search: '',
    domain: [],
    tech_stack: [],
    award: [],
    page: 1,
    per_page: 12,
  },
  total: 0,
  totalPages: 1,
  isLoading: false,
  domains: [],
  techStacks: [],

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: newFilters.page || 1 },
    }));
  },

  fetchProjects: async () => {
    const { filters } = get();
    set({ isLoading: true });

    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.domain.length) params.append('domain', filters.domain.join(','));
      if (filters.tech_stack.length) params.append('tech_stack', filters.tech_stack.join(','));
      if (filters.award.length) params.append('award', filters.award.join(','));
      params.append('page', filters.page.toString());
      params.append('per_page', filters.per_page.toString());

      const { data } = await axiosClient.get(`/projects/?${params.toString()}`);
      set({
        projects: data.projects,
        total: data.total,
        totalPages: data.total_pages,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      set({ isLoading: false });
    }
  },

  fetchProjectById: async (id) => {
    set({ isLoading: true, currentProject: null });
    try {
      const { data } = await axiosClient.get(`/projects/${id}`);
      set({ currentProject: data, isLoading: false });
      return data;
    } catch (err) {
      console.error('Failed to fetch project:', err);
      set({ isLoading: false });
      throw err;
    }
  },

  fetchDomains: async () => {
    try {
      const { data } = await axiosClient.get('/projects/domains');
      set({ domains: data });
    } catch (err) {
      console.error('Failed to fetch domains:', err);
    }
  },

  fetchTechStacks: async () => {
    try {
      const { data } = await axiosClient.get('/projects/tech-stacks');
      set({ techStacks: data });
    } catch (err) {
      console.error('Failed to fetch tech stacks:', err);
    }
  },
}));
