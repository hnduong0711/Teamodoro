import { NavLink, Outlet } from "react-router-dom";
import Header from "../components/Header/Header";
import { LayoutList } from 'lucide-react';
import { CalendarDays } from 'lucide-react';

const BoardLayout = () => {


  return (
    <div>
      <header>
        <Header />
      </header>
      <div className="flex space-x-4">
        <div>
          <div className="flex flex-col space-y-4">
            <NavLink to="" className={({ isActive }) => (isActive ? 'text-blue-500 font-bold' : 'text-gray-500')}>
              <LayoutList />
              <span>Bảng</span>
            </NavLink>
            <div>
              <CalendarDays />
              <span>Lịch</span>
            </div>
          </div>
        </div>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BoardLayout;
