-- CreateEnum
CREATE TYPE "queue_mode" AS ENUM ('MANUAL_FIFO', 'ROLLING_CAPACITY', 'TIMED_ROLLING_CAPACITY');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_account" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "oauth_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_session" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "last_active_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attraction" (
    "id" UUID NOT NULL,
    "parent_attraction_id" UUID,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "attraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_ticket" (
    "id" UUID NOT NULL,
    "attraction_id" UUID NOT NULL,
    "external_ticket_ref" TEXT NOT NULL,
    "purchased_quantity" INTEGER NOT NULL,
    "redeemed_quantity" INTEGER NOT NULL DEFAULT 0,
    "validation_status" TEXT NOT NULL,

    CONSTRAINT "external_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_pass" (
    "id" UUID NOT NULL,
    "external_ticket_id" UUID NOT NULL,
    "attraction_id" UUID NOT NULL,
    "user_id" UUID,
    "guest_session_id" UUID,
    "qr_token_hash" TEXT NOT NULL,
    "entitlement_quantity" INTEGER NOT NULL,
    "consumed_quantity" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "queue_pass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_session" (
    "id" UUID NOT NULL,
    "attraction_id" UUID NOT NULL,
    "queue_mode" "queue_mode" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "max_duration_minutes" INTEGER,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "queue_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_entry" (
    "id" UUID NOT NULL,
    "queue_pass_id" UUID,
    "session_id" UUID NOT NULL,
    "user_id" UUID,
    "guest_session_id" UUID,
    "party_size" INTEGER NOT NULL,
    "ticket_number" INTEGER NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,

    CONSTRAINT "queue_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_entry_attempt" (
    "id" UUID NOT NULL,
    "queue_entry_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "called_quantity" INTEGER NOT NULL,
    "boarded_quantity" INTEGER NOT NULL,
    "carried_forward_quantity" INTEGER NOT NULL,
    "called_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "queue_entry_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_occupancy" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_end_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),

    CONSTRAINT "queue_occupancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profile" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "employee_code" TEXT NOT NULL,

    CONSTRAINT "staff_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_shift" (
    "id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "ended_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "staff_shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_assignment" (
    "id" UUID NOT NULL,
    "shift_id" UUID NOT NULL,
    "staff_profile_id" UUID NOT NULL,

    CONSTRAINT "shift_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_operation_log" (
    "id" UUID NOT NULL,
    "queue_entry_id" UUID,
    "shift_assignment_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queue_operation_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "guest_session_id" UUID,
    "queue_entry_id" UUID,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscription" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "guest_session_id" UUID,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "expiration_time" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "push_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "oauth_account_user_id_idx" ON "oauth_account"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_account_provider_provider_account_id_key" ON "oauth_account"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "guest_session_token_hash_key" ON "guest_session"("token_hash");

-- CreateIndex
CREATE INDEX "guest_session_user_id_idx" ON "guest_session"("user_id");

-- CreateIndex
CREATE INDEX "guest_session_expires_at_idx" ON "guest_session"("expires_at");

-- CreateIndex
CREATE INDEX "attraction_parent_attraction_id_idx" ON "attraction"("parent_attraction_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_ticket_external_ticket_ref_key" ON "external_ticket"("external_ticket_ref");

-- CreateIndex
CREATE INDEX "external_ticket_attraction_id_idx" ON "external_ticket"("attraction_id");

-- CreateIndex
CREATE UNIQUE INDEX "queue_pass_qr_token_hash_key" ON "queue_pass"("qr_token_hash");

-- CreateIndex
CREATE INDEX "queue_pass_external_ticket_id_idx" ON "queue_pass"("external_ticket_id");

-- CreateIndex
CREATE INDEX "queue_pass_attraction_id_idx" ON "queue_pass"("attraction_id");

-- CreateIndex
CREATE INDEX "queue_pass_user_id_idx" ON "queue_pass"("user_id");

-- CreateIndex
CREATE INDEX "queue_pass_guest_session_id_idx" ON "queue_pass"("guest_session_id");

-- CreateIndex
CREATE INDEX "queue_session_attraction_id_idx" ON "queue_session"("attraction_id");

-- CreateIndex
CREATE INDEX "queue_session_starts_at_ends_at_idx" ON "queue_session"("starts_at", "ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "queue_entry_queue_pass_id_key" ON "queue_entry"("queue_pass_id");

-- CreateIndex
CREATE INDEX "queue_entry_session_id_idx" ON "queue_entry"("session_id");

-- CreateIndex
CREATE INDEX "queue_entry_user_id_idx" ON "queue_entry"("user_id");

-- CreateIndex
CREATE INDEX "queue_entry_guest_session_id_idx" ON "queue_entry"("guest_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "queue_entry_session_id_ticket_number_key" ON "queue_entry"("session_id", "ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "queue_entry_attempt_queue_entry_id_attempt_number_key" ON "queue_entry_attempt"("queue_entry_id", "attempt_number");

-- CreateIndex
CREATE INDEX "queue_occupancy_attempt_id_idx" ON "queue_occupancy"("attempt_id");

-- CreateIndex
CREATE INDEX "queue_occupancy_ended_at_idx" ON "queue_occupancy"("ended_at");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profile_user_id_key" ON "staff_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profile_employee_code_key" ON "staff_profile"("employee_code");

-- CreateIndex
CREATE INDEX "shift_assignment_staff_profile_id_idx" ON "shift_assignment"("staff_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "shift_assignment_shift_id_staff_profile_id_key" ON "shift_assignment"("shift_id", "staff_profile_id");

-- CreateIndex
CREATE INDEX "queue_operation_log_queue_entry_id_idx" ON "queue_operation_log"("queue_entry_id");

-- CreateIndex
CREATE INDEX "queue_operation_log_shift_assignment_id_idx" ON "queue_operation_log"("shift_assignment_id");

-- CreateIndex
CREATE INDEX "notification_user_id_idx" ON "notification"("user_id");

-- CreateIndex
CREATE INDEX "notification_guest_session_id_idx" ON "notification"("guest_session_id");

-- CreateIndex
CREATE INDEX "notification_queue_entry_id_idx" ON "notification"("queue_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscription_endpoint_key" ON "push_subscription"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscription_user_id_idx" ON "push_subscription"("user_id");

-- CreateIndex
CREATE INDEX "push_subscription_guest_session_id_idx" ON "push_subscription"("guest_session_id");

-- AddForeignKey
ALTER TABLE "oauth_account" ADD CONSTRAINT "oauth_account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_session" ADD CONSTRAINT "guest_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attraction" ADD CONSTRAINT "attraction_parent_attraction_id_fkey" FOREIGN KEY ("parent_attraction_id") REFERENCES "attraction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_ticket" ADD CONSTRAINT "external_ticket_attraction_id_fkey" FOREIGN KEY ("attraction_id") REFERENCES "attraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_pass" ADD CONSTRAINT "queue_pass_external_ticket_id_fkey" FOREIGN KEY ("external_ticket_id") REFERENCES "external_ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_pass" ADD CONSTRAINT "queue_pass_attraction_id_fkey" FOREIGN KEY ("attraction_id") REFERENCES "attraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_pass" ADD CONSTRAINT "queue_pass_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_pass" ADD CONSTRAINT "queue_pass_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_session" ADD CONSTRAINT "queue_session_attraction_id_fkey" FOREIGN KEY ("attraction_id") REFERENCES "attraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entry" ADD CONSTRAINT "queue_entry_queue_pass_id_fkey" FOREIGN KEY ("queue_pass_id") REFERENCES "queue_pass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entry" ADD CONSTRAINT "queue_entry_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "queue_session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entry" ADD CONSTRAINT "queue_entry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entry" ADD CONSTRAINT "queue_entry_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entry_attempt" ADD CONSTRAINT "queue_entry_attempt_queue_entry_id_fkey" FOREIGN KEY ("queue_entry_id") REFERENCES "queue_entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_occupancy" ADD CONSTRAINT "queue_occupancy_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "queue_entry_attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profile" ADD CONSTRAINT "staff_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignment" ADD CONSTRAINT "shift_assignment_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "staff_shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignment" ADD CONSTRAINT "shift_assignment_staff_profile_id_fkey" FOREIGN KEY ("staff_profile_id") REFERENCES "staff_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_operation_log" ADD CONSTRAINT "queue_operation_log_queue_entry_id_fkey" FOREIGN KEY ("queue_entry_id") REFERENCES "queue_entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_operation_log" ADD CONSTRAINT "queue_operation_log_shift_assignment_id_fkey" FOREIGN KEY ("shift_assignment_id") REFERENCES "shift_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_queue_entry_id_fkey" FOREIGN KEY ("queue_entry_id") REFERENCES "queue_entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ==========================================
-- CHECK CONSTRAINTS
-- ==========================================

-- EXTERNAL TICKET
ALTER TABLE "external_ticket"
ADD CONSTRAINT "external_ticket_purchased_quantity_check"
CHECK ("purchased_quantity" > 0);

ALTER TABLE "external_ticket"
ADD CONSTRAINT "external_ticket_redeemed_quantity_check"
CHECK (
    "redeemed_quantity" >= 0
    AND "redeemed_quantity" <= "purchased_quantity"
);


-- QUEUE PASS
ALTER TABLE "queue_pass"
ADD CONSTRAINT "queue_pass_entitlement_quantity_check"
CHECK ("entitlement_quantity" > 0);

ALTER TABLE "queue_pass"
ADD CONSTRAINT "queue_pass_consumed_quantity_check"
CHECK (
    "consumed_quantity" >= 0
    AND "consumed_quantity" <= "entitlement_quantity"
);

ALTER TABLE "queue_pass"
ADD CONSTRAINT "queue_pass_owner_check"
CHECK (
    ("user_id" IS NOT NULL AND "guest_session_id" IS NULL)
    OR
    ("user_id" IS NULL AND "guest_session_id" IS NOT NULL)
);


-- QUEUE ENTRY
ALTER TABLE "queue_entry"
ADD CONSTRAINT "queue_entry_owner_check"
CHECK (
    ("user_id" IS NOT NULL AND "guest_session_id" IS NULL)
    OR
    ("user_id" IS NULL AND "guest_session_id" IS NOT NULL)
);

ALTER TABLE "queue_entry"
ADD CONSTRAINT "queue_entry_party_size_check"
CHECK ("party_size" > 0);

ALTER TABLE "queue_entry"
ADD CONSTRAINT "queue_entry_ticket_number_check"
CHECK ("ticket_number" > 0);


-- QUEUE ENTRY ATTEMPT
ALTER TABLE "queue_entry_attempt"
ADD CONSTRAINT "queue_entry_attempt_number_check"
CHECK ("attempt_number" > 0);

ALTER TABLE "queue_entry_attempt"
ADD CONSTRAINT "queue_entry_attempt_quantities_check"
CHECK (
    "called_quantity" >= 0
    AND "boarded_quantity" >= 0
    AND "carried_forward_quantity" >= 0
    AND "boarded_quantity" <= "called_quantity"
    AND "carried_forward_quantity" <= "called_quantity"
);

ALTER TABLE "queue_entry_attempt"
ADD CONSTRAINT "queue_entry_attempt_completion_check"
CHECK (
    "completed_at" IS NULL
    OR
    "called_quantity" = (
        "boarded_quantity" + "carried_forward_quantity"
    )
);


-- QUEUE SESSION
ALTER TABLE "queue_session"
ADD CONSTRAINT "queue_session_capacity_check"
CHECK ("capacity" > 0);

ALTER TABLE "queue_session"
ADD CONSTRAINT "queue_session_time_check"
CHECK ("ends_at" > "starts_at");

ALTER TABLE "queue_session"
ADD CONSTRAINT "queue_session_mode_check"
CHECK (
    (
        "queue_mode" = 'MANUAL_FIFO'
        AND "capacity" = 1
        AND "max_duration_minutes" IS NULL
    )
    OR
    (
        "queue_mode" = 'ROLLING_CAPACITY'
        AND "max_duration_minutes" IS NULL
    )
    OR
    (
        "queue_mode" = 'TIMED_ROLLING_CAPACITY'
        AND "max_duration_minutes" > 0
    )
);


-- QUEUE OCCUPANCY
ALTER TABLE "queue_occupancy"
ADD CONSTRAINT "queue_occupancy_expected_end_check"
CHECK (
    "expected_end_at" IS NULL
    OR "expected_end_at" > "started_at"
);

ALTER TABLE "queue_occupancy"
ADD CONSTRAINT "queue_occupancy_ended_at_check"
CHECK (
    "ended_at" IS NULL
    OR "ended_at" >= "started_at"
);


-- STAFF SHIFT
ALTER TABLE "staff_shift"
ADD CONSTRAINT "staff_shift_time_check"
CHECK ("ended_at" > "started_at");


-- NOTIFICATION
ALTER TABLE "notification"
ADD CONSTRAINT "notification_owner_check"
CHECK (
    ("user_id" IS NOT NULL AND "guest_session_id" IS NULL)
    OR
    ("user_id" IS NULL AND "guest_session_id" IS NOT NULL)
);


-- PUSH SUBSCRIPTION
ALTER TABLE "push_subscription"
ADD CONSTRAINT "push_subscription_owner_check"
CHECK (
    ("user_id" IS NOT NULL AND "guest_session_id" IS NULL)
    OR
    ("user_id" IS NULL AND "guest_session_id" IS NOT NULL)
);