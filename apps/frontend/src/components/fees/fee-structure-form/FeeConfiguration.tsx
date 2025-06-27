import dayjs from 'dayjs';

export const today = new Date().toISOString().split('T')[0]; 

export const disablePastDates = (current: dayjs.Dayjs | null) => current && current < dayjs().startOf('day'); 