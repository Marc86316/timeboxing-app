export const generateId = () => `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const addMinutes = (timeStr, addMins) => {
  if (!timeStr) return null;
  let [h, m] = timeStr.split(':').map(Number);
  m += addMins;
  h += Math.floor(m / 60);
  m = m % 60;
  if (h > 23) { h = 23; m = 45; }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const formatMonthYear = (date) => {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

export const getWeekDays = (weekOffset = 0) => {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (weekOffset * 7));

  const day = targetDate.getDay() || 7; 
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() - day + 1);

  const days = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    days.push({
      id: date.toDateString(),
      date: date,
      dayName: dayNames[i],
      dayNum: date.getDate(),
      isToday: date.toDateString() === today.toDateString()
    });
  }
  return days;
};
