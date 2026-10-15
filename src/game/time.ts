export type TimePeriod = "sunrise" | "noon" | "afternoon" | "sunset" | "night";

export interface TimeOfDayInfo {
  hour: number;
  minute: number;
  period: TimePeriod;
  label: string;
  icon: string;
}

export function getTimeOfDayInfo(timestamp: number): TimeOfDayInfo {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const minute = date.getMinutes();
  let period: TimePeriod;

  if (hour >= 5 && hour < 10) period = "sunrise";
  else if (hour >= 10 && hour < 14) period = "noon";
  else if (hour >= 14 && hour < 18) period = "afternoon";
  else if (hour >= 18 && hour < 21) period = "sunset";
  else period = "night";

  const labels: Record<TimePeriod, string> = {
    sunrise: "日出",
    noon: "中午",
    afternoon: "下午",
    sunset: "日落",
    night: "晚上",
  };
  const icons: Record<TimePeriod, string> = {
    sunrise: "🌅",
    noon: "☀️",
    afternoon: "🌤️",
    sunset: "🌇",
    night: "🌙",
  };

  return {
    hour,
    minute,
    period,
    label: labels[period],
    icon: icons[period],
  };
}

export function formatGameTime(timestamp: number): string {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(timestamp);
}
