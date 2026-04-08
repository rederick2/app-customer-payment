import { addDays, addWeeks, addMonths, isAfter, startOfDay, parseISO, setHours, setMinutes } from 'date-fns';

export interface ScheduleConfig {
  scheduleLater: boolean;
  anytime: boolean;
  startTime: string;
  endTime: string;
  daysOfWeek: number[]; // 0-6
  assignedTeamMembers: string[];
  visitInstructions: string;
}

export function generateVisitDates(
  startDateStr: string,
  endDateStr: string | null,
  interval: string,
  config: ScheduleConfig
): Date[] {
  if (config.scheduleLater || !startDateStr) return [];

  const start = startOfDay(parseISO(startDateStr));
  const end = endDateStr ? startOfDay(parseISO(endDateStr)) : null;
  const visits: Date[] = [];
  let currentDate = new Date(start);

  // Set time if not anytime
  const applyTime = (date: Date) => {
    if (config.anytime) return date;
    const [hours, minutes] = config.startTime.split(':').map(Number);
    return setMinutes(setHours(new Date(date), hours), minutes);
  };

  // Handle One-off — single visit on start date
  if (interval === 'one-off' || !interval) {
    visits.push(applyTime(start));
    return visits;
  }

  // Safety limit to prevent infinite loops
  const MAX_VISITS = 10000;

  // Handle Recurring
  while (visits.length < MAX_VISITS) {
    // If we have an end date and we passed it, stop
    if (end && isAfter(currentDate, end)) break;

    // Check if current date qualifies
    let shouldAdd = true;
    if (interval === 'weekly' && config.daysOfWeek.length > 0) {
      shouldAdd = config.daysOfWeek.includes(currentDate.getDay());
    }

    if (shouldAdd) {
      visits.push(applyTime(new Date(currentDate)));
    }

    // Advance to next candidate date
    if (interval === 'daily') {
      currentDate = addDays(currentDate, 1);
    } else if (interval === 'weekly') {
      // Day-by-day iteration to support multi-day weekly schedules
      currentDate = addDays(currentDate, 1);
    } else if (interval === 'biweekly') {
      currentDate = addWeeks(currentDate, 2);
    } else if (interval === 'monthly') {
      currentDate = addMonths(currentDate, 1);
    } else if (interval === 'quarterly') {
      currentDate = addMonths(currentDate, 3);
    } else {
      break; // Unknown interval
    }
  }

  return visits;
}
