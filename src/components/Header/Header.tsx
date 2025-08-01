import { motion } from "framer-motion";
import { fade } from "../../utils/motionVariants";
import TextLogo from "../../assets/Logo/TextLogo.jpeg";
import { Bell, User, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import { type User as UserType } from "../../types/User";
import { fetchUserById } from "../../services/userService";

const Header = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (user && !loading) {
        const fetchedUser = await fetchUserById(user.uid);
        setCurrentUser(fetchedUser);
      }
    };
    loadUser();
  }, [user, loading]);
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
              className="size-12 rounded-full"
              src={currentUser?.avatarUrl ?? undefined}
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
