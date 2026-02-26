
-- Add notes and sort_order to schedules for enhanced time management
ALTER TABLE public.schedules ADD COLUMN notes text;
ALTER TABLE public.schedules ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.schedules ADD COLUMN goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL;
