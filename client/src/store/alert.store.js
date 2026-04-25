import { create } from 'zustand';
import api from '../services/api.js';

/**
 * alertStore — manages notification preferences.
 * Unread count and alert list are handled locally in
 * AlertBadge and DashboardAlertsPage respectively
 * (they use window events from useSocket for live updates).
 */
export const useAlertStore = create((set) => ({
  notificationPrefs: {
    emailOnHighConfidence: true,
    emailDigest: true,
    inAppAlerts: true,
  },
  loading: false,
  error: '',

  fetchNotificationPrefs: async () => {
    set({ loading: true, error: '' });
    try {
      const { data } = await api.get('/orgs/notification-prefs');
      set({ notificationPrefs: data.notificationPrefs, loading: false });
    } catch {
      set({ error: 'Failed to load preferences', loading: false });
    }
  },

  updateNotificationPrefs: async (prefs) => {
    set({ loading: true, error: '' });
    try {
      const { data } = await api.patch('/orgs/notification-prefs', prefs);
      set({ notificationPrefs: data.notificationPrefs, loading: false });
      return true;
    } catch {
      set({ error: 'Failed to update preferences', loading: false });
      return false;
    }
  },
}));
