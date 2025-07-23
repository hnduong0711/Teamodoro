import { Outlet } from "react-router-dom";
import Header from "../components/Header/Header";

const BoardLayout = () => {
  return (
    <div>
      <header>
        <Header />
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default BoardLayout;
