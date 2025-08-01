import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { validateEmail, validatePassword } from "../utils/validation";
import { loginWithEmail, loginWithGoogle } from "../services/authService";
import { fadeUp, hoverGrow, tapShrink, staggerContainer, staggerItem, scaleIn } from "../utils/motionVariants";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!emailValidation.isValid) {
      setError(emailValidation.error);
      return;
    }
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error);
      return;
    }

    try {
      await loginWithEmail(email, password);
      navigate("/");
    } catch (err) {
      setError("Đăng nhập thất bại. Vui lòng kiểm tra email hoặc mật khẩu.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      setError("Đăng nhập bằng Google thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFAF6] dark:bg-[#212121] p-4 sm:p-6 relative overflow-hidden">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-[#2A2A2A] p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md border border-[#CFFFE2]/20 mr-0 md:mr-[50px]"
      >
        <motion.h2
          variants={fadeUp}
          className="text-2xl sm:text-3xl font-bold text-center mb-6 text-[#212121] dark:text-[#FBF6E9]"
        >
          Đăng nhập
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
          onSubmit={handleEmailLogin}
        >
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
            Đăng nhập
          </motion.button>
        </motion.form>
        <motion.button
          {...hoverGrow}
          {...tapShrink}
          onClick={handleGoogleLogin}
          className="w-full mt-4 bg-[#096B68] text-[#FBF6E9] p-3 rounded-lg hover:bg-[#328E6E] transition-colors"
        >
          Đăng nhập bằng Google
        </motion.button>
        <motion.p
          variants={staggerItem}
          className="mt-4 text-center text-[#212121] dark:text-[#FBF6E9]"
        >
          Chưa có tài khoản?{" "}
          <a href="/register" className="text-[#096B68] hover:text-[#328E6E] hover:underline">
            Đăng ký
          </a>
        </motion.p>
      </motion.div>
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        className="absolute bottom-0 left-0 w-[200%] h-[200%] bg-gradient-to-r from-[#096B68] to-[#328E6E] rounded-full -translate-x-1/4 translate-y-1/4"
        style={{ clipPath: "path('M 0 0 A 100 100 0 0 1 86.6 50 L 100 100 L 0 100 Z')" }}
      />
    </div>
  );
};

export default Login;