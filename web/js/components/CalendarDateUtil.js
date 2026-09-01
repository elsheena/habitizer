class CalendarDateUtil {
  static monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  static toDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  static getDisplayedDates(currentDate, dayCount) {
    const curr = new Date(currentDate);
    const now = new Date();
    const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dowsMon = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    if (dayCount === 1) {
      const isToday = (curr.getFullYear() === now.getFullYear() && curr.getMonth() === now.getMonth() && curr.getDate() === now.getDate());
      return [{ date: new Date(curr), dow: dows[curr.getDay()], dayNum: curr.getDate(), monthName: this.monthNames[curr.getMonth()].slice(0, 3), dateKey: this.toDateKey(curr), isToday }];
    }
    if (dayCount === 3) {
      const dates = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(curr);
        d.setDate(curr.getDate() + i);
        const isToday = (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate());
        dates.push({ date: d, dow: dows[d.getDay()], dayNum: d.getDate(), monthName: this.monthNames[d.getMonth()].slice(0, 3), dateKey: this.toDateKey(d), isToday });
      }
      return dates;
    }
    const dayOfWeek = (curr.getDay() + 6) % 7;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayOfWeek);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate());
      dates.push({ date: d, dow: dowsMon[i], dayNum: d.getDate(), monthName: this.monthNames[d.getMonth()].slice(0, 3), dateKey: this.toDateKey(d), isToday });
    }
    return dates;
  }

  static collectDayItems(dateObj, events, habits) {
    const rawItems = [];
    const parseTime = (timeStr) => window.CalendarTimeUtil ? window.CalendarTimeUtil.timeToMinutes(timeStr) : 0;

    (events || []).forEach(ev => {
      const evStart = ev.date || '2026-08-28';
      const r = (ev.repeat || 'none').toLowerCase();
      let match = (r === 'daily') ? dateObj.dateKey >= evStart : (r === 'weekdays' ? (dateObj.dateKey >= evStart && dateObj.date.getDay() >= 1 && dateObj.date.getDay() <= 5) : (r === 'weekly' ? (dateObj.dateKey >= evStart && dateObj.date.getDay() === new Date(evStart + 'T00:00:00').getDay()) : (dateObj.dateKey === evStart)));
      if (match) {
        let sTime = (ev.date_overrides && ev.date_overrides[dateObj.dateKey]?.startTime) || ev.startTime || '09:00';
        let eTime = (ev.date_overrides && ev.date_overrides[dateObj.dateKey]?.endTime) || ev.endTime || '10:00';
        rawItems.push({ type: 'event', id: ev.id, data: ev, title: ev.title, sub: ev.location || (ev.isGoogleEvent ? 'Google Calendar' : 'Custom Event'), dateKey: dateObj.dateKey, startMin: parseTime(sTime), endMin: parseTime(eTime) });
      }
    });

    (habits || []).forEach(h => {
      if (h.active !== false && h.is_active !== false) {
        const rawCreated = h.created_at || h.createdAt;
        const createdDate = rawCreated ? (typeof rawCreated === 'string' ? rawCreated.split('T')[0] : null) : null;
        if (createdDate && dateObj.dateKey < createdDate) return;

        const effTime = (window.API && window.API.getEffectiveHabitTime) ? window.API.getEffectiveHabitTime(h, dateObj.dateKey) : (h.scheduled_time || '09:00');
        const sMin = parseTime(effTime);

        if (createdDate && dateObj.dateKey === createdDate) {
          const now = new Date();
          const todayKey = CalendarDateUtil.toDateKey(now);
          if (dateObj.dateKey === todayKey) {
            const nowMin = now.getHours() * 60 + now.getMinutes();
            if (nowMin > sMin) return;
          }
        }

        rawItems.push({ type: 'habit', id: h.id, data: h, title: h.replacement_habit || h.bad_habit || 'Healthy Routine', sub: `Replaces: ${h.bad_habit || 'Trigger'}`, dateKey: dateObj.dateKey, startMin: sMin, endMin: sMin + 30 });
      }
    });
    return rawItems;
  }
}

window.CalendarDateUtil = CalendarDateUtil;
