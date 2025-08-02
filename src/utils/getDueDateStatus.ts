import { Timestamp } from "firebase/firestore";

export const getDueDateStatus = (dueDate: Timestamp) => {
  const now = new Date();
  const due = dueDate.toDate();

  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffTime < 0) {
    return {
      isOverdue: true,
      message: "Task đã quá hạn",
    };
  }

  if (diffDays <= 1) {
    return {
      isOverdue: false,
      message: `Hết hạn vào lúc ${due.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })} ngày ${due.toLocaleDateString("vi-VN")}`,
    };
  }

  return {
    isOverdue: false,
    message: `Còn ${diffDays} ngày`,
  };
};
