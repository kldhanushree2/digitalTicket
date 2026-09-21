import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ticketService from "../services/ticketService";
import { scheduleReminders, getReminderMinutes, setReminderMinutes } from "../utils/reminders";

// Runs silently in the background (mounted once in App.jsx, outside the
// page routes) so reminders keep working no matter which page the user is
// currently on. Re-fetches tickets and reschedules every 5 minutes to pick
// up newly uploaded tickets without needing a page refresh.
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const ReminderManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return; // only schedule reminders while logged in

    let cleanupCurrent = () => {};

    const refresh = async () => {
      try {
        const tickets = await ticketService.getTickets();
        cleanupCurrent(); // cancel previously scheduled timers before rescheduling
        cleanupCurrent = scheduleReminders(tickets);
      } catch {
        // Silently ignore - reminders are a nice-to-have, not worth
        // surfacing an error banner over on every page in the app.
      }
    };

    refresh();
    const intervalId = setInterval(refresh, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      cleanupCurrent();
    };
  }, [user]);

  return null; // this component only runs side effects, renders nothing
};

// A small settings panel (used on the Dashboard) letting the user enable
// browser notifications and choose how far ahead to be reminded.
export const ReminderSettings = () => {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [minutes, setMinutes] = useState(getReminderMinutes());

  const handleEnable = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const handleMinutesChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setMinutes(value);
    setReminderMinutes(value);
  };

  if (permission === "unsupported") {
    return null; // browser doesn't support notifications at all - hide silently
  }

  return (
    <div className="reminder-settings">
      {permission === "granted" ? (
        <>
          <span className="reminder-status">🔔 Reminders enabled</span>
          <label>
            Remind me
            <select value={minutes} onChange={handleMinutesChange}>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={1440}>1 day before</option>
            </select>
          </label>
        </>
      ) : (
        <button className="btn btn-secondary" onClick={handleEnable}>
          {permission === "denied" ? "Notifications blocked in browser" : "🔔 Enable Reminders"}
        </button>
      )}
    </div>
  );
};
