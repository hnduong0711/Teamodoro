import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useWeeklyTaskStore } from "../store/weeklyTaskStore";
import { fetchTasksByBoard } from "../services/weeklyTaskService";
import { type Task } from "../types/Task";
import { CheckCircle, Circle } from "lucide-react";
import { useTeamStore } from "../store/teamStore";

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
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prevWeek}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Previous
        </button>
        <h2 className="text-2xl font-bold">
          Week of {(filteredWeekStart || currentWeekStart).toLocaleDateString()}
        </h2>
        <button
          onClick={nextWeek}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Next
        </button>
      </div>
      {/* filter */}
      <div className="mb-4">
        <select
          onChange={(e) => {
            const selectedWeek = weeks.find(
              (w) =>
                w.start.toDateString() ===
                new Date(e.target.value).toDateString()
            );
            setFilteredWeekStart(selectedWeek ? selectedWeek.start : null);
          }}
          className="p-2 border rounded"
        >
          <option value="">Select Week</option>
          {weeks.map((week, index) => (
            <option key={index} value={week.start.toISOString()}>
              {`${week.start.toLocaleDateString()} - ${week.end.toLocaleDateString()}`}
            </option>
          ))}
        </select>
      </div>
      <div
        className="grid grid-cols-7 gap-2 relative"
        style={{ minHeight: "400px" }}
      >
        {weekDays.map((day, index) => (
          <div key={index} className="bg-white p-2 rounded shadow text-center">
            {day.toLocaleDateString("en-US", {
              weekday: "short",
              day: "numeric",
            })}
          </div>
        ))}
        {tasks.map((task, taskIndex) => {
          const position = getTaskPosition(task);
          if (!position) return null;
          const { startDay, endDay } = position;
          const width = ((endDay - startDay + 1) / 7) * 100;

          // tính số thứ tự chồng cho ngày bắt đầu
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
            <div
              key={task.id}
              className="absolute bg-blue-500 p-1 rounded text-xs text-white shadow-md"
              style={{
                left: `${(startDay / 7) * 100}%`,
                width: `${width}%`,
                height: "40px",
                top: `${overlapIndex * 50 + 60}px`,
              }}
            >
              <div className="flex justify-between items-center w-full">
                <span className="truncate">{task.title}</span>
                {task.isDone ? (
                  <CheckCircle className="w-4 h-4 text-green-300 ml-1" />
                ) : (
                  <Circle className="w-4 h-4 text-red-300 ml-1" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyView;
