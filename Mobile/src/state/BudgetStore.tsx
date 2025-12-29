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
import { envelopeService } from "../services/envelopeService";
import { expenseService } from "../services/expenseService";
import { scheduleBillReminder, cancelBillReminder } from "../utils/billReminder";
import { authService, type AuthResponse } from "../services/authService";
import { supabase } from "../config/supabase";

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
  | { type: "TX/SET"; payload: Transaction[] }
  | {
    type: "TX/ADD";
    payload: Transaction;
  }
  | { type: "BILL/SET"; payload: Bill[] }
  | { type: "BILL/ADD"; payload: Bill }
  | { type: "BILL/UPDATE"; payload: Bill }
  | { type: "BILL/MARK_PAID"; payload: { billId: string; paid: boolean } }
  | {
    type: "ENVELOPE/SET";
    payload: Envelope[];
  }
  | {
    type: "ENVELOPE/ADD";
    payload: Envelope;
  }
  | {
    type: "ENVELOPE/UPDATE";
    payload: Envelope;
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
  envelopes: [],
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

    case "TX/SET":
      return { ...state, transactions: action.payload };

    case "TX/ADD": {
      return { ...state, transactions: [action.payload, ...state.transactions] };
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

    case "ENVELOPE/SET":
      return { ...state, envelopes: action.payload };

    case "ENVELOPE/ADD":
      return {
        ...state,
        envelopes: [...state.envelopes, action.payload],
      };

    case "ENVELOPE/UPDATE":
      return {
        ...state,
        envelopes: state.envelopes.map((e) =>
          e.id === action.payload.id ? action.payload : e
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
  addTransaction: (args: { envelopeId: string; title: string; amount: number; dateISO?: string }) => Promise<void>;
  refreshTransactions: (envelopeId?: string) => Promise<void>;
  markBillPaid: (billId: string, paid: boolean) => Promise<void>;
  addBill: (args: { title: string; amount: number; dueISO: string; envelopeId?: string }) => Promise<void>;
  updateBill: (args: { id: string; title: string; amount: number; dueISO: string; envelopeId?: string }) => Promise<void>;
  refreshBills: () => Promise<void>;
  addEnvelope: (args: { name: string; budget: number; color: string }) => Promise<void>;
  updateEnvelope: (args: { id: string; name: string; budget: number; color: string }) => Promise<void>;
  refreshEnvelopes: () => Promise<void>;
  updateCurrency: (currency: string) => void;
  updateDailyLimit: (limit: number) => Promise<void>;
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

  /* 🔹 LOAD ENVELOPES FROM SUPABASE */
  useEffect(() => {
    const loadEnvelopes = async () => {
      const date = new Date();
      const res = await envelopeService.getEnvelopeStats(date.getMonth() + 1, date.getFullYear());
      if (res.data) {
        const mapped: Envelope[] = res.data.map((e) => ({
          id: e.id,
          name: e.name,
          budget: e.allocated_amount,
          spent: e.spent,
          color: e.icon, // We use icon field for color hex
        }));
        dispatch({ type: "ENVELOPE/SET", payload: mapped });
      }
    };
    loadEnvelopes();
  }, []);

  /* 🔹 LOAD TRANSACTIONS FROM SUPABASE */
  useEffect(() => {
    const loadTransactions = async () => {
      const res = await expenseService.getExpenses();
      if (res.data) {
        const mapped: Transaction[] = res.data.map((t) => ({
          id: t.id,
          envelopeId: t.envelope_id,
          title: t.description,
          amount: t.amount,
          dateISO: t.date,
        }));
        dispatch({ type: "TX/SET", payload: mapped });
      }
    };
    loadTransactions();
  }, []);

  const value = useMemo<BudgetContextValue>(
    () => ({
      state,
      login: async (email: string, password: string, name?: string) => {
        dispatch({ type: "AUTH/LOADING", payload: { loading: true } });

        try {
          console.log("=== Starting login process ===");
          console.log("Email:", email);

          const loginResponse = await authService.login({ email, password });
          console.log("Backend login response:", loginResponse);

          if (loginResponse.success) {
            console.log("Backend login successful, setting Supabase session");

            // Set Supabase session using the tokens from backend
            if (loginResponse.session?.access_token && loginResponse.session?.refresh_token) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: loginResponse.session.access_token,
                refresh_token: loginResponse.session.refresh_token,
              });

              if (sessionError) {
                console.error("Failed to set Supabase session:", sessionError);
                dispatch({ type: "AUTH/ERROR", payload: { error: `Session error: ${sessionError.message}` } });
                return false;
              }

              console.log("Supabase session set successfully");
            }

            const userName = loginResponse.user?.name || name || email.split('@')[0];

            dispatch({
              type: "AUTH/LOGIN",
              payload: {
                email,
                name: userName,
                token: loginResponse.session?.access_token
              }
            });

            console.log("Login process completed successfully");
            return true;
          } else {
            console.error("Backend login failed:", loginResponse.error);
            dispatch({ type: "AUTH/ERROR", payload: { error: loginResponse.error || "Login failed" } });
            return false;
          }
        } catch (error) {
          console.error("Login error:", error);
          dispatch({ type: "AUTH/ERROR", payload: { error: error instanceof Error ? error.message : "Authentication failed" } });
          return false;
        }
      },
      signup: async (email: string, password: string, name?: string) => {
        dispatch({ type: "AUTH/LOADING", payload: { loading: true } });

        try {
          console.log("=== Starting signup process ===");
          console.log("Email:", email);

          const signupResponse = await authService.signup({ email, password, name });
          console.log("Backend signup response:", signupResponse);

          if (signupResponse.success) {
            console.log("Backend signup successful, setting Supabase session");

            // Set Supabase session using the tokens from backend
            if (signupResponse.session?.access_token && signupResponse.session?.refresh_token) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: signupResponse.session.access_token,
                refresh_token: signupResponse.session.refresh_token,
              });

              if (sessionError) {
                console.error("Failed to set Supabase session:", sessionError);
                dispatch({ type: "AUTH/ERROR", payload: { error: `Session error: ${sessionError.message}` } });
                return false;
              }

              console.log("Supabase session set successfully");
            }

            // Auto-login after signup
            const loginAfterSignup = await authService.login({ email, password });
            console.log("Auto-login after signup response:", loginAfterSignup);

            if (loginAfterSignup.success) {
              // Set Supabase session for auto-login
              if (loginAfterSignup.session?.access_token && loginAfterSignup.session?.refresh_token) {
                const { error: sessionError } = await supabase.auth.setSession({
                  access_token: loginAfterSignup.session.access_token,
                  refresh_token: loginAfterSignup.session.refresh_token,
                });

                if (sessionError) {
                  console.error("Failed to set Supabase session for auto-login:", sessionError);
                  dispatch({ type: "AUTH/ERROR", payload: { error: `Session error: ${sessionError.message}` } });
                  return false;
                }

                console.log("Supabase session set for auto-login");
              }

              dispatch({
                type: "AUTH/LOGIN",
                payload: {
                  email,
                  name: loginAfterSignup.user?.name || name || email.split('@')[0],
                  token: loginAfterSignup.session?.access_token
                }
              });

              console.log("Signup and auto-login process completed successfully");
              return true;
            } else {
              console.error("Auto-login after signup failed:", loginAfterSignup.error);
              dispatch({ type: "AUTH/ERROR", payload: { error: loginAfterSignup.error || "Login failed after signup" } });
              return false;
            }
          } else {
            console.error("Backend signup failed:", signupResponse.error);
            dispatch({ type: "AUTH/ERROR", payload: { error: signupResponse.error || "Signup failed" } });
            return false;
          }
        } catch (error) {
          console.error("Signup error:", error);
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
      addTransaction: async (args: { envelopeId: string; title: string; amount: number; dateISO?: string }) => {
        try {
          const res = await expenseService.createExpense({
            envelope_id: args.envelopeId,
            description: args.title,
            amount: args.amount,
            date: args.dateISO ? args.dateISO.split('T')[0] : new Date().toISOString().split('T')[0],
          });

          if (res.success && res.data) {
            // Refresh state from DB to get updated balances and transactions
            await Promise.all([
              value.refreshEnvelopes(),
              value.refreshTransactions(),
            ]);
          } else {
            throw new Error(res.error || "Failed to save transaction");
          }
        } catch (error) {
          console.error("addTransaction error:", error);
          throw error;
        }
      },
      refreshTransactions: async (envelopeId?: string) => {
        try {
          const res = await expenseService.getExpenses(envelopeId ? { envelope_id: envelopeId } : undefined);
          if (res.data) {
            const mapped: Transaction[] = res.data.map((t) => ({
              id: t.id,
              envelopeId: t.envelope_id,
              title: t.description,
              amount: t.amount,
              dateISO: t.date,
            }));
            dispatch({ type: "TX/SET", payload: mapped });
          }
        } catch (error) {
          console.error("Failed to refresh transactions:", error);
        }
      },
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
        // Helper function to parse YYYY-MM-DD without timezone issues
        const parseLocalDate = (dateString: string) => {
          const [year, month, day] = dateString.split('-').map(Number);
          return new Date(year, month - 1, day); // month is 0-indexed
        };

        const parsedDate = parseLocalDate(args.dueISO);

        const billData = {
          name: args.title,
          amount: args.amount,
          due_date: args.dueISO,
          category: args.envelopeId ?? "general",
          month: parsedDate.getMonth() + 1,
          year: parsedDate.getFullYear(),
        };

        try {
          const res = await billService.createBill(billData);

          if (!res.data) {
            throw new Error(res.error ? String(res.error) : "Failed to create bill");
          }

          const reminderId = await scheduleBillReminder(
            res.data.id,
            res.data.name,
            res.data.amount,
            res.data.due_date
          );

          const newBill = {
            id: res.data.id,
            title: res.data.name,
            amount: res.data.amount,
            dueISO: res.data.due_date,
            paid: res.data.is_paid,
            envelopeId: res.data.category,
            reminderId,
          };

          dispatch({
            type: "BILL/ADD",
            payload: newBill,
          });
        } catch (error) {
          console.error("addBill error:", error);
          throw error;
        }
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
      refreshBills: async () => {
        try {
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
        } catch (error) {
          console.error("Failed to refresh bills:", error);
        }
      },
      refreshEnvelopes: async () => {
        try {
          const date = new Date();
          const res = await envelopeService.getEnvelopeStats(date.getMonth() + 1, date.getFullYear());
          if (res.data) {
            const mapped: Envelope[] = res.data.map((e) => ({
              id: e.id,
              name: e.name,
              budget: e.allocated_amount,
              spent: e.spent,
              color: e.icon,
            }));
            dispatch({ type: "ENVELOPE/SET", payload: mapped });
          }
        } catch (error) {
          console.error("Failed to refresh envelopes:", error);
        }
      },
      addEnvelope: async (args: { name: string; budget: number; color: string }) => {
        const date = new Date();
        try {
          const res = await envelopeService.createEnvelope({
            name: args.name,
            allocated_amount: args.budget,
            icon: args.color,
            month: date.getMonth() + 1,
            year: date.getFullYear(),
          });

          if (res.data) {
            // Fetch updated list from database to get calculated fields like 'spent'
            await value.refreshEnvelopes();
          }
        } catch (error) {
          console.error("addEnvelope error:", error);
          throw error;
        }
      },
      updateEnvelope: async (args: { id: string; name: string; budget: number; color: string }) => {
        try {
          const res = await envelopeService.updateEnvelope(args.id, {
            name: args.name,
            allocated_amount: args.budget,
            icon: args.color,
          });

          if (res.data) {
            // Fetch updated list from database to get calculated fields like 'spent'
            await value.refreshEnvelopes();
          }
        } catch (error) {
          console.error("updateEnvelope error:", error);
          throw error;
        }
      },
      updateCurrency: (currency: string) => dispatch({ type: "SETTINGS/CURRENCY", payload: { currency } }),
      updateDailyLimit: async (limit: number) => {
        try {
          // Persist to backend
          const res = await authService.updateProfile(state.user.email, state.user.name, state.currency, limit);
          if (res.success) {
            dispatch({ type: "SETTINGS/DAILY_LIMIT", payload: { limit } });
          } else {
            console.error("Failed to persist daily limit:", res.error);
            // Even if backend fails, update local state for better UX, or alert user
            dispatch({ type: "SETTINGS/DAILY_LIMIT", payload: { limit } });
          }
        } catch (error) {
          console.error("Failed to update daily limit:", error);
          dispatch({ type: "SETTINGS/DAILY_LIMIT", payload: { limit } });
        }
      },
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
