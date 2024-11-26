/*
  Warnings:

  - Made the column `country` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "passwordChangedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "accountActivationToken" DROP NOT NULL,
ALTER COLUMN "accountActivationExpires" DROP NOT NULL,
ALTER COLUMN "accountActivatedAt" DROP NOT NULL,
ALTER COLUMN "accountIsActivated" SET DEFAULT false,
ALTER COLUMN "phoneNumberIsActivated" SET DEFAULT false,
ALTER COLUMN "phoneNumberVerifiedAt" DROP NOT NULL,
ALTER COLUMN "mfaType" SET DEFAULT 'NONE';
