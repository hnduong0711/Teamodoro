import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { validateEmail, validatePassword, validateDisplayName } from "../utils/validation";
import { registerWithEmail, loginWithGoogle } from "../services/authService";
import { fadeUp, hoverGrow, tapShrink, staggerContainer, staggerItem, scaleIn } from "../utils/motionVariants";

const Register: React.FC = () => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const displayNameValidation = validateDisplayName(displayName);

    if (!emailValidation.isValid) {
      setError(emailValidation.error);
      return;
    }
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error);
      return;
    }
    if (!displayNameValidation.isValid) {
      setError(displayNameValidation.error);
      return;
    }

    try {
      await registerWithEmail(displayName, email, password);
      navigate("/");
    } catch (err) {
      setError("Đăng ký thất bại. Vui lòng kiểm tra thông tin.");
    }
  };

  const handleGoogleRegister = async () => {
    try {
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      setError("Đăng ký bằng Google thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFAF6] dark:bg-[#212121] p-4 sm:p-6 relative overflow-hidden">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-[#2A2A2A] p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md ml-0 md:ml-[50px]"
      >
        <motion.h2
          variants={fadeUp}
          className="text-2xl sm:text-3xl font-bold text-center mb-6 text-[#212121] dark:text-[#FBF6E9]"
        >
          Đăng ký
        </motion.h2>
        {error && (
          <motion.p variants={fadeUp} className="text-red-500 text-center mb-4">
            {error}
          </motion.p>
        )}
        <motion.form
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          onSubmit={handleRegister}
        >
          <motion.div variants={staggerItem} className="mb-4">
            <label
              className="block text-[#212121] dark:text-[#FBF6E9] mb-2"
              htmlFor="displayName"
            >
              Tên hiển thị
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
              placeholder="Nhập tên hiển thị"
            />
          </motion.div>
          <motion.div variants={staggerItem} className="mb-4">
            <label
              className="block text-[#212121] dark:text-[#FBF6E9] mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
              placeholder="Nhập email"
            />
          </motion.div>
          <motion.div variants={staggerItem} className="mb-6">
            <label
              className="block text-[#212121] dark:text-[#FBF6E9] mb-2"
              htmlFor="password"
            >
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
              placeholder="Nhập mật khẩu"
            />
          </motion.div>
          <motion.button
            {...hoverGrow}
            {...tapShrink}
            type="submit"
            className="w-full bg-[#096B68] text-[#FBF6E9] p-3 rounded-lg hover:bg-[#328E6E] transition-colors"
          >
            Đăng ký
          </motion.button>
        </motion.form>
        <motion.button
          {...hoverGrow}
          {...tapShrink}
          onClick={handleGoogleRegister}
          className="w-full mt-4 bg-[#096B68] text-[#FBF6E9] p-3 rounded-lg hover:bg-[#328E6E] transition-colors"
        >
          Đăng ký bằng Google
        </motion.button>
        <motion.p
          variants={staggerItem}
          className="mt-4 text-center text-[#212121] dark:text-[#FBF6E9]"
        >
          Đã có tài khoản?{" "}
          <a href="/login" className="text-[#096B68] hover:text-[#328E6E] hover:underline">
            Đăng nhập
          </a>
        </motion.p>
      </motion.div>
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        className="absolute bottom-0 right-0 w-[200%] h-[200%] bg-gradient-to-r from-[#096B68] to-[#328E6E] rounded-full translate-x-1/4 translate-y-1/4"
        style={{ clipPath: "path('M 100 100 A 100 100 0 0 1 86.6 50 L 0 100 L 100 100 Z')" }}
      />
    </div>
  );
};

export default Register;