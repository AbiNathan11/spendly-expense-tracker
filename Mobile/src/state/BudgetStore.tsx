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
  paidDateISO?: string | null;
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
  lastLimitUpdateDateISO?: string | null;
};

/* ===================== ACTIONS ===================== */

type Action =
  | { type: "AUTH/LOGIN"; payload: { email: string; name?: string; token?: string; lastLimitUpdateDateISO?: string | null; currency?: string; dailyLimit?: number; avatar?: string | null } }
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
  | { type: "TX/DELETE"; payload: string }
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
  | { type: "ENVELOPE/DELETE"; payload: string }
  | { type: "SETTINGS/CURRENCY"; payload: { currency: string } }
  | { type: "SETTINGS/DAILY_LIMIT"; payload: { limit: number; dateISO: string } };

/* ===================== INITIAL STATE ===================== */

const initialState: State = {
  isAuthed: false,
  currency: "LKR",
  dailyLimit: 200,
  authLoading: false,
  authError: null,
  user: { name: "Alex", email: "alex@example.com", avatar: undefined },
  envelopes: [],
  transactions: [],
  bills: [],
  goals: [],
  lastLimitUpdateDateISO: undefined,
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
          name: action.payload.name || state.user.name,
          avatar: action.payload.avatar || state.user.avatar
        },
        lastLimitUpdateDateISO: action.payload.lastLimitUpdateDateISO,
        currency: action.payload.currency || state.currency,
        dailyLimit: action.payload.dailyLimit || state.dailyLimit,
      };

    case "AUTH/LOGOUT":
      return {
        ...initialState,
        isAuthed: false,
        authError: null
      };
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

    case "TX/DELETE":
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };

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

    case "ENVELOPE/DELETE":
      return {
        ...state,
        envelopes: state.envelopes.filter((e) => e.id !== action.payload),
      };

    case "SETTINGS/CURRENCY":
      return { ...state, currency: action.payload.currency };

    case "SETTINGS/DAILY_LIMIT":
      return {
        ...state,
        dailyLimit: action.payload.limit,
        lastLimitUpdateDateISO: action.payload.dateISO
      };

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
  deleteTransaction: (id: string) => Promise<boolean>;
  refreshTransactions: (envelopeId?: string) => Promise<void>;
  markBillPaid: (billId: string, paid: boolean) => Promise<void>;
  addBill: (args: { title: string; amount: number; dueISO: string; envelopeId?: string }) => Promise<void>;
  updateBill: (args: { id: string; title: string; amount: number; dueISO: string; envelopeId?: string }) => Promise<void>;
  refreshBills: () => Promise<void>;
  addEnvelope: (args: { name: string; budget: number; color: string }) => Promise<void>;
  updateEnvelope: (args: { id: string; name: string; budget: number; color: string }) => Promise<void>;
  deleteEnvelope: (id: string) => Promise<boolean>;
  refreshEnvelopes: () => Promise<void>;
  updateCurrency: (currency: string) => void;
  updateDailyLimit: (limit: number) => Promise<void>;
  formatCurrency: (amount: number) => string;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

/* ===================== PROVIDER ===================== */

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /* 🔹 RESTORE SESSION ON APP START */
  useEffect(() => {
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log("Restored persistent session for:", session.user.email);

        // Populate basic info from session
        dispatch({
          type: "AUTH/LOGIN",
          payload: {
            email: session.user.email!,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          }
        });

        // Backend will re-sync more details (currency etc) on next data load or settings fetch
      }
    };

    restoreSession();

    // Listen for auth state changes (helps with cross-tab/module sync)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        dispatch({ type: "AUTH/LOGOUT" });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user && !state.isAuthed) {
          dispatch({
            type: "AUTH/LOGIN",
            payload: {
              email: session.user.email!,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            }
          });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
          paidDateISO: b.paid_date,
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
            console.log("Backend login successful");

            // Set Supabase session using the tokens from backend (ONLY ONCE)
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
            } else {
              console.warn("No session tokens received from backend");
            }

            const userName = loginResponse.user?.name || name || email.split('@')[0];

            dispatch({
              type: "AUTH/LOGIN",
              payload: {
                email,
                name: userName,
                token: loginResponse.session?.access_token,
                lastLimitUpdateDateISO: loginResponse.settings?.limit_updated_at,
                currency: loginResponse.settings?.currency,
                dailyLimit: loginResponse.settings?.daily_budget,
                avatar: loginResponse.settings?.avatar_url,
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
            console.log("Backend signup successful, performing auto-login");

            // Auto-login after signup (this will set the session)
            const loginAfterSignup = await authService.login({ email, password });
            console.log("Auto-login after signup response:", loginAfterSignup);

            if (loginAfterSignup.success) {
              // Set Supabase session for auto-login (ONLY ONCE)
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
              } else {
                console.warn("No session tokens received from auto-login");
              }

              dispatch({
                type: "AUTH/LOGIN",
                payload: {
                  email,
                  name: loginAfterSignup.user?.name || name || email.split('@')[0],
                  token: loginAfterSignup.session?.access_token,
                  lastLimitUpdateDateISO: loginAfterSignup.settings?.limit_updated_at,
                  currency: loginAfterSignup.settings?.currency,
                  dailyLimit: loginAfterSignup.settings?.daily_budget,
                  avatar: loginAfterSignup.settings?.avatar_url,
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
        // 1. Dispatch optimistic updates immediately
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
          const todayStr = new Date().toISOString().split("T")[0];
          dispatch({
            type: "SETTINGS/DAILY_LIMIT",
            payload: { limit: dailyBudget, dateISO: todayStr }
          });
        }

        try {
          const response = await authService.updateProfile(email, name, currency, dailyBudget);
          return response.success;
        } catch (error) {
          console.error("updateProfile error:", error);
          // Refresh from server or handle error if needed, but for "speed" we keep the optimistic state
          return false;
        }
      },
      updateAvatar: async (uri: string) => {
        try {
          // Update locally first for snappiness
          dispatch({ type: "PROFILE/AVATAR", payload: { uri } });

          // Persist to backend
          const res = await authService.updateProfile(state.user.email, state.user.name, state.currency, state.dailyLimit, uri);
          if (!res.success) {
            console.error("Failed to persist avatar:", res.error);
          }
        } catch (error) {
          console.error("updateAvatar error:", error);
        }
      },
      addTransaction: async (args: { envelopeId: string; title: string; amount: number; dateISO?: string }) => {
        const tempId = `temp-${Date.now()}`;
        const dateStr = args.dateISO ? args.dateISO : new Date().toISOString();

        // 1. Create a "fake" optimistic transaction
        const optimTx: Transaction = {
          id: tempId,
          envelopeId: args.envelopeId,
          title: args.title,
          amount: args.amount,
          dateISO: dateStr,
        };

        // 2. Dispatch the transaction immediately
        dispatch({ type: "TX/ADD", payload: optimTx });

        // 3. Update the envelope balance optimistically
        const env = state.envelopes.find(e => e.id === args.envelopeId);
        if (env) {
          dispatch({
            type: "ENVELOPE/UPDATE",
            payload: { ...env, spent: env.spent + args.amount }
          });
        }

        try {
          const res = await expenseService.createExpense({
            envelope_id: args.envelopeId,
            description: args.title,
            amount: args.amount,
            date: dateStr.split('T')[0],
          });

          if (res.success) {
            // Once saved, refresh for real server state in the background
            value.refreshEnvelopes();
            value.refreshTransactions();
          } else {
            console.error("Backend failed to save tx, reverting would be ideal but refreshing state handles it.");
            value.refreshEnvelopes();
            value.refreshTransactions();
          }
        } catch (error) {
          console.error("addTransaction error:", error);
          value.refreshEnvelopes();
          value.refreshTransactions();
          throw error;
        }
      },
      deleteTransaction: async (id: string) => {
        // Optimistic update: remove from local state immediately
        dispatch({ type: "TX/DELETE", payload: id });

        try {
          const res = await expenseService.deleteExpense(id);
          if (res.success) {
            // Refresh envelopes in the background to sync Spent/Balance from server truth
            const date = new Date();
            envelopeService.getEnvelopeStats(date.getMonth() + 1, date.getFullYear()).then(envRes => {
              if (envRes.data) {
                const mapped: Envelope[] = envRes.data.map((e) => ({
                  id: e.id,
                  name: e.name,
                  budget: e.allocated_amount,
                  spent: e.spent,
                  color: e.icon,
                }));
                dispatch({ type: "ENVELOPE/SET", payload: mapped });
              }
            });
            return true;
          } else {
            // Log error but don't force rollback to keep UI snappy, 
            // the next refresh will fix state if really failed.
            console.error("Backend delete failed:", res.error);
            return false;
          }
        } catch (error) {
          console.error("deleteTransaction error:", error);
          return false;
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
        if (!bill) return;

        // 1. Dispatch immediately
        dispatch({
          type: "BILL/MARK_PAID",
          payload: { billId, paid },
        });

        if (paid && bill.reminderId) {
          cancelBillReminder(bill.reminderId).catch(console.error);
        }

        const isNewlyPaid = paid && !bill.paid;

        try {
          await billService.markBillPaid(billId, paid);

          const targetEnvelope = state.envelopes.find(e => e.id === bill.envelopeId);
          if (isNewlyPaid && targetEnvelope) {
            // Note: addTransaction is already optimistic
            value.addTransaction({
              envelopeId: targetEnvelope.id,
              title: `Paid Bill: ${bill.title}`,
              amount: bill.amount,
              dateISO: new Date().toISOString(),
            }).catch(console.error);
          }
        } catch (error) {
          console.error("markBillPaid error, refreshing to recover:", error);
          value.refreshBills();
        }
      },
      addBill: async (args) => {
        const tempId = `temp-bill-${Date.now()}`;

        // 1. Dispatch optimistic bill
        const optimBill: Bill = {
          id: tempId,
          title: args.title,
          amount: args.amount,
          dueISO: args.dueISO,
          paid: false,
          envelopeId: args.envelopeId,
        };

        dispatch({ type: "BILL/ADD", payload: optimBill });

        try {
          const parsedDate = args.dueISO.split('-').map(Number);
          const res = await billService.createBill({
            name: args.title,
            amount: args.amount,
            due_date: args.dueISO,
            category: args.envelopeId ?? "general",
            month: parsedDate[1],
            year: parsedDate[0],
          });

          if (res.data) {
            scheduleBillReminder(
              res.data.id,
              res.data.name,
              res.data.amount,
              res.data.due_date
            ).catch(console.error);

            // Background refresh to get real ID
            value.refreshBills();
          }
        } catch (error) {
          console.error("addBill error:", error);
          value.refreshBills();
          throw error;
        }
      },
      updateBill: async (args) => {
        const existing = state.bills.find(b => b.id === args.id);
        if (existing) {
          // 1. Dispatch optimistic update
          dispatch({
            type: "BILL/UPDATE",
            payload: { ...existing, title: args.title, amount: args.amount, dueISO: args.dueISO, envelopeId: args.envelopeId }
          });
        }

        try {
          const res = await billService.updateBill(args.id, {
            name: args.title,
            amount: args.amount,
            due_date: args.dueISO,
            category: args.envelopeId,
          });
          if (res.data) {
            value.refreshBills();
          }
        } catch (error) {
          console.error("updateBill error:", error);
          value.refreshBills();
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
              paidDateISO: b.paid_date,
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
        const tempId = `temp-env-${Date.now()}`;

        // 1. Create a "fake" optimistic envelope
        const optimEnv: Envelope = {
          id: tempId,
          name: args.name,
          budget: args.budget,
          spent: 0,
          color: args.color,
        };

        // 2. Dispatch immediately
        dispatch({ type: "ENVELOPE/ADD", payload: optimEnv });

        try {
          const res = await envelopeService.createEnvelope({
            name: args.name,
            allocated_amount: args.budget,
            icon: args.color,
            month: date.getMonth() + 1,
            year: date.getFullYear(),
          });

          if (res.success) {
            // Once saved, refresh for real server state and real IDs
            value.refreshEnvelopes();
          } else {
            console.error("Backend failed to create envelope, refreshing state to recover.");
            value.refreshEnvelopes();
          }
        } catch (error) {
          console.error("addEnvelope error:", error);
          value.refreshEnvelopes();
          throw error;
        }
      },
      updateEnvelope: async (args: { id: string; name: string; budget: number; color: string }) => {
        // 1. Find existing to preserve 'spent'
        const existing = state.envelopes.find(e => e.id === args.id);
        if (existing) {
          // 2. Dispatch optimistic update
          dispatch({
            type: "ENVELOPE/UPDATE",
            payload: { ...existing, name: args.name, budget: args.budget, color: args.color }
          });
        }

        try {
          const res = await envelopeService.updateEnvelope(args.id, {
            name: args.name,
            allocated_amount: args.budget,
            icon: args.color,
          });

          if (res.success) {
            // Success, background refresh just in case
            value.refreshEnvelopes();
          } else {
            console.error("Backend failed to update envelope, refreshing state.");
            value.refreshEnvelopes();
          }
        } catch (error) {
          console.error("updateEnvelope error:", error);
          value.refreshEnvelopes();
          throw error;
        }
      },
      deleteEnvelope: async (id: string) => {
        // Optimistic update: remove from local state immediately
        dispatch({ type: "ENVELOPE/DELETE", payload: id });

        try {
          const res = await envelopeService.deleteEnvelope(id);
          if (res.success) {
            return true;
          }
          console.error("Backend delete envelope failed:", res.error);
          return false;
        } catch (error) {
          console.error("deleteEnvelope error:", error);
          return false;
        }
      },
      updateCurrency: async (currency: string) => {
        // 1. Dispatch locally first
        dispatch({ type: "SETTINGS/CURRENCY", payload: { currency } });

        try {
          // 2. Persist to backend
          const res = await authService.updateProfile(state.user.email, state.user.name, currency, state.dailyLimit);
          if (!res.success) {
            console.error("Failed to persist currency:", res.error);
          }
        } catch (error) {
          console.error("updateCurrency background error:", error);
        }
      },
      updateDailyLimit: async (limit: number) => {
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        // Check if already updated today (Policy check)
        if (state.lastLimitUpdateDateISO === todayStr) {
          throw new Error("Daily limit can only be set once per day.");
        }

        // 1. Dispatch optimistic update immediately
        dispatch({ type: "SETTINGS/DAILY_LIMIT", payload: { limit, dateISO: todayStr } });

        try {
          // Persist to backend in background
          const res = await authService.updateProfile(state.user.email, state.user.name, state.currency, limit);
          if (!res.success) {
            console.error("Failed to persist daily limit:", res.error);
          }
        } catch (error) {
          console.error("Failed to update daily limit in background:", error);
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
