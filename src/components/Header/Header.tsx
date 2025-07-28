import { motion } from "framer-motion";
import { fade } from "../../utils/motionVariants";
import TextLogo from "../../assets/Logo/TextLogo.jpeg";
import { Bell, User, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <motion.div
      {...fade}
      className="bg-white flex justify-between items-center pr-10 py-5"
    >
      <img
        src={TextLogo}
        className="w-65 h-15 cursor-pointer"
        onClick={() => navigate("/")}
      />
      <div className="flex items-center space-x-4">
        <div className="cursor-pointer">
          <Bell />
        </div>
        <NavLink to="/account" className="cursor-pointer">
          {user ? (
            <img
              className="size-10 rounded-3xl"
              src={user.photoURL ?? undefined}
            ></img>
          ) : (
            <User />
          )}
        </NavLink>
        <div className="cursor-pointer" onClick={logout}>
          {user ? <LogOut /> : <span></span>}
        </div>
      </div>
    </motion.div>
  );
};

export default Header;
