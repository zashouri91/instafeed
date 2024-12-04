-- Create or replace function to create tables
CREATE OR REPLACE FUNCTION create_table(table_name TEXT, table_definition TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE table_definition;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to set up RLS
CREATE OR REPLACE FUNCTION setup_rls(tables TEXT[])
RETURNS VOID AS $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%I_all" ON %I', tbl, tbl);
    EXECUTE format('
      CREATE POLICY "%I_all" ON %I
      FOR ALL
      USING (true)
      WITH CHECK (true)
    ', tbl, tbl);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
