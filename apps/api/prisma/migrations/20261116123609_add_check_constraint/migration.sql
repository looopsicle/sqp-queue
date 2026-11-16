-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_guest_session_id_fkey";

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_user_id_fkey";

-- DropForeignKey
ALTER TABLE "push_subscription" DROP CONSTRAINT "push_subscription_guest_session_id_fkey";

-- DropForeignKey
ALTER TABLE "push_subscription" DROP CONSTRAINT "push_subscription_user_id_fkey";

-- DropForeignKey
ALTER TABLE "queue_entry" DROP CONSTRAINT "queue_entry_guest_session_id_fkey";

-- DropForeignKey
ALTER TABLE "queue_entry" DROP CONSTRAINT "queue_entry_user_id_fkey";

-- DropForeignKey
ALTER TABLE "queue_pass" DROP CONSTRAINT "queue_pass_guest_session_id_fkey";

-- DropForeignKey
ALTER TABLE "queue_pass" DROP CONSTRAINT "queue_pass_user_id_fkey";

-- AddForeignKey
ALTER TABLE "queue_pass" ADD CONSTRAINT "queue_pass_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_pass" ADD CONSTRAINT "queue_pass_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entry" ADD CONSTRAINT "queue_entry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entry" ADD CONSTRAINT "queue_entry_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
