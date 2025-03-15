import { createContext } from "react";
export const AuthContext = createContext({
    token: {},
    user: {},
    setUser: () => {},
    logout: () => {}
})

export const ConversationContext = createContext({
})