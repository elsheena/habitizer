/**
 * CalendarTimeUtil — Pure Time Math & Interval Helper Utility.
 * Single Responsibility: Convert between "HH:MM" 24-hour strings and minutes from midnight,
 * perform 15-minute grid snapping calculations, and format time intervals.
 */
class CalendarTimeUtil {
  /**
   * Convert "HH:MM" string to minutes from midnight (0 - 1440).
   * @param {string} timeStr
   * @returns {number}
   */
  static timeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.trim().split(':');
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  }

  /**
   * Convert minutes from midnight to "HH:MM" 24-hour string.
   * @param {number} totalMinutes
   * @returns {string}
   */
  static minutesToTime(totalMinutes) {
    if (isNaN(totalMinutes) || totalMinutes < 0) totalMinutes = 0;
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Snap minutes to nearest step (default 15 minutes).
   * @param {number} minutes
   * @param {number} [step=15]
   * @returns {number}
   */
  static snapMinutes(minutes, step = 15) {
    return Math.floor(minutes / step) * step;
  }

  /**
   * Format start and end time range.
   * @param {string} startStr
   * @param {string} endStr
   * @returns {string}
   */
  static formatTimeRange(startStr, endStr) {
    return `${startStr || '00:00'} - ${endStr || '00:00'}`;
  }
}

window.CalendarTimeUtil = CalendarTimeUtil;
