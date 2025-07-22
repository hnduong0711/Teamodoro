import { Outlet } from "react-router-dom";
import Header from "../components/Header/Header";

const TeamLayout = () => {
  return (
    <div className="w-full">
      <header>
        <Header />
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default TeamLayout;
