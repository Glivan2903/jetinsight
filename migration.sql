-- Migration to convert text metrics to numeric types

-- 1. Create temporary columns to hold converted data

ALTER TABLE atendimento ADD COLUMN lead_scoring_temp NUMERIC;
ALTER TABLE atendimento ADD COLUMN churn_temp NUMERIC;
ALTER TABLE atendimento ADD COLUMN upsell_temp NUMERIC;
ALTER TABLE atendimento ADD COLUMN downsell_temp NUMERIC;
ALTER TABLE atendimento ADD COLUMN nota_temp NUMERIC;

-- 2. Migrate Data
-- Convert Lead Scoring (Text -> Numeric)
UPDATE atendimento 
SET lead_scoring_temp = CASE 
    WHEN CAST(lead_scoring AS TEXT) ~ '^[0-9]+(\.[0-9]+)?$' THEN CAST(lead_scoring AS NUMERIC)
    ELSE 0 
END;

-- Convert Nota (Text/Int -> Numeric)
UPDATE atendimento 
SET nota_temp = CASE 
    WHEN CAST(nota AS TEXT) ~ '^[0-9]+(\.[0-9]+)?$' THEN CAST(nota AS NUMERIC)
    ELSE 0 
END;

-- Convert Churn/Upsell/Downsell (Text -> Numeric Percentage)
UPDATE atendimento
SET 
  churn_temp = CASE 
    WHEN CAST(churn AS TEXT) ~ '^[0-9]+$' THEN CAST(churn AS NUMERIC)
    WHEN lower(CAST(churn AS TEXT)) IN ('true', 'sim', 's', 'yes', '1') THEN 100
    WHEN lower(CAST(churn AS TEXT)) LIKE '%alto%' OR lower(CAST(churn AS TEXT)) LIKE '%crítico%' THEN 80
    WHEN lower(CAST(churn AS TEXT)) LIKE '%médio%' THEN 50
    WHEN lower(CAST(churn AS TEXT)) LIKE '%baixo%' THEN 20
    ELSE 0
  END,
  upsell_temp = CASE 
    WHEN CAST(upsell AS TEXT) ~ '^[0-9]+$' THEN CAST(upsell AS NUMERIC)
    WHEN lower(CAST(upsell AS TEXT)) IN ('true', 'sim', 's', 'yes', '1') THEN 100
     WHEN lower(CAST(upsell AS TEXT)) LIKE '%alto%' THEN 80
    ELSE 0
  END,
  downsell_temp = CASE 
    WHEN CAST(downsell AS TEXT) ~ '^[0-9]+$' THEN CAST(downsell AS NUMERIC)
    WHEN lower(CAST(downsell AS TEXT)) IN ('true', 'sim', 's', 'yes', '1') THEN 100
     WHEN lower(CAST(downsell AS TEXT)) LIKE '%alto%' THEN 80
    ELSE 0
  END;

-- 3. Drop old columns and rename new ones
ALTER TABLE atendimento DROP COLUMN lead_scoring;
ALTER TABLE atendimento DROP COLUMN nota;
ALTER TABLE atendimento DROP COLUMN churn;
ALTER TABLE atendimento DROP COLUMN upsell;
ALTER TABLE atendimento DROP COLUMN downsell;

ALTER TABLE atendimento RENAME COLUMN lead_scoring_temp TO lead_scoring;
ALTER TABLE atendimento RENAME COLUMN nota_temp TO nota;
ALTER TABLE atendimento RENAME COLUMN churn_temp TO churn;
ALTER TABLE atendimento RENAME COLUMN upsell_temp TO upsell;
ALTER TABLE atendimento RENAME COLUMN downsell_temp TO downsell;
