-- Migration: Add new fields to presupuestos_peso_semanal
-- Date: 2026-04-23
-- Description: Add edad, gd, ca columns for peso presupuesto

-- Add new columns as nullable first (for backward compatibility)
ALTER TABLE presupuestos_peso_semanal 
ADD COLUMN edad INT NULL DEFAULT NULL AFTER semana;

ALTER TABLE presupuestos_peso_semanal 
ADD COLUMN gd FLOAT NULL AFTER peso_objetivo;

ALTER TABLE presupuestos_peso_semanal 
ADD COLUMN ca FLOAT NULL AFTER gd;

-- Update existing rows: set edad based on semana (semana * 7 days)
UPDATE presupuestos_peso_semanal SET edad = semana * 7 WHERE edad IS NULL;

-- Make edad NOT NULL after populating data
ALTER TABLE presupuestos_peso_semanal MODIFY COLUMN edad INT NOT NULL;