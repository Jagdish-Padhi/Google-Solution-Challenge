import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

const useReportStore = create((set, get) => ({
	isGenerating: false,
	progress: 0,
	generatedReport: null,
	
	startGeneration: async (queryParams) => {
		if (get().isGenerating) return;

		set({ isGenerating: true, progress: 0, generatedReport: null });

		const progressTimer = setInterval(() => {
			set((state) => {
				if (state.progress >= 95) return state;
				const increment = state.progress < 40 ? 8 : state.progress < 80 ? 3 : 1;
				return { progress: state.progress + increment };
			});
		}, 300);

		try {
			const response = await api.post('/reports/generate', queryParams);
			const newReport = response.data?.report;

			clearInterval(progressTimer);
			set({ progress: 100 });

			if (newReport) {
				setTimeout(() => {
					set({ generatedReport: newReport });
					// We keep isGenerating true so the modal knows we're showing the result
					// But we'll handle the 'Done' state in the modal
				}, 600);
			} else {
				set({ isGenerating: false });
				toast.error('Report generated but data was missing.');
			}
		} catch (error) {
			clearInterval(progressTimer);
			set({ isGenerating: false });
			const message = error.response?.data?.message || 'Unable to generate report.';
			toast.error(message);
		}
	},

	dismissModal: () => set({ isGenerating: false, generatedReport: null, progress: 0 }),
	// For continuing in background
	hideGenerating: () => set({ isGenerating: false }),
}));

export default useReportStore;
