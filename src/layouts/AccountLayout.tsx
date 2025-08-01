import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { logout } from "../services/authService";
import {
  fadeUp,
  hoverGrow,
  tapShrink,
  staggerContainer,
  staggerItem,
} from "../utils/motionVariants";
import TextLogo from "../assets/Logo/TextLogo.jpeg";


const AccountLayout = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col md:flex-row gap-4 min-h-screen bg-[#FDFAF6] dark:bg-[#212121] p-4 sm:p-6">
      {/* Sidebar */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="w-full md:w-64 bg-white dark:bg-[#2A2A2A] text-[#212121] dark:text-[#FBF6E9] p-4 rounded-lg shadow-md border border-[#CFFFE2]/20"
      >
        <img
          src={TextLogo}
          className="w-65 h-15 cursor-pointer"
          onClick={() => navigate("/")}
        />
        <motion.h2
          variants={fadeUp}
          className="text-xl pt-4 sm:text-2xl font-bold mb-4 text-[#212121] dark:text-[#FBF6E9]"
        >
          Quản lý tài khoản
        </motion.h2>
        <motion.nav variants={staggerContainer} initial="hidden" animate="show">
          <motion.div variants={staggerItem}>
            <NavLink
              to="/account"
              className={({ isActive }) =>
                `block py-2 px-4 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#096B68] text-[#FBF6E9]"
                    : "hover:bg-[#CFFFE2]/30 text-[#212121] dark:text-[#FBF6E9]"
                }`
              }
            >
              <motion.span {...hoverGrow} {...tapShrink}>
                Tài khoản
              </motion.span>
            </NavLink>
          </motion.div>
          <motion.div variants={staggerItem}>
            <NavLink
              to="/change-password"
              className={({ isActive }) =>
                `block py-2 px-4 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#096B68] text-[#FBF6E9]"
                    : "hover:bg-[#CFFFE2]/30 text-[#212121] dark:text-[#FBF6E9]"
                }`
              }
            >
              <motion.span {...hoverGrow} {...tapShrink}>
                Đổi mật khẩu
              </motion.span>
            </NavLink>
          </motion.div>
          <motion.div variants={staggerItem}>
            <motion.button
              {...hoverGrow}
              {...tapShrink}
              className="block relative bottom-0 w-full text-left py-2 px-4 rounded-lg hover:bg-[#CFFFE2]/30 text-[#212121] dark:text-[#FBF6E9] transition-colors cursor-pointer"
              onClick={logout}
            >
              Đăng xuất
            </motion.button>
          </motion.div>
        </motion.nav>
      </motion.div>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AccountLayout;
