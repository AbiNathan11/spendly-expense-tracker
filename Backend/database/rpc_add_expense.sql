-- RPC Function: add_expense_and_update_envelope
-- This function handles the "Add Expense" flow transactionally.
-- It verifies the user, inserts the expense, updates the envelope balance,
-- calculates daily spend, and checks for overspending.

CREATE OR REPLACE FUNCTION add_expense_and_update_envelope(
  p_envelope_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_date DATE,
  p_shop_name VARCHAR DEFAULT NULL,
  p_receipt_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator (needed to bypass strict RLS if necessary, but we still verify auth.uid())
AS $$
DECLARE
  v_user_id UUID;
  v_new_balance DECIMAL;
  v_daily_spend DECIMAL;
  v_is_overspent BOOLEAN;
  v_expense_id UUID;
BEGIN
  -- 1. Verify Authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Insert Expense
  INSERT INTO expenses (
    user_id,
    envelope_id,
    amount,
    description,
    date,
    shop_name,
    receipt_url
  ) VALUES (
    v_user_id,
    p_envelope_id,
    p_amount,
    p_description,
    p_date,
    p_shop_name,
    p_receipt_url
  ) RETURNING id INTO v_expense_id;

  -- 3. Update Envelope Balance
  -- We subtract the amount from the current balance.
  UPDATE envelopes
  SET 
    current_balance = current_balance - p_amount,
    updated_at = NOW()
  WHERE id = p_envelope_id AND user_id = v_user_id
  RETURNING current_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Envelope not found or access denied';
  END IF;

  -- 4. Calculate Total Daily Spend
  -- Sum of all expenses for this user on the given date
  SELECT COALESCE(SUM(amount), 0)
  INTO v_daily_spend
  FROM expenses
  WHERE user_id = v_user_id AND date = p_date;

  -- 5. Detect Overspending
  -- We consider it overspent if the *new* balance is negative.
  v_is_overspent := v_new_balance < 0;

  -- 6. Return Structured Response
  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'daily_spend', v_daily_spend,
    'is_overspent', v_is_overspent,
    'expense_id', v_expense_id
  );

EXCEPTION WHEN OTHERS THEN
  -- Rollback is automatic in PL/PGSQL exceptions
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;
