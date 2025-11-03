/**
 * Date Helper Utilities
 * Handles IST (Asia/Kolkata) timezone operations
 */

const getISTDate = () => {
  const now = new Date();
  // Convert to IST by adding 5 hours 30 minutes (UTC+05:30) to UTC
  const istTime = new Date(now.getTime() + (5 * 60 * 60 * 1000) + (30 * 60 * 1000));
  return istTime;
};

const getISTDateString = () => {
  const istDate = getISTDate();
  return istDate.toISOString().split('T')[0];
};

const getISTWeekStart = () => {
  const istDate = getISTDate();
  const weekStart = new Date(istDate);
  weekStart.setDate(istDate.getDate() - istDate.getDay());
  return weekStart.toISOString().split('T')[0];
};

const getISTMonthStart = () => {
  const istDate = getISTDate();
  const monthStart = new Date(istDate.getFullYear(), istDate.getMonth(), 1);
  return monthStart.toISOString().split('T')[0];
};

const getISTYearStart = () => {
  const istDate = getISTDate();
  const yearStart = new Date(istDate.getFullYear(), 0, 1);
  return yearStart.toISOString().split('T')[0];
};

const calculateNights = (checkIn, checkOut) => {
  const diffTime = Math.abs(new Date(checkOut) - new Date(checkIn));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = {
  getISTDate,
  getISTDateString,
  getISTWeekStart,
  getISTMonthStart,
  getISTYearStart,
  calculateNights
};
