import { createContext } from "react";
export const AuthContext = createContext({
    user: {},
    setUser: () => {},
    socket: {},
    socketOn: false,
    setAuthentication: () => {},
    logout: () => {}
})