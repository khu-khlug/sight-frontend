import dayjs from "dayjs";

export const DateFormats = {
  DATE: "YYYY-MM-DD",
  DATE_KOR: "YYYY년 MM월 DD일",
  TIME: "HH:mm:ss",
  DATETIME: "YYYY-MM-DD HH:mm:ss",
};

export function formatDate(date: Date, format = DateFormats.DATETIME) {
  return dayjs(date).format(format);
}

export function calcDateInterval(target: Date, ref = new Date()) {
  const diffDay = dayjs(target).diff(dayjs(ref), "day");

  if (diffDay === 0) {
    return "오늘";
  } else if (diffDay > 0) {
    switch (diffDay) {
      case 1:
        return "내일";
      case 2:
        return "모레";
      case 3:
        return "글피";
      default:
        return `${diffDay}일 후`;
    }
  } else {
    switch (diffDay) {
      case -1:
        return "어제";
      case -2:
        return "그제";
      case -3:
        return "그끄제";
      default:
        return `${-diffDay}일 전`;
    }
  }
}
