import { Button, Spinner, Surface, useToast } from "heroui-native";
import { Text } from "react-native";

import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

function SignIn() {
  const { toast } = useToast();
  const { isPending } = authClient.useSession();

  return (
    <Surface variant="secondary" className="p-4 rounded-lg">
      <Text className="text-foreground font-medium mb-4">Sign in</Text>
      <Text className="text-muted text-sm mb-4">
        Use your Google account. Access is limited to invited people.
      </Text>
      <Button
        isDisabled={isPending}
        onPress={() => {
          void authClient.signIn.social(
            {
              provider: "google",
              callbackURL: "/",
            },
            {
              onError(error) {
                toast.show({
                  variant: "danger",
                  label: error.error?.message || "Failed to sign in",
                });
              },
              onSuccess() {
                toast.show({
                  variant: "success",
                  label: "Signed in successfully",
                });
                void queryClient.refetchQueries();
              },
            },
          );
        }}
      >
        {isPending ? <Spinner size="sm" color="default" /> : <Button.Label>Continue with Google</Button.Label>}
      </Button>
    </Surface>
  );
}

export { SignIn };
