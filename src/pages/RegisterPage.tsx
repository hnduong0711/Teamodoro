import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { validateEmail, validatePassword, validateDisplayName } from '../utils/validation';
import { slideFromRight } from '../utils/motionVariants';
import { registerWithEmail, loginWithGoogle } from '../services/authService';

const Register: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
      navigate('/');
    } catch (err) {
      setError('Đăng ký thất bại. Vui lòng kiểm tra thông tin.');
    }
  };

  const handleGoogleRegister = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError('Đăng ký bằng Google thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <motion.div
        {...slideFromRight}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Đăng ký</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-200 mb-2" htmlFor="displayName">
              Tên hiển thị
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Nhập tên hiển thị"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-200 mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Nhập email"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-200 mb-2" htmlFor="password">
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Nhập mật khẩu"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
          >
            Đăng ký
          </button>
        </form>
        <button
          onClick={handleGoogleRegister}
          className="w-full mt-4 bg-red-600 text-white p-3 rounded-lg hover:bg-red-700"
        >
          Đăng ký bằng Google
        </button>
        <p className="mt-4 text-center text-gray-600 dark:text-gray-300">
          Đã có tài khoản?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Đăng nhập
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;