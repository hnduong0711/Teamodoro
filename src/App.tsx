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

const App = () => {

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<TeamLayout />}>
          <Route path="/team/:teamId" element={<TeamPage />} />
        </Route>
        <Route element={<BoardLayout />}>
          <Route path="/board/:boardId" element={<BoardPage />} />
          <Route path="/board/:boardId/weekly" element={<WeeklyView />} />
        </Route>
        <Route element={<NoSidebarLayout />}>

          <Route path="/" index element={<HomePage />} />
          <Route path="task/:taskId" element={<TaskPage />} />
          <Route
            path="/task/:taskId/focus"
            element={<FocusPage />}
          />
        </Route>
        <Route element={<AccountLayout />}>
          <Route path="/account" element={<AccountPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
