CREATE OR REPLACE FUNCTION increment_counters(line_item_count int)
RETURNS TABLE (invoice_no int, our_ref_no int)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE settings
  SET
    next_invoice_no = next_invoice_no + 1,
    next_ref_no = next_ref_no + line_item_count,
    updated_at = now()
  WHERE id = 1;

  RETURN QUERY
  SELECT
    next_invoice_no - 1,
    next_ref_no - line_item_count
  FROM settings
  WHERE id = 1;
END;
$$;