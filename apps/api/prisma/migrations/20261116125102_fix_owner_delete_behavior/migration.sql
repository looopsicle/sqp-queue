-- DropForeignKey
ALTER TABLE "queue_pass" DROP CONSTRAINT "queue_pass_guest_session_id_fkey";

-- DropForeignKey
ALTER TABLE "queue_pass" DROP CONSTRAINT "queue_pass_user_id_fkey";

-- AddForeignKey
ALTER TABLE "queue_pass" ADD CONSTRAINT "queue_pass_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_pass" ADD CONSTRAINT "queue_pass_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
