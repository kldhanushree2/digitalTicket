import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ticketService from "../services/ticketService";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Returns a flat array representing one calendar month grid, including
// leading/trailing nulls for days outside the month so the grid always
// lines up under the correct weekday column.
const buildMonthGrid = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay(); // 0 = Sunday

  const grid = [];
  for (let i = 0; i < startWeekday; i++) grid.push(null);
  for (let day = 1; day <= daysInMonth; day++) grid.push(day);
  return grid;
};

const Calendar = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date()); // which month is showing
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await ticketService.getTickets();
        setTickets(data);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const grid = buildMonthGrid(year, month);

  // Groups tickets by "YYYY-M-D" so each calendar cell can look up its
  // tickets in O(1) instead of filtering the whole list per cell.
  const ticketsByDay = {};
  tickets.forEach((t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    (ticketsByDay[key] = ticketsByDay[key] || []).push(t);
  });

  const goToMonth = (offset) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const isSameDay = (a, b) =>
    a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const today = new Date();
  const selectedKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
  const selectedTickets = ticketsByDay[selectedKey] || [];

  if (loading) return <p className="page-status">Loading calendar...</p>;

  return (
    <div className="page">
      <h1>Calendar</h1>

      <div className="calendar-header">
        <button className="btn btn-secondary" onClick={() => goToMonth(-1)}>
          ‹ Prev
        </button>
        <h2>
          {MONTH_NAMES[month]} {year}
        </h2>
        <button className="btn btn-secondary" onClick={() => goToMonth(1)}>
          Next ›
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="calendar-weekday">
            {label}
          </div>
        ))}

        {grid.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} className="calendar-cell empty" />;

          const cellDate = new Date(year, month, day);
          const key = `${year}-${month}-${day}`;
          const dayTickets = ticketsByDay[key] || [];

          return (
            <button
              key={key}
              className={[
                "calendar-cell",
                isSameDay(cellDate, today) ? "is-today" : "",
                isSameDay(cellDate, selectedDate) ? "is-selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSelectedDate(cellDate)}
            >
              <span className="calendar-day-number">{day}</span>
              {dayTickets.length > 0 && <span className="calendar-dot">{dayTickets.length}</span>}
            </button>
          );
        })}
      </div>

      <div className="calendar-selected-day">
        <h3>
          {selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </h3>

        {selectedTickets.length === 0 ? (
          <p className="page-status">No tickets on this day.</p>
        ) : (
          <ul className="calendar-ticket-list">
            {selectedTickets.map((t) => (
              <li key={t._id}>
                <Link to={`/tickets/${t._id}`}>
                  {t.eventName} {t.time && `· ${t.time}`}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Calendar;
