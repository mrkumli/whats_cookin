import { createContext, useContext } from "react";

// AuthContext (placeholder)
//
// TODO: In a future prompt, wire this up to Firebase Authentication
// (onAuthStateChanged) so `currentUser` reflects the real logged-in
// user, and expose loading state while that check happens.

const AuthContext = createContext({
  currentUser: null,
});

export function AuthProvider({ children }) {
  const value = {
    currentUser: null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
