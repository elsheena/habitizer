/**
 * IcalParserService — RFC 5545 iCal / ICS Feed Parser.
 * Single Responsibility: Ingest raw iCal text/streams and parse into structured VEVENT objects with ISO timestamps.
 */
class IcalParserService {
  /**
   * Fetch and parse an iCal feed from a URL.
   * @param {string} url
   * @returns {Promise<Array<Object>>}
   */
  static async fetchAndParse(url) {
    const fetchUrl = url.replace(/^webcal:\/\//i, 'https://');
    const resp = await fetch(fetchUrl);
    if (!resp.ok) {
      throw new Error(`Failed to fetch iCal feed (HTTP ${resp.status})`);
    }
    const icsText = await resp.text();
    return IcalParserService.parseICSString(icsText);
  }

  /**
   * Parse raw ICS text string into event objects.
   * @param {string} icsContent
   * @returns {Array<Object>}
   */
  static parseICSString(icsContent) {
    if (!icsContent || typeof icsContent !== 'string') return [];

    const events = [];
    const lines = icsContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    let inEvent = false;
    let currentEvent = {};

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Handle unfolded multi-line ICS properties
      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        line += lines[i + 1].substring(1);
        i++;
      }

      const trimmed = line.trim();
      if (trimmed === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {
          id: 'gcal_' + Math.random().toString(36).substr(2, 9),
          title: 'Busy Event',
          startTime: '09:00',
          endTime: '10:00',
          date: '2026-08-28',
          startISO: '',
          endISO: '',
          location: '',
          description: '',
          isGoogleEvent: true
        };
      } else if (trimmed === 'END:VEVENT') {
        if (inEvent && currentEvent.title) {
          events.push(currentEvent);
        }
        inEvent = false;
      } else if (inEvent) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const rawKey = line.substring(0, colonIdx);
          const val = line.substring(colonIdx + 1).trim();
          const key = rawKey.split(';')[0].toUpperCase();

          if (key === 'SUMMARY') {
            currentEvent.title = val;
          } else if (key === 'LOCATION') {
            currentEvent.location = val;
          } else if (key === 'DESCRIPTION') {
            currentEvent.description = val;
          } else if (key === 'DTSTART') {
            const parsed = IcalParserService.parseIcsDate(val);
            if (parsed) {
              currentEvent.date = parsed.dateStr;
              currentEvent.startTime = parsed.timeStr;
              currentEvent.startISO = parsed.iso;
            }
          } else if (key === 'DTEND') {
            const parsed = IcalParserService.parseIcsDate(val);
            if (parsed) {
              currentEvent.endTime = parsed.timeStr;
              currentEvent.endISO = parsed.iso;
            }
          } else if (key === 'UID') {
            currentEvent.id = 'gcal_' + val.replace(/[^a-zA-Z0-9_-]/g, '').substr(0, 20);
          }
        }
      }
    }

    return events;
  }

  /**
   * Parse ICS date format (e.g. 20260828T090000Z or 20260828).
   * @param {string} dateStr
   * @returns {{dateStr: string, timeStr: string, iso: string}|null}
   */
  static parseIcsDate(dateStr) {
    if (!dateStr) return null;
    const clean = dateStr.replace(/[^0-9TZ]/g, '');

    if (clean.length >= 8) {
      const year = clean.substring(0, 4);
      const month = clean.substring(4, 6);
      const day = clean.substring(6, 8);
      const dateStrOut = `${year}-${month}-${day}`;

      let timeStr = '09:00';
      if (clean.includes('T') && clean.length >= 13) {
        const tIdx = clean.indexOf('T');
        const hour = clean.substring(tIdx + 1, tIdx + 3);
        const min = clean.substring(tIdx + 3, tIdx + 5);
        timeStr = `${hour}:${min}`;
      }

      return {
        dateStr: dateStrOut,
        timeStr: timeStr,
        iso: `${dateStrOut}T${timeStr}:00`
      };
    }
    return null;
  }
}

window.IcalParserService = IcalParserService;
