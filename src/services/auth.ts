export const auth = {
  async isAuthenticated() {
    const token = localStorage.getItem("token");
    return !!token;
  },
  getToken() {
    return localStorage.getItem("token");
  },
  getRole() {
    return localStorage.getItem("role") as "ADMIN" | "MASTER" | "USER" | null;
  },
  signIn(token: string, role?: "ADMIN" | "MASTER" | "USER") {
    localStorage.setItem("token", token);

    if (role) {
      localStorage.setItem("role", role);
    } else {
      localStorage.removeItem("role");
    }
  },

  signOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  },
};
