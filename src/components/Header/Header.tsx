import { motion } from "framer-motion";
import { fade } from "../../utils/motionVariants";
import TextLogo from "../../assets/Logo/TextLogo.jpeg";
import { Bell, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const user = null;
  const navigate = useNavigate();
  return (
    <motion.div
      {...fade}
      className="bg-white flex justify-between items-center px-10"
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
        <div className="cursor-pointer">{user ? "Avatar" : <User />}</div>
      </div>
    </motion.div>
  );
};

export default Header;
