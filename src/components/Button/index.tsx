import { Button as ChakraButton } from "@chakra-ui/react";

type Variant = "primary" | "neutral";

type Props = React.ComponentProps<typeof ChakraButton> & {
  variant?: Variant;
  disabled?: boolean;
  onClick?: () => void;
};

export default function Button({
  variant = "primary",
  disabled,
  ...props
}: Props) {
  return <ChakraButton variant={variant} disabled={disabled} {...props} />;
}
