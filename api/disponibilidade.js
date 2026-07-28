import { getTimeSlotsForDate } from './_lib/constants.js';
import {
  getPlanAttendances,
  listAppointments,
  listBlockedPeriods,
  listPlans,
} from './_lib/firestore.js';
import { methodNotAllowed, sendJson } from './_lib/response.js';
import { buildAvailableDates } from './_lib/validation.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return methodNotAllowed(response);
  }

  try {
    const [appointments, blockedPeriods, plans] = await Promise.all([
      listAppointments(),
      listBlockedPeriods(),
      listPlans(),
    ]);
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
      const timeSlots = getTimeSlotsForDate(date);
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

    const slotsByDate = Object.fromEntries(
      availableDates.map((date) => {
        const timeSlots = getTimeSlotsForDate(date);
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
      }),
    );

    return sendJson(response, 200, {
      dates,
      slotsByDate,
    });
  } catch (error) {
    console.error('Failed to load availability:', error);
    return sendJson(response, 500, {
      message: 'Erro ao carregar a disponibilidade.',
    });
  }
}
