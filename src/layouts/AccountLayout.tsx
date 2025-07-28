import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { logout } from "../services/authService";

const AccountLayout = () => {
  return (
    <div className="flex space-x-4">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Quản lý tài khoản</h2>
        <nav>
          <NavLink
            to={`/account`}
            className={({ isActive }) =>
              `block py-2 px-4 rounded ${
                isActive ? "bg-gray-700" : "hover:bg-gray-700"
              }`
            }
          >
            Tài khoản
          </NavLink>
          <NavLink
            to={`/change-password`}
            className={({ isActive }) =>
              `block py-2 px-4 rounded ${
                isActive ? "bg-gray-700" : "hover:bg-gray-700"
              }`
            }
          >
            Đổi mật khẩu
          </NavLink>
          <button
            className="block py-2 px-4 rounded hover:bg-gray-700"
            onClick={logout}
          >
            Đăng xuất
          </button>
        </nav>
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AccountLayout;
