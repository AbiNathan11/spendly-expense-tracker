export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: { mode?: "login" | "signup" };
  AppTabs: undefined;

  EnvelopeDetail: { envelopeId: string };
  UpdateSpending: { envelopeId?: string } | undefined;

  BillDetail: { billId: string };
  AddBill: { date?: string; billId?: string };
  AddEnvelope: { envelopeId?: string } | undefined;
  Notifications: undefined;
  PdfExport: undefined;
  ProfileSettings: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Envelopes: undefined;
  Bills: undefined;
  Reports: undefined;
};
