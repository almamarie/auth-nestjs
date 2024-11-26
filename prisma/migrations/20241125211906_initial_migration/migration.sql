-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "otherNames" TEXT,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "country" TEXT,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "address" TEXT,
    "profilePicture" TEXT,
    "passwordHash" TEXT NOT NULL,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3) NOT NULL,
    "accountActivationToken" TEXT NOT NULL,
    "accountActivationExpires" TIMESTAMP(3) NOT NULL,
    "accountActivatedAt" TIMESTAMP(3) NOT NULL,
    "accountIsActivated" BOOLEAN NOT NULL,
    "phoneNumberIsActivated" BOOLEAN NOT NULL,
    "phoneNumberVerificationToken" TEXT,
    "phoneNumberVerificationTokenExpires" TIMESTAMP(3),
    "phoneNumberVerificationCode" TEXT,
    "phoneNumberVerifiedAt" TIMESTAMP(3) NOT NULL,
    "mfaEnabled" BOOLEAN NOT NULL,
    "mfaType" TEXT NOT NULL,
    "mfaCode" TEXT,
    "mfaCodeExpiresAt" TIMESTAMP(3),
    "role" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceUser" (
    "serviceId" SERIAL NOT NULL,
    "apiKey" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,

    CONSTRAINT "ServiceUser_pkey" PRIMARY KEY ("serviceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
