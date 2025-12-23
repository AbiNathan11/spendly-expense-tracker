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
  reminderId?: string;
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
};

/* ===================== ACTIONS ===================== */

type Action =
  | { type: "AUTH/LOGIN"; payload: { email: string; name?: string } }
  | { type: "AUTH/LOGOUT" }
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
  isAuthed: false, // for used non login check
  currency: "USD",
  dailyLimit: 200,
  user: { name: "Alex", email: "alex@example.com" },
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
      return {
        ...state,
        isAuthed: true,
        user: {
          ...state.user,
          email: action.payload.email,
          name: action.payload.name ?? state.user.name,
        },
      };

    case "AUTH/LOGOUT":
      return { ...state, isAuthed: false };

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

    case "TX/ADD":
      return {
        ...state,
        transactions: [
          {
            id: `t_${Math.random().toString(16).slice(2)}`,
            ...action.payload,
          },
          ...state.transactions,
        ],
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
  addBill: (args: {
    title: string;
    amount: number;
    dueISO: string;
    envelopeId?: string;
  }) => Promise<void>;
  updateBill: (args: {
    id: string;
    title: string;
    amount: number;
    dueISO: string;
    envelopeId?: string;
  }) => Promise<void>;
  markBillPaid: (billId: string, paid: boolean) => Promise<void>;
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

     async addBill(args) {
  // 1️⃣ Create bill in Supabase
  const res = await billService.createBill({
    name: args.title,
    amount: args.amount,
    due_date: args.dueISO,
    category: args.envelopeId ?? "general",
    month: new Date(args.dueISO).getMonth() + 1,
    year: new Date(args.dueISO).getFullYear(),
  });

  if (!res.data) return;

  // 2️⃣ Schedule reminder AFTER bill is created
  const reminderId = await scheduleBillReminder(
    res.data.id,
    res.data.name,
    res.data.amount,
    res.data.due_date
  );

  // 3️⃣ Store bill + reminderId
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
}

,

      async updateBill(args) {
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

    async markBillPaid(billId, paid) {
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

      formatCurrency: (amount) => formatMoney(amount, state.currency),
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
  if (!ctx) throw new Error("useBudget must be used inside BudgetProvider");
  return ctx;
}





// import React, { createContext, useContext, useMemo, useReducer } from "react";
// import { formatMoney } from "../utils/format";
// import { billService } from "../services/billService";

// export type Transaction = {
//   id: string;
//   envelopeId: string;
//   title: string;
//   amount: number;
//   dateISO: string;
// };

// export type Envelope = {
//   id: string;
//   name: string;
//   budget: number;
//   spent: number;
//   color: string;
// };

// export type Bill = {
//   id: string;
//   title: string;
//   amount: number;
//   dueISO: string;
//   paid: boolean;
//   envelopeId?: string;
// };

// export type Goal = {
//   id: string;
//   title: string;
//   target: number;
//   progress: number;
// };

// type State = {
//   isAuthed: boolean;
//   user: { name: string; email: string; avatar?: string };
//   envelopes: Envelope[];
//   transactions: Transaction[];
//   bills: Bill[];
//   goals: Goal[];
//   currency: string;
//   dailyLimit: number;
// };

// type Action =
//   | { type: "AUTH/LOGIN"; payload: { email: string; name?: string } }
//   | { type: "AUTH/LOGOUT" }
//   | { type: "PROFILE/UPDATE"; payload: { name: string; email: string } }
//   | { type: "PROFILE/AVATAR"; payload: { uri: string } }
//   | { type: "TX/ADD"; payload: { envelopeId: string; title: string; amount: number; dateISO: string } }
//   | { type: "BILL/MARK_PAID"; payload: { billId: string; paid: boolean } }
//   | {
//     type: "BILL/ADD";
//     payload: { title: string; amount: number; dueISO: string; envelopeId?: string };
//   }
//   | {
//     type: "BILL/UPDATE";
//     payload: { id: string; title: string; amount: number; dueISO: string; envelopeId?: string };
//   }
//   | {
//     type: "ENVELOPE/ADD";
//     payload: { name: string; budget: number; color: string };
//   }
//   | {
//     type: "ENVELOPE/UPDATE";
//     payload: { id: string; name: string; budget: number; color: string };
//   }
//   | { type: "SETTINGS/CURRENCY"; payload: { currency: string } }
//   | { type: "SETTINGS/DAILY_LIMIT"; payload: { limit: number } };

// const initialState: State = {
//   isAuthed: false,
//   currency: "USD",
//   dailyLimit: 200,
//   user: { name: "Alex", email: "alex@example.com", avatar: undefined },
//   envelopes: [
//     { id: "groceries", name: "Groceries", budget: 400, spent: 250, color: "#9ED9C4" },
//     { id: "transport", name: "Transport", budget: 100, spent: 60, color: "#F6D57A" },
//     { id: "entertainment", name: "Entertainment", budget: 200, spent: 230, color: "#F87171" },
//     { id: "utilities", name: "Utilities", budget: 200, spent: 0, color: "#9ED9C4" },
//   ],
//   transactions: [
//     { id: "t1", envelopeId: "groceries", title: "Groceries", amount: 60, dateISO: new Date().toISOString() },
//     { id: "t2", envelopeId: "transport", title: "Bus", amount: 40, dateISO: new Date().toISOString() },
//     { id: "t3", envelopeId: "entertainment", title: "Movie", amount: 20, dateISO: new Date().toISOString() },
//   ],
//   bills: [
//     {
//       id: "b1",
//       title: "Netflix Subscription",
//       amount: 15.99,
//       dueISO: new Date().toISOString(),
//       paid: false,
//       envelopeId: "entertainment",
//     },
//     {
//       id: "b2",
//       title: "Spotify Premium",
//       amount: 10.99,
//       dueISO: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
//       paid: true,
//       envelopeId: "entertainment",
//     },
//   ],
//   goals: [
//     { id: "g1", title: "Emergency Fund", target: 1500, progress: 620 },
//     { id: "g2", title: "Vacation", target: 900, progress: 240 },
//   ],
// };

// function reducer(state: State, action: Action): State {
//   switch (action.type) {
//     case "AUTH/LOGIN":
//       return {
//         ...state,
//         isAuthed: true,
//         user: { ...state.user, email: action.payload.email, name: action.payload.name ?? state.user.name },
//       };
//     case "AUTH/LOGOUT":
//       return { ...state, isAuthed: false };
//     case "PROFILE/UPDATE":
//       return { ...state, user: { ...state.user, name: action.payload.name, email: action.payload.email } };
//     case "PROFILE/AVATAR":
//       return { ...state, user: { ...state.user, avatar: action.payload.uri } };
//     case "TX/ADD": {
//       const tx: Transaction = {
//         id: `t_${Math.random().toString(16).slice(2)}`,
//         envelopeId: action.payload.envelopeId,
//         title: action.payload.title,
//         amount: action.payload.amount,
//         dateISO: action.payload.dateISO,
//       };

//       const envelopes = state.envelopes.map((e) =>
//         e.id === action.payload.envelopeId ? { ...e, spent: e.spent + action.payload.amount } : e
//       );

//       return { ...state, envelopes, transactions: [tx, ...state.transactions] };
//     }
//     case "BILL/MARK_PAID":
//       return {
//         ...state,
//         bills: state.bills.map((b) => (b.id === action.payload.billId ? { ...b, paid: action.payload.paid } : b)),
//       };
//     case "BILL/ADD": {
//       const bill: Bill = {
//         id: `b_${Math.random().toString(16).slice(2)}`,
//         title: action.payload.title,
//         amount: action.payload.amount,
//         dueISO: action.payload.dueISO,
//         paid: false,
//         envelopeId: action.payload.envelopeId,
//       };
//       return {
//         ...state,
//         bills: [bill, ...state.bills],
//       };
//     }
//     case "BILL/UPDATE":
//       return {
//         ...state,
//         bills: state.bills.map((b) =>
//           b.id === action.payload.id
//             ? {
//               ...b,
//               title: action.payload.title,
//               amount: action.payload.amount,
//               dueISO: action.payload.dueISO,
//               envelopeId: action.payload.envelopeId,
//             }
//             : b
//         ),
//       };

//     case "ENVELOPE/ADD": {
//       const envelope: Envelope = {
//         id: `e_${Math.random().toString(16).slice(2)}`,
//         name: action.payload.name,
//         budget: action.payload.budget,
//         spent: 0,
//         color: action.payload.color,
//       };
//       return {
//         ...state,
//         envelopes: [...state.envelopes, envelope],
//       };
//     }
//     case "ENVELOPE/UPDATE":
//       return {
//         ...state,
//         envelopes: state.envelopes.map((e) =>
//           e.id === action.payload.id
//             ? { ...e, name: action.payload.name, budget: action.payload.budget, color: action.payload.color }
//             : e
//         ),
//       };
//     case "SETTINGS/CURRENCY":
//       return { ...state, currency: action.payload.currency };
//     case "SETTINGS/DAILY_LIMIT":
//       return { ...state, dailyLimit: action.payload.limit };
//     default:
//       return state;
//   }
// }

// type BudgetContextValue = {
//   state: State;
//   login: (email: string, name?: string) => void;
//   logout: () => void;
//   updateProfile: (name: string, email: string) => void;
//   updateAvatar: (uri: string) => void;
//   addTransaction: (args: { envelopeId: string; title: string; amount: number; dateISO?: string }) => void;
//   markBillPaid: (billId: string, paid: boolean) => void;
//   addBill: (args: { title: string; amount: number; dueISO: string; envelopeId?: string }) => void;
//   updateBill: (args: { id: string; title: string; amount: number; dueISO: string; envelopeId?: string }) => void;
//   addEnvelope: (args: { name: string; budget: number; color: string }) => void;
//   updateEnvelope: (args: { id: string; name: string; budget: number; color: string }) => void;
//   updateCurrency: (currency: string) => void;
//   updateDailyLimit: (limit: number) => void;
//   formatCurrency: (amount: number) => string;
// };

// const BudgetContext = createContext<BudgetContextValue | null>(null);

// export function BudgetProvider(props: { children: React.ReactNode }) {
//   const [state, dispatch] = useReducer(reducer, initialState);

//   const value = useMemo<BudgetContextValue>(
//     () => ({
//       state,
//       login: (email: string, name?: string) => dispatch({ type: "AUTH/LOGIN", payload: { email, name } }),
//       logout: () => dispatch({ type: "AUTH/LOGOUT" }),
//       updateProfile: (name: string, email: string) =>
//         dispatch({ type: "PROFILE/UPDATE", payload: { name, email } }),
//       updateAvatar: (uri: string) => dispatch({ type: "PROFILE/AVATAR", payload: { uri } }),
//       addTransaction: (args: { envelopeId: string; title: string; amount: number; dateISO?: string }) =>
//         dispatch({
//           type: "TX/ADD",
//           payload: {
//             envelopeId: args.envelopeId,
//             title: args.title,
//             amount: args.amount,
//             dateISO: args.dateISO ?? new Date().toISOString(),
//           },
//         }),
//       markBillPaid: (billId: string, paid: boolean) =>
//         dispatch({ type: "BILL/MARK_PAID", payload: { billId, paid } }),
//       addBill: (args: { title: string; amount: number; dueISO: string; envelopeId?: string }) =>
//         dispatch({ type: "BILL/ADD", payload: args }),
//       updateBill: (args: { id: string; title: string; amount: number; dueISO: string; envelopeId?: string }) =>
//         dispatch({ type: "BILL/UPDATE", payload: args }),
//       addEnvelope: (args: { name: string; budget: number; color: string }) =>
//         dispatch({ type: "ENVELOPE/ADD", payload: args }),
//       updateEnvelope: (args: { id: string; name: string; budget: number; color: string }) =>
//         dispatch({ type: "ENVELOPE/UPDATE", payload: args }),
//       updateCurrency: (currency: string) => dispatch({ type: "SETTINGS/CURRENCY", payload: { currency } }),
//       updateDailyLimit: (limit: number) => dispatch({ type: "SETTINGS/DAILY_LIMIT", payload: { limit } }),
//       formatCurrency: (amount: number) => formatMoney(amount, state.currency),
//     }),

//     [state]
//   );

//   return <BudgetContext.Provider value={value}>{props.children}</BudgetContext.Provider>;
// }

// export function useBudget() {
//   const ctx = useContext(BudgetContext);
//   if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
//   return ctx;
// }
