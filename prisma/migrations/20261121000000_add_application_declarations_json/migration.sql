-- Add declarationsJson column for application declarations
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "declarationsJson" TEXT;
