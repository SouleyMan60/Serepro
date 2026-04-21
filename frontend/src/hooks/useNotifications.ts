import { useState, useCallback } from "react";
import api from "../config/api";

export interface NotificationPrefs {
  emailEnabled: boolean;
  emailAddress: string;
  smsEnabled: boolean;
  smsPhone: string;
  whatsappEnabled: boolean;
  whatsappPhone: string;
  reminderDays: number[];
}

const LS_KEY = "serepro_notif_prefs";

const DEFAULT: NotificationPrefs = {
  emailEnabled: false,
  emailAddress: "",
  smsEnabled: false,
  smsPhone: "",
  whatsappEnabled: false,
  whatsappPhone: "",
  reminderDays: [7, 3],
};

function load(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT };
}

export function useNotifications() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(load);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = useCallback(async (next: NotificationPrefs) => {
    setSaving(true);
    setSaved(false);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      setPrefs(next);
      // Persist to backend (best-effort — field ignored if column absent)
      await api.patch("/users/profile", { notificationPrefs: next }).catch(() => {});
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }, []);

  return { prefs, save, saving, saved };
}
