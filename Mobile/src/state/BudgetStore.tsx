import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useEffect,
} from "react";
import * as Notifications from "expo-notifications";

import { formatMoney } from "../utils/format";
import { billService } from "../services/billService";
import { scheduleBillReminder, cancelBillReminder } from "../utils/billReminder";
import { authService, type AuthResponse } from "../services/authService";

/* ===================== TYPES ===================== */

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
  reminderId?: string | null;
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

/* ===================== ACTIONS ===================== */

type Action =
  | { type: "AUTH/LOGIN"; payload: { email: string; name?: string; token?: string } }
  | { type: "AUTH/LOGOUT" }
  | { type: "AUTH/ERROR"; payload: { error: string } }
  | { type: "AUTH/LOADING"; payload: { loading: boolean } }
  | { type: "PROFILE/UPDATE"; payload: { name: string; email: string } }
  | { type: "PROFILE/AVATAR"; payload: { uri: string } }
  | {
    type: "TX/ADD";
    payload: {
      envelopeId: string;
      title: string;
      amount: number;
      dateISO: string;
    };
  }
  | { type: "BILL/SET"; payload: Bill[] }
  | { type: "BILL/ADD"; payload: Bill }
  | { type: "BILL/UPDATE"; payload: Bill }
  | { type: "BILL/MARK_PAID"; payload: { billId: string; paid: boolean } }
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

/* ===================== INITIAL STATE ===================== */

const initialState: State = {
  isAuthed: false,
  currency: "USD",
  dailyLimit: 200,
  authLoading: false,
  authError: null,
  user: { name: "Alex", email: "alex@example.com", avatar: undefined },
  envelopes: [
    { id: "groceries", name: "Groceries", budget: 400, spent: 0, color: "#9ED9C4" },
    { id: "transport", name: "Transport", budget: 100, spent: 0, color: "#F6D57A" },
    { id: "entertainment", name: "Entertainment", budget: 200, spent: 0, color: "#F87171" },
  ],
  transactions: [],
  bills: [],
  goals: [],
};

/* ===================== REDUCER ===================== */

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "AUTH/LOGIN":
      console.log('AUTH/LOGIN reducer called with payload:', action.payload);
      return {
        ...state,
        isAuthed: true,
        authLoading: false,
        authError: null,
        user: {
          ...state.user,
          email: action.payload.email,
          name: action.payload.name || state.user.name
        },
      };

    case "AUTH/LOGOUT":
      return { ...state, isAuthed: false, authError: null };
    case "AUTH/ERROR":
      return { ...state, authLoading: false, authError: action.payload.error };
    case "AUTH/LOADING":
      return { ...state, authLoading: action.payload.loading, authError: null };
    case "PROFILE/UPDATE":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case "PROFILE/AVATAR":
      return {
        ...state,
        user: { ...state.user, avatar: action.payload.uri },
      };

    case "TX/ADD": {
      const tx: Transaction = {
        id: `t_${Math.random().toString(16).slice(2)}`,
        ...action.payload,
      };

      const envelopes = state.envelopes.map((e) =>
        e.id === action.payload.envelopeId ? { ...e, spent: e.spent + action.payload.amount } : e
      );

      return { ...state, envelopes, transactions: [tx, ...state.transactions] };
    }

    case "BILL/SET":
      return { ...state, bills: action.payload };

    case "BILL/ADD":
      return { ...state, bills: [action.payload, ...state.bills] };

    case "BILL/UPDATE":
      return {
        ...state,
        bills: state.bills.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
      };

    case "BILL/MARK_PAID":
      return {
        ...state,
        bills: state.bills.map((b) =>
          b.id === action.payload.billId
            ? { ...b, paid: action.payload.paid }
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

/* ===================== CONTEXT ===================== */

type BudgetContextValue = {
  state: State;
  login: (email: string, password: string, name?: string) => Promise<boolean>;
  signup: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (name: string, email: string, currency?: string, dailyBudget?: number) => Promise<boolean>;
  updateAvatar: (uri: string) => void;
  addTransaction: (args: { envelopeId: string; title: string; amount: number; dateISO?: string }) => void;
  markBillPaid: (billId: string, paid: boolean) => Promise<void>;
  addBill: (args: { title: string; amount: number; dueISO: string; envelopeId?: string }) => Promise<void>;
  updateBill: (args: { id: string; title: string; amount: number; dueISO: string; envelopeId?: string }) => Promise<void>;
  addEnvelope: (args: { name: string; budget: number; color: string }) => void;
  updateEnvelope: (args: { id: string; name: string; budget: number; color: string }) => void;
  updateCurrency: (currency: string) => void;
  updateDailyLimit: (limit: number) => void;
  formatCurrency: (amount: number) => string;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

/* ===================== PROVIDER ===================== */

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /* 🔹 LOAD BILLS FROM SUPABASE */
  useEffect(() => {
    const loadBills = async () => {
      const res = await billService.getBills();
      if (res.data) {
        const mapped: Bill[] = res.data.map((b) => ({
          id: b.id,
          title: b.name,
          amount: b.amount,
          dueISO: b.due_date,
          paid: b.is_paid,
          envelopeId: b.category,
        }));
        dispatch({ type: "BILL/SET", payload: mapped });
      }
    };
    loadBills();
  }, []);

  const value = useMemo<BudgetContextValue>(
    () => ({
      state,
      login: async (email: string, password: string, name?: string) => {
        dispatch({ type: "AUTH/LOADING", payload: { loading: true } });

        try {
          const loginResponse = await authService.login({ email, password });

          if (loginResponse.success) {
            const userName = loginResponse.user?.name || name || email.split('@')[0];

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
          const response = await authService.updateProfile(email, name, currency, dailyBudget);

          if (response.success) {
            dispatch({
              type: "PROFILE/UPDATE",
              payload: { name, email }
            });

            if (currency) {
              dispatch({
                type: "SETTINGS/CURRENCY",
                payload: { currency }
              });
            }

            if (dailyBudget !== undefined) {
              dispatch({
                type: "SETTINGS/DAILY_LIMIT",
                payload: { limit: dailyBudget }
              });
            }
            return true;
          } else {
            return false;
          }
        } catch (error) {
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
      markBillPaid: async (billId, paid) => {
        const bill = state.bills.find((b) => b.id === billId);

        if (paid && bill?.reminderId) {
          await cancelBillReminder(bill.reminderId);
        }

        await billService.markBillPaid(billId);

        dispatch({
          type: "BILL/MARK_PAID",
          payload: { billId, paid },
        });
      },
      addBill: async (args) => {
        const res = await billService.createBill({
          name: args.title,
          amount: args.amount,
          due_date: args.dueISO,
          category: args.envelopeId ?? "general",
          month: new Date(args.dueISO).getMonth() + 1,
          year: new Date(args.dueISO).getFullYear(),
        });

        if (!res.data) return;

        const reminderId = await scheduleBillReminder(
          res.data.id,
          res.data.name,
          res.data.amount,
          res.data.due_date
        );

        dispatch({
          type: "BILL/ADD",
          payload: {
            id: res.data.id,
            title: res.data.name,
            amount: res.data.amount,
            dueISO: res.data.due_date,
            paid: res.data.is_paid,
            envelopeId: res.data.category,
            reminderId,
          },
        });
      },
      updateBill: async (args) => {
        const res = await billService.updateBill(args.id, {
          name: args.title,
          amount: args.amount,
          due_date: args.dueISO,
          category: args.envelopeId,
        });

        if (res.data) {
          dispatch({
            type: "BILL/UPDATE",
            payload: {
              id: res.data.id,
              title: res.data.name,
              amount: res.data.amount,
              dueISO: res.data.due_date,
              paid: res.data.is_paid,
              envelopeId: res.data.category,
            },
          });
        }
      },
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

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}

/* ===================== HOOK ===================== */

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
