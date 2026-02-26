import { RegisterClient } from "@/components/register-client";
import { AuthStatusChip } from "@/components/auth-status-chip";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <AuthStatusChip />
      <RegisterClient />
    </div>
  );
}
