-- Data-only migration (no DDL): normalize legacy unnormalized phone numbers
-- and remap old 4-value LeadStatus to the new 8-stage funnel values, ahead
-- of the schema.prisma enum expansion. SQLite stores enums as plain TEXT
-- with no CHECK constraint, so this must run before the app starts reading
-- rows with the new Prisma Client (which no longer recognizes the old
-- status strings).

UPDATE "Lead" SET "status" = 'NEEDS_ASSESSMENT' WHERE "status" = 'IN_PROGRESS';
UPDATE "Lead" SET "status" = 'WON' WHERE "status" = 'DONE';
UPDATE "Lead" SET "status" = 'LOST' WHERE "status" = 'CANCELED';
