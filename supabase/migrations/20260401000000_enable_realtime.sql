-- Enable Real-time for crucial tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.physical_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.push_subscriptions;
