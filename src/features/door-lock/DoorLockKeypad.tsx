import { Grid, Button as ChakraButton } from "@chakra-ui/react";
import Button from "../../components/Button";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "←", "0", "↵"];

type Props = {
  onKey: (key: string) => void;
};

export default function DoorLockKeypad({ onKey }: Props) {
  return (
    <Grid
      templateColumns="repeat(3, 1fr)"
      templateRows="repeat(4, 1fr)"
      h="100%"
      p={4}
      gap={4}
      placeItems="center"
    >
      {KEYS.map((key) =>
        key === "↵" ? (
          <Button
            key={key}
            w="100%"
            h="100%"
            onClick={() => onKey(key)}
            fontSize="4xl"
            fontWeight="bold"
            bg="brand.400"
            _active={{ transition: "none", bg: "brand.200" }}
          >
            {key}
          </Button>
        ) : (
          <ChakraButton
            key={key}
            variant="outline"
            colorScheme="brand"
            w="100%"
            h="100%"
            fontSize="3xl"
            fontWeight="bold"
            _active={{
              bg: "brand.300",
              color: "white",
              borderColor: "brand.50",
              transition: "none",
            }}
            onClick={() => onKey(key)}
          >
            {key}
          </ChakraButton>
        ),
      )}
    </Grid>
  );
}
