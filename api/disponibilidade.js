const DEFAULT_BUSINESS_TIME_ZONE = 'America/Recife';
const TIME_SLOTS = ['08:00', '10:00'];

function sendJson(response, status, payload) {
  response.status(status).json(payload);
}

function methodNotAllowed(response) {
  return sendJson(response, 405, {
    message: 'Método não permitido para este endpoint.',
  });
}

function getTimeSlotsForDate(date = '') {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return TIME_SLOTS;
  }

  return [2, 3, 4].includes(parsedDate.getDay()) ? TIME_SLOTS : [];
}

function getBusinessTimeZone() {
  const timeZone = String(process.env.BARBERGS_TIME_ZONE || DEFAULT_BUSINESS_TIME_ZONE)
    .trim()
    .replace(/^['"]|['"]$/g, '');

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return DEFAULT_BUSINESS_TIME_ZONE;
  }
}

function getZonedDateParts(date = new Date(), timeZone = getBusinessTimeZone()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const values = Object.fromEntries(
    formatter.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );

  return values;
}

function getTodayInBusinessTimeZone(now = new Date()) {
  const parts = getZonedDateParts(now);
  return [
    parts.year,
    String(parts.month).padStart(2, '0'),
    String(parts.day).padStart(2, '0'),
  ].join('-');
}

function buildAvailableDates() {
  const dates = [];
  const current = new Date(`${getTodayInBusinessTimeZone()}T00:00:00`);
  const currentMonth = current.getMonth();

  while (current.getMonth() === currentMonth) {
    const date = current.toISOString().slice(0, 10);

    if (getTimeSlotsForDate(date).length > 0) {
      dates.push(date);
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function isPastSameDaySlot(date = '', time = '', now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return false;
  }

  if (date !== getTodayInBusinessTimeZone(now)) {
    return false;
  }

  const parts = getZonedDateParts(now);
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute <= parts.hour * 60 + parts.minute;
}

function getAvailableTimeSlotsForDate(date = '', now = new Date()) {
  return getTimeSlotsForDate(date).filter((time) => !isPastSameDaySlot(date, time, now));
}

function getPlanAttendances(plans = []) {
  return plans.flatMap((plan) =>
    (plan.checklist || [])
      .filter((item) => item.date && item.time)
      .map((item) => ({
        data: item.date,
        horario: item.time,
        done: Boolean(item.done),
      })),
  );
}

async function loadScheduleData() {
  const firestore = await import('../server/lib/firestore.js');

  const [appointments, blockedPeriods, plans] = await Promise.all([
    firestore.listAppointments(),
    firestore.listBlockedPeriods(),
    firestore.listPlans(),
  ]);

  return { appointments, blockedPeriods, plans };
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return methodNotAllowed(response);
  }

  try {
    let appointments = [];
    let blockedPeriods = [];
    let plans = [];
    let degraded = false;

    try {
      ({ appointments, blockedPeriods, plans } = await loadScheduleData());
    } catch (firestoreError) {
      degraded = true;
      console.error('Availability Firestore read failed; returning generated open slots:', {
        message: firestoreError.message || 'unknown-error',
      });
    }

    const planAttendances = getPlanAttendances(plans).filter((item) => !item.done);
    const occupiedItems = [...appointments, ...planAttendances];
    const availableDates = buildAvailableDates();

    const occupiedByDate = occupiedItems.reduce((accumulator, item) => {
      const items = accumulator[item.data] || [];
      items.push(item);
      accumulator[item.data] = items;
      return accumulator;
    }, {});

    const blockedByDate = blockedPeriods.reduce((accumulator, blockedPeriod) => {
      const current = accumulator[blockedPeriod.date] || {
        fullDay: false,
        times: new Set(),
      };

      if (blockedPeriod.time) {
        current.times.add(blockedPeriod.time);
      } else {
        current.fullDay = true;
      }

      accumulator[blockedPeriod.date] = current;
      return accumulator;
    }, {});

    const dates = availableDates.map((date, index) => {
      const timeSlots = getAvailableTimeSlotsForDate(date);
      const blockedInfo = blockedByDate[date] || {
        fullDay: false,
        times: new Set(),
      };
      const occupiedSlots = (occupiedByDate[date] || []).filter((item) =>
        timeSlots.includes(item.horario),
      ).length;
      const blockedSlots = [...blockedInfo.times].filter((time) => timeSlots.includes(time)).length;
      const unavailableSlots = blockedInfo.fullDay
        ? timeSlots.length
        : new Set([
            ...(occupiedByDate[date] || []).map((item) => item.horario),
            ...blockedInfo.times,
          ].filter((time) => timeSlots.includes(time))).size;
      const remainingSlots = Math.max(0, timeSlots.length - unavailableSlots);
      let status = 'available';

      if (blockedInfo.fullDay) {
        status = 'blocked';
      } else if (remainingSlots === 0) {
        status = 'full';
      } else if (occupiedSlots > 0 || blockedSlots > 0) {
        status = 'partial';
      }

      return {
        date,
        status,
        occupiedSlots,
        remainingSlots,
        blockedSlots: blockedInfo.fullDay ? timeSlots.length : blockedSlots,
        blockedAllDay: blockedInfo.fullDay,
        isToday: index === 0,
      };
    });

    const visibleDates = dates.filter((item) => item.status !== 'full' && item.status !== 'blocked');
    const visibleDateValues = new Set(visibleDates.map((item) => item.date));
    const slotsByDate = Object.fromEntries(
      availableDates.map((date) => {
        const timeSlots = getAvailableTimeSlotsForDate(date);
        const blockedInfo = blockedByDate[date] || {
          fullDay: false,
          times: new Set(),
        };
        const occupiedTimes = new Set(
          (occupiedByDate[date] || []).map((item) => item.horario),
        );

        return [
          date,
          timeSlots.map((time) => ({
            time,
            available:
              !blockedInfo.fullDay &&
              !blockedInfo.times.has(time) &&
              !occupiedTimes.has(time),
            status: blockedInfo.fullDay || blockedInfo.times.has(time)
              ? 'blocked'
              : occupiedTimes.has(time)
                ? 'booked'
                : 'available',
          })),
        ];
      }).filter(([date]) => visibleDateValues.has(date)),
    );

    return sendJson(response, 200, {
      dates: visibleDates,
      slotsByDate,
      degraded,
    });
  } catch (error) {
    console.error('Failed to load availability:', error);
    const availableDates = buildAvailableDates();
    const fallbackDates = availableDates
      .map((date, index) => {
        const timeSlots = getAvailableTimeSlotsForDate(date);

        return {
          date,
          status: timeSlots.length > 0 ? 'available' : 'full',
          occupiedSlots: 0,
          remainingSlots: timeSlots.length,
          blockedSlots: 0,
          blockedAllDay: false,
          isToday: index === 0,
        };
      })
      .filter((item) => item.status !== 'full');
    const fallbackDateValues = new Set(fallbackDates.map((item) => item.date));

    return sendJson(response, 200, {
      dates: fallbackDates,
      slotsByDate: Object.fromEntries(
        availableDates.filter((date) => fallbackDateValues.has(date)).map((date) => [
          date,
          getAvailableTimeSlotsForDate(date).map((time) => ({
            time,
            available: true,
            status: 'available',
          })),
        ]),
      ),
      degraded: true,
    });
  }
}
