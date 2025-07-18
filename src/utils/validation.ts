export interface ValidationResult {
  isValid: boolean;
  error: string;
}

export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return { isValid: false, error: "Email không được để trống" };
  }
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Email không hợp lệ" };
  }
  return { isValid: true, error: "" };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: "Mật khẩu không được để trống" };
  }
  if (password.length < 6) {
    return { isValid: false, error: "Mật khẩu phải có ít nhất 6 ký tự" };
  }
  return { isValid: true, error: "" };
};

export const validateDisplayName = (displayName: string): ValidationResult => {
  if (!displayName) {
    return { isValid: false, error: "Tên hiển thị không được để trống" };
  }
  if (displayName.length < 2) {
    return { isValid: false, error: "Tên hiển thị phải có ít nhất 2 ký tự" };
  }
  return { isValid: true, error: "" };
};