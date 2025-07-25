import { BrowserRouter, Routes, Route } from "react-router-dom";
import TeamLayout from "./layouts/TeamLayout";
import NoSidebarLayout from "./layouts/NoSidebarLayout";
import TeamPage from "./pages/TeamPage";
import BoardPage from "./pages/BoardPage";
import WeeklyView from "./pages/WeeklyPage";
import BoardLayout from "./layouts/BoardLayout";
import AccountLayout from "./layouts/AccountLayout";
import SettingsPage from "./pages/SettingsPage";
import AccountPage from "./pages/AccountPage";
import TaskPage from "./pages/TaskPage";
import FocusPage from "./pages/FocusPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<TeamLayout />}>
            <Route path="/team/:teamId" element={<TeamPage />} />
          </Route>
          <Route element={<BoardLayout />}>
            <Route path="/board/:boardId" element={<BoardPage />} />
            <Route path="/board/:boardId/weekly" element={<WeeklyView />} />
          </Route>
          <Route element={<NoSidebarLayout />}>
            <Route path="/" index element={<HomePage />} />
            <Route path="/board/:boardId/column/:columnId/task/:taskId" element={<TaskPage />} />
            <Route path="/board/:boardId/column/:columnId/task/:taskId/focus" element={<FocusPage />} />
          </Route>
          <Route element={<AccountLayout />}>
            <Route path="/account" element={<AccountPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
