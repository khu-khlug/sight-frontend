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
      gap={2}
      placeItems="center"
      border="1px solid"
      borderColor="var(--dl-keypad-border)"
      borderRadius="xl"
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
            color="var(--dl-key-enter-text)"
            bg="var(--dl-key-enter-bg)"
            borderRadius="10%"
            borderColor="var(--dl-key-enter-border)"
            _hover={{ bg: "var(--dl-key-enter-bg)" }}
            _active={{ transition: "none", bg: "var(--dl-key-enter-active-bg)" }}
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
            bg="var(--dl-key-bg)"
            color="var(--dl-key-text)"
            borderColor="var(--dl-key-border)"
            borderRadius="10%"
            _hover={{ bg: "var(--dl-key-hover-bg)", borderColor: "var(--dl-key-border)" }}
            _active={{
              bg: "var(--dl-key-active-bg)",
              color: "var(--dl-key-active-color)",
              borderColor: "var(--dl-key-active-border)",
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
