grant usage on schema public to service_role;
grant select, insert, update, delete on table employees, sales, expenses, integration_attempts to service_role;
grant usage, select on all sequences in schema public to service_role;
