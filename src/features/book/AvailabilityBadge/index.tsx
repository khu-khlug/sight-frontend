import { Badge } from "@chakra-ui/react";

type Props = {
  availableCount: number;
  size?: "xs" | "sm" | "md";
};

export default function AvailabilityBadge({ availableCount, size = "xs" }: Props) {
  const available = availableCount > 0;
  return (
    <Badge
      px={2}
      py={1}
      borderRadius="md"
      fontSize={size}
      bg={available ? "green.500" : "red.500"}
      color="white"
    >
      {available ? "대출 가능" : "대출 불가"}
    </Badge>
  );
}
