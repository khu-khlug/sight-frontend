import { Grid } from "@chakra-ui/react";
import Button from "../../components/Button";
import styles from "./DoorLockKeypad.module.css";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "←", "0", "↵"];

type Props = {
  onKey: (key: string) => void;
};

export default function DoorLockKeypad({ onKey }: Props) {
  return (
    <Grid
      className={styles.grid}
      templateColumns="repeat(3, 1fr)"
      templateRows="repeat(4, 1fr)"
      h="100%"
      p={4}
      gap={4}
      placeItems="center"
    >
      {KEYS.map((key) => (
        <Button
          key={key}
          className={styles.button}
          variant={key === "↵" ? "primary" : "neutral"}
          borderRadius="100%"
          fontSize="xl"
          onClick={() => onKey(key)}
        >
          {key}
        </Button>
      ))}
    </Grid>
  );
}
