// Remove the current content and replace with actual utilities we might need
export const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};