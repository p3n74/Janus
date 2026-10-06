import { useNavigate } from "@tanstack/react-router";
import { Button } from "@whatsapp-crm/ui/components/button";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

export default function SignInForm() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Loader />;
  }

  if (session?.user) {
    void navigate({ to: "/dashboard" });
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="mb-2 text-center text-3xl font-bold">Sign in</h1>
      <p className="mb-6 text-center text-sm text-neutral-500">
        Use your Google account. Access is limited to invited people.
      </p>
      <Button
        className="w-full"
        onClick={() => {
          void authClient.signIn.social(
            {
              provider: "google",
              callbackURL: "/dashboard",
            },
            {
              onSuccess: () => {
                void navigate({ to: "/dashboard" });
              },
              onError: (error) => {
                toast.error(error.error.message || error.error.statusText);
              },
            },
          );
        }}
      >
        Continue with Google
      </Button>
    </div>
  );
}
