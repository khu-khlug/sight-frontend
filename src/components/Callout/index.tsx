import { Alert } from "@chakra-ui/react";

type Props = {
  type?: "info" | "success" | "error" | "warning";
  children?: React.ReactNode;
};

export default function Callout({ type = "info", children }: Props) {
  return (
    <Alert.Root status={type} borderRadius="md" alignItems="center">
      <Alert.Indicator />
      <Alert.Description flex={1}>{children}</Alert.Description>
    </Alert.Root>
  );
}
