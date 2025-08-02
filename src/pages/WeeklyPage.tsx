import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useWeeklyTaskStore } from "../store/weeklyTaskStore";
import { fetchTasksByBoard } from "../services/weeklyTaskService";
import { type Task } from "../types/Task";
import { CheckCircle, Circle } from "lucide-react";
import { useTeamStore } from "../store/teamStore";
import { fadeUp, hoverGrow, tapShrink, staggerContainer, staggerItem } from "../utils/motionVariants";

const WeeklyView: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { tasks } = useWeeklyTaskStore();
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [filteredWeekStart, setFilteredWeekStart] = useState<Date | null>(null);
  const teamId = useTeamStore((s) => s.currentTeam?.id);

  useEffect(() => {
    if (boardId && teamId) {
      fetchTasksByBoard(boardId, teamId);
    }
  }, [boardId, teamId]);

  const getWeekDays = (start: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(new Date(day));
    }
    return days;
  };

  const generateWeeks = () => {
    const weeks = [];
    const today = new Date();
    for (let i = -4; i <= 4; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + i * 7);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weeks.push({ start: weekStart, end: weekEnd });
    }
    return weeks;
  };

  const weekDays = getWeekDays(filteredWeekStart || currentWeekStart);
  const weeks = generateWeeks();
  const prevWeek = () =>
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  const nextWeek = () =>
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });

  const getTaskPosition = (task: Task) => {
    const weekStart = new Date(filteredWeekStart || currentWeekStart);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    let start = task.startDate?.toDate() || task.dueDate?.toDate();
    let due = task.dueDate?.toDate() || task.startDate?.toDate();

    if (!start || !due) return null;

    start.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    if (start > weekEnd || due < weekStart) return null;

    const clampedStart = new Date(
      Math.max(start.getTime(), weekStart.getTime())
    );
    const clampedDue = new Date(Math.min(due.getTime(), weekEnd.getTime()));

    const startDay = Math.floor(
      (clampedStart.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    const endDay = Math.floor(
      (clampedDue.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)
    );

    return { startDay, endDay };
  };

  return (
    <div className="p-4 sm:p-6 bg-[#FDFAF6] dark:bg-[#212121] min-h-screen">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="flex justify-between items-center mb-6"
      >
        <motion.button
          {...hoverGrow}
          {...tapShrink}
          onClick={prevWeek}
          className="px-4 py-2 bg-[#096B68] text-[#FBF6E9] rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
        >
          Tuần trước
        </motion.button>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#212121] dark:text-[#FBF6E9]">
          Tuần bắt đầu {(filteredWeekStart || currentWeekStart).toLocaleDateString('vi-VN')}
        </h2>
        <motion.button
          {...hoverGrow}
          {...tapShrink}
          onClick={nextWeek}
          className="px-4 py-2 bg-[#096B68] text-[#FBF6E9] rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
        >
          Tuần sau
        </motion.button>
      </motion.div>
      {/* Filter */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="mb-6"
      >
        <select
          onChange={(e) => {
            const selectedWeek = weeks.find(
              (w) =>
                w.start.toDateString() ===
                new Date(e.target.value).toDateString()
            );
            setFilteredWeekStart(selectedWeek ? selectedWeek.start : null);
          }}
          className="p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E] w-full sm:w-auto"
        >
          <option value="">Chọn tuần</option>
          {weeks.map((week, index) => (
            <option key={index} value={week.start.toISOString()}>
              {`${week.start.toLocaleDateString('vi-VN')} - ${week.end.toLocaleDateString('vi-VN')}`}
            </option>
          ))}
        </select>
      </motion.div>
      {/* Mobile View: Tasks by Day */}
      <div className="sm:hidden">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4"
        >
          {weekDays.map((day, index) => {
            const dayTasks = tasks.filter((task) => {
              const position = getTaskPosition(task);
              return position && position.startDay <= index && position.endDay >= index;
            });
            if (!dayTasks.length) return null;

            return (
              <motion.div
                key={index}
                variants={staggerItem}
                className="bg-white dark:bg-[#2A2A2A] p-4 rounded-lg shadow-md border border-[#CFFFE2]/20"
              >
                <h3 className="text-lg font-semibold text-[#212121] dark:text-[#FBF6E9] mb-2">
                  {day.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "numeric",
                  })}
                </h3>
                <motion.ul variants={staggerContainer} initial="hidden" animate="show">
                  {dayTasks.map((task, taskIndex) => (
                    <motion.li
                      key={task.id}
                      variants={staggerItem}
                      className="bg-[#096B68] p-2 rounded-lg text-[#FBF6E9] mb-2 flex items-center justify-between"
                    >
                      <span className="truncate">{task.title}</span>
                      {task.isDone ? (
                        <CheckCircle className="w-4 h-4 text-[#CFFFE2] ml-1" />
                      ) : (
                        <Circle className="w-4 h-4 text-red-300 ml-1" />
                      )}
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      {/* Desktop View: Weekly Grid */}
      <div className="hidden sm:block">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-7 gap-2 relative"
          style={{ minHeight: "400px" }}
        >
          {weekDays.map((day, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="bg-white dark:bg-[#2A2A2A] p-2 rounded-lg shadow-md text-center text-[#212121] dark:text-[#FBF6E9] border border-[#CFFFE2]/20"
            >
              {day.toLocaleDateString("vi-VN", {
                weekday: "short",
                day: "numeric",
              })}
            </motion.div>
          ))}
          {tasks.map((task, taskIndex) => {
            const position = getTaskPosition(task);
            if (!position) return null;
            const { startDay, endDay } = position;
            const width = ((endDay - startDay + 1) / 7) * 100;

            const overlapIndex = tasks.filter((t, i) => {
              const pos = getTaskPosition(t);
              return (
                i < taskIndex &&
                pos &&
                pos.startDay <= endDay &&
                pos.endDay >= startDay
              );
            }).length;

            return (
              <motion.div
                key={task.id}
                variants={staggerItem}
                className="absolute bg-[#096B68] p-2 rounded-lg text-xs text-[#FBF6E9] shadow-md flex items-center justify-between"
                style={{
                  left: `${(startDay / 7) * 100}%`,
                  width: `${width}%`,
                  height: "40px",
                  top: `${overlapIndex * 50 + 60}px`,
                }}
              >
                <span className="truncate">{task.title}</span>
                {task.isDone ? (
                  <CheckCircle className="w-4 h-4 text-[#CFFFE2] ml-1" />
                ) : (
                  <Circle className="w-4 h-4 text-red-300 ml-1" />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default WeeklyView;