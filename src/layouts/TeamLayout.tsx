import { Outlet } from "react-router-dom";
import Header from "../components/Header/Header";

const TeamLayout = () => {
  
  return (
    <div>
      <header>
        <Header />
      </header>
      <div className="flex space-x-2">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeamLayout;
