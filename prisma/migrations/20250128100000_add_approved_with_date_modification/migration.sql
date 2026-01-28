-- Add APPROVED_WITH_DATE_MODIFICATION to ApplicationLogType enum (period correction flow)
ALTER TYPE "ApplicationLogType" ADD VALUE IF NOT EXISTS 'APPROVED_WITH_DATE_MODIFICATION';
