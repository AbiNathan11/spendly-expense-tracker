import React, { createContext, useContext, useMemo, useReducer } from "react";
import { formatMoney } from "../utils/format";
import { authService, type AuthResponse } from "../services/authService";

export type Transaction = {
  id: string;
  envelopeId: string;
  title: string;
  amount: number;
  dateISO: string;
};

export type Envelope = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  color: string;
};

export type Bill = {
  id: string;
  title: string;
  amount: number;
  dueISO: string;
  paid: boolean;
  envelopeId?: string;
};

export type Goal = {
  id: string;
  title: string;
  target: number;
  progress: number;
};

type State = {
  isAuthed: boolean;
  user: { name: string; email: string; avatar?: string };
  envelopes: Envelope[];
  transactions: Transaction[];
  bills: Bill[];
  goals: Goal[];
  currency: string;
  dailyLimit: number;
  authLoading: boolean;
  authError: string | null;
};

type Action =
  | { type: "AUTH/LOGIN"; payload: { email: string; name?: string; token?: string } }
  | { type: "AUTH/LOGOUT" }
  | { type: "AUTH/ERROR"; payload: { error: string } }
  | { type: "AUTH/LOADING"; payload: { loading: boolean } }
  | { type: "PROFILE/UPDATE"; payload: { name: string; email: string } }
  | { type: "PROFILE/AVATAR"; payload: { uri: string } }
  | { type: "TX/ADD"; payload: { envelopeId: string; title: string; amount: number; dateISO: string } }
  | { type: "BILL/MARK_PAID"; payload: { billId: string; paid: boolean } }
  | {
    type: "BILL/ADD";
    payload: { title: string; amount: number; dueISO: string; envelopeId?: string };
  }
  | {
    type: "BILL/UPDATE";
    payload: { id: string; title: string; amount: number; dueISO: string; envelopeId?: string };
  }
  | {
    type: "ENVELOPE/ADD";
    payload: { name: string; budget: number; color: string };
  }
  | {
    type: "ENVELOPE/UPDATE";
    payload: { id: string; name: string; budget: number; color: string };
  }
  | { type: "SETTINGS/CURRENCY"; payload: { currency: string } }
  | { type: "SETTINGS/DAILY_LIMIT"; payload: { limit: number } };

const initialState: State = {
  isAuthed: false,
  currency: "USD",
  dailyLimit: 200,
  authLoading: false,
  authError: null,
  user: { name: "Alex", email: "alex@example.com", avatar: undefined },
  envelopes: [
    { id: "groceries", name: "Groceries", budget: 400, spent: 250, color: "#9ED9C4" },
    { id: "transport", name: "Transport", budget: 100, spent: 60, color: "#F6D57A" },
    { id: "entertainment", name: "Entertainment", budget: 200, spent: 230, color: "#F87171" },
    { id: "utilities", name: "Utilities", budget: 200, spent: 0, color: "#9ED9C4" },
  ],
  transactions: [
    { id: "t1", envelopeId: "groceries", title: "Groceries", amount: 60, dateISO: new Date().toISOString() },
    { id: "t2", envelopeId: "transport", title: "Bus", amount: 40, dateISO: new Date().toISOString() },
    { id: "t3", envelopeId: "entertainment", title: "Movie", amount: 20, dateISO: new Date().toISOString() },
  ],
  bills: [
    {
      id: "b1",
      title: "Netflix Subscription",
      amount: 15.99,
      dueISO: new Date().toISOString(),
      paid: false,
      envelopeId: "entertainment",
    },
    {
      id: "b2",
      title: "Spotify Premium",
      amount: 10.99,
      dueISO: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
      paid: true,
      envelopeId: "entertainment",
    },
  ],
  goals: [
    { id: "g1", title: "Emergency Fund", target: 1500, progress: 620 },
    { id: "g2", title: "Vacation", target: 900, progress: 240 },
  ],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "AUTH/LOGIN":
      console.log('AUTH/LOGIN reducer called with payload:', action.payload);
      const newState = {
        ...state,
        isAuthed: true,
        authLoading: false,
        authError: null,
        user: { ...state.user, email: action.payload.email, name: action.payload.name || state.user.name },
      };
      console.log('New user state after AUTH/LOGIN:', newState.user);
      return newState;
    case "AUTH/LOGOUT":
      return { ...state, isAuthed: false, authError: null };
    case "AUTH/ERROR":
      return { ...state, authLoading: false, authError: action.payload.error };
    case "AUTH/LOADING":
      return { ...state, authLoading: action.payload.loading, authError: null };
    case "PROFILE/UPDATE":
      return { ...state, user: { ...state.user, name: action.payload.name, email: action.payload.email } };
    case "PROFILE/AVATAR":
      return { ...state, user: { ...state.user, avatar: action.payload.uri } };
    case "TX/ADD": {
      const tx: Transaction = {
        id: `t_${Math.random().toString(16).slice(2)}`,
        envelopeId: action.payload.envelopeId,
        title: action.payload.title,
        amount: action.payload.amount,
        dateISO: action.payload.dateISO,
      };

      const envelopes = state.envelopes.map((e) =>
        e.id === action.payload.envelopeId ? { ...e, spent: e.spent + action.payload.amount } : e
      );

      return { ...state, envelopes, transactions: [tx, ...state.transactions] };
    }
    case "BILL/MARK_PAID":
      return {
        ...state,
        bills: state.bills.map((b) => (b.id === action.payload.billId ? { ...b, paid: action.payload.paid } : b)),
      };
    case "BILL/ADD": {
      const bill: Bill = {
        id: `b_${Math.random().toString(16).slice(2)}`,
        title: action.payload.title,
        amount: action.payload.amount,
        dueISO: action.payload.dueISO,
        paid: false,
        envelopeId: action.payload.envelopeId,
      };
      return {
        ...state,
        bills: [bill, ...state.bills],
      };
    }
    case "BILL/UPDATE":
      return {
        ...state,
        bills: state.bills.map((b) =>
          b.id === action.payload.id
            ? {
              ...b,
              title: action.payload.title,
              amount: action.payload.amount,
              dueISO: action.payload.dueISO,
              envelopeId: action.payload.envelopeId,
            }
            : b
        ),
      };

    case "ENVELOPE/ADD": {
      const envelope: Envelope = {
        id: `e_${Math.random().toString(16).slice(2)}`,
        name: action.payload.name,
        budget: action.payload.budget,
        spent: 0,
        color: action.payload.color,
      };
      return {
        ...state,
        envelopes: [...state.envelopes, envelope],
      };
    }
    case "ENVELOPE/UPDATE":
      return {
        ...state,
        envelopes: state.envelopes.map((e) =>
          e.id === action.payload.id
            ? { ...e, name: action.payload.name, budget: action.payload.budget, color: action.payload.color }
            : e
        ),
      };
    case "SETTINGS/CURRENCY":
      return { ...state, currency: action.payload.currency };
    case "SETTINGS/DAILY_LIMIT":
      return { ...state, dailyLimit: action.payload.limit };
    default:
      return state;
  }
}

type BudgetContextValue = {
  state: State;
  login: (email: string, password: string, name?: string) => Promise<boolean>;
  signup: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (name: string, email: string, currency?: string, dailyBudget?: number) => Promise<boolean>;
  updateAvatar: (uri: string) => void;
  addTransaction: (args: { envelopeId: string; title: string; amount: number; dateISO?: string }) => void;
  markBillPaid: (billId: string, paid: boolean) => void;
  addBill: (args: { title: string; amount: number; dueISO: string; envelopeId?: string }) => void;
  updateBill: (args: { id: string; title: string; amount: number; dueISO: string; envelopeId?: string }) => void;
  addEnvelope: (args: { name: string; budget: number; color: string }) => void;
  updateEnvelope: (args: { id: string; name: string; budget: number; color: string }) => void;
  updateCurrency: (currency: string) => void;
  updateDailyLimit: (limit: number) => void;
  formatCurrency: (amount: number) => string;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider(props: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<BudgetContextValue>(
    () => ({
      state,
      login: async (email: string, password: string, name?: string) => {
        dispatch({ type: "AUTH/LOADING", payload: { loading: true } });
        
        try {
          const loginResponse = await authService.login({ email, password });
          
          console.log('Login response:', loginResponse);
          
          if (loginResponse.success) {
            const userName = loginResponse.user?.name || name || email.split('@')[0];
            console.log('Setting user name:', userName);
            console.log('Login response user data:', loginResponse.user);
            console.log('Full login response:', JSON.stringify(loginResponse, null, 2));
            
            dispatch({ 
              type: "AUTH/LOGIN", 
              payload: { 
                email, 
                name: userName,
                token: loginResponse.session?.access_token 
              } 
            });
            return true;
          } else {
            dispatch({ type: "AUTH/ERROR", payload: { error: loginResponse.error || "Login failed" } });
            return false;
          }
        } catch (error) {
          dispatch({ type: "AUTH/ERROR", payload: { error: error instanceof Error ? error.message : "Authentication failed" } });
          return false;
        }
      },
      signup: async (email: string, password: string, name?: string) => {
        dispatch({ type: "AUTH/LOADING", payload: { loading: true } });
        
        try {
          const signupResponse = await authService.signup({ email, password, name });
          
          if (signupResponse.success) {
            // After successful signup, try login
            const loginAfterSignup = await authService.login({ email, password });
            
            if (loginAfterSignup.success) {
              dispatch({ 
                type: "AUTH/LOGIN", 
                payload: { 
                  email, 
                  name: loginAfterSignup.user?.name || name || email.split('@')[0], 
                  token: loginAfterSignup.session?.access_token 
                } 
              });
              return true;
            } else {
              dispatch({ type: "AUTH/ERROR", payload: { error: loginAfterSignup.error || "Login failed after signup" } });
              return false;
            }
          } else {
            dispatch({ type: "AUTH/ERROR", payload: { error: signupResponse.error || "Signup failed" } });
            return false;
          }
        } catch (error) {
          dispatch({ type: "AUTH/ERROR", payload: { error: error instanceof Error ? error.message : "Signup failed" } });
          return false;
        }
      },
      logout: () => dispatch({ type: "AUTH/LOGOUT" }),
      updateProfile: async (name: string, email: string, currency?: string, dailyBudget?: number) => {
        try {
          console.log('Updating profile with:', { name, email, currency, dailyBudget });
          const response = await authService.updateProfile(email, name, currency, dailyBudget);
          
          console.log('Profile update response:', response);
          
          if (response.success) {
            // Update local state with the new values
            console.log('Dispatching PROFILE/UPDATE with:', { name, email });
            dispatch({ 
              type: "PROFILE/UPDATE", 
              payload: { name, email }
            });
            
            // Update currency if provided
            if (currency) {
              console.log('Dispatching SETTINGS/CURRENCY with:', { currency });
              dispatch({ 
                type: "SETTINGS/CURRENCY", 
                payload: { currency }
              });
            }
            
            // Update daily budget if provided
            if (dailyBudget !== undefined) {
              console.log('Dispatching SETTINGS/DAILY_LIMIT with:', { limit: dailyBudget });
              dispatch({ 
                type: "SETTINGS/DAILY_LIMIT", 
                payload: { limit: dailyBudget }
              });
            }
            
            console.log('Profile update completed successfully');
            return true;
          } else {
            console.log('Profile update failed:', response.error);
            return false;
          }
        } catch (error) {
          console.log('Profile update error:', error);
          return false;
        }
      },
      updateAvatar: (uri: string) => dispatch({ type: "PROFILE/AVATAR", payload: { uri } }),
      addTransaction: (args: { envelopeId: string; title: string; amount: number; dateISO?: string }) =>
        dispatch({
          type: "TX/ADD",
          payload: {
            envelopeId: args.envelopeId,
            title: args.title,
            amount: args.amount,
            dateISO: args.dateISO ?? new Date().toISOString(),
          },
        }),
      markBillPaid: (billId: string, paid: boolean) =>
        dispatch({ type: "BILL/MARK_PAID", payload: { billId, paid } }),
      addBill: (args: { title: string; amount: number; dueISO: string; envelopeId?: string }) =>
        dispatch({ type: "BILL/ADD", payload: args }),
      updateBill: (args: { id: string; title: string; amount: number; dueISO: string; envelopeId?: string }) =>
        dispatch({ type: "BILL/UPDATE", payload: args }),
      addEnvelope: (args: { name: string; budget: number; color: string }) =>
        dispatch({ type: "ENVELOPE/ADD", payload: args }),
      updateEnvelope: (args: { id: string; name: string; budget: number; color: string }) =>
        dispatch({ type: "ENVELOPE/UPDATE", payload: args }),
      updateCurrency: (currency: string) => dispatch({ type: "SETTINGS/CURRENCY", payload: { currency } }),
      updateDailyLimit: (limit: number) => dispatch({ type: "SETTINGS/DAILY_LIMIT", payload: { limit } }),
      formatCurrency: (amount: number) => formatMoney(amount, state.currency),
    }),

    [state]
  );

  return <BudgetContext.Provider value={value}>{props.children}</BudgetContext.Provider>;
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
