-- Fix remaining security warnings: Add search_path to existing functions

-- Fix generate_protocol_code function
CREATE OR REPLACE FUNCTION public.generate_protocol_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate format: UV-YYYY-NNNNNN (UV = Univértix, YYYY = year, NNNNNN = 6 digit number)
    new_code := 'UV-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.complaints WHERE protocol_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$function$;

-- Fix set_protocol_code function
CREATE OR REPLACE FUNCTION public.set_protocol_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.protocol_code IS NULL OR NEW.protocol_code = '' THEN
    NEW.protocol_code := generate_protocol_code();
  END IF;
  RETURN NEW;
END;
$function$;