// This module handles in-app reminders. IMPORTANT LIMITATION to be upfront
// about: these are scheduled with setTimeout() in the browser tab, which
// means they only fire while this tab is open. A "real" push notification
// system that works even when the browser is closed needs a service worker
// registered with the browser's push service, plus a backend that stores
// push subscriptions and sends them - that's a meaningful separate feature,
// not something bolted onto an existing REST API. This gives you genuinely
// working reminders for the common case (app open in a background tab),
// which is honest scope for this project.

const REMINDER_MINUTES_KEY = "digitalticket_reminder_minutes";
const NOTIFIED_TICKETS_KEY = "digitalticket_notified_tickets";

// How many minutes before an event to notify. Defaults to 60 (1 hour).
export const getReminderMinutes = () => {
  const stored = localStorage.getItem(REMINDER_MINUTES_KEY);
  return stored ? parseInt(stored, 10) : 60;
};

export const setReminderMinutes = (minutes) => {
  localStorage.setItem(REMINDER_MINUTES_KEY, String(minutes));
};

// Tracks which tickets we've already notified for, so refreshing the page
// or navigating around doesn't re-fire the same reminder repeatedly.
const getNotifiedSet = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIFIED_TICKETS_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const markNotified = (ticketId) => {
  const notified = getNotifiedSet();
  notified.add(ticketId);
  localStorage.setItem(NOTIFIED_TICKETS_KEY, JSON.stringify([...notified]));
};

// Browsers silently fire setTimeout immediately if the delay exceeds a
// 32-bit signed integer (~24.8 days) instead of actually waiting - so we
// simply skip scheduling anything further out than that. It'll get picked
// up automatically on a later run once it's within range.
const MAX_TIMEOUT_MS = 2_147_000_000;

// Computes the actual Date+time an event starts, combining the `date` and
// optional `time` ("HH:MM") fields from a ticket.
const getEventDateTime = (ticket) => {
  const eventDate = new Date(ticket.date);
  if (ticket.time) {
    const [hours, minutes] = ticket.time.split(":").map(Number);
    eventDate.setHours(hours || 0, minutes || 0, 0, 0);
  }
  return eventDate;
};

// Schedules one browser notification per eligible ticket. Returns a cleanup
// function that cancels all pending timers - call this when the component
// using it unmounts, or before rescheduling with a fresh ticket list.
export const scheduleReminders = (tickets) => {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return () => {};
  }

  const reminderMinutes = getReminderMinutes();
  const notified = getNotifiedSet();
  const timerIds = [];

  tickets.forEach((ticket) => {
    if (notified.has(ticket._id)) return;

    const eventDateTime = getEventDateTime(ticket);
    const reminderTime = eventDateTime.getTime() - reminderMinutes * 60 * 1000;
    const delay = reminderTime - Date.now();

    // Skip if the reminder time already passed, or is too far in the future
    // to safely schedule right now.
    if (delay <= 0 || delay > MAX_TIMEOUT_MS) return;

    const timerId = setTimeout(() => {
      new Notification(`Upcoming: ${ticket.eventName}`, {
        body: `Starts in ${reminderMinutes} minute${reminderMinutes === 1 ? "" : "s"}${
          ticket.venue ? ` · ${ticket.venue}` : ""
        }`,
      });
      markNotified(ticket._id);
    }, delay);

    timerIds.push(timerId);
  });

  return () => timerIds.forEach(clearTimeout);
};
