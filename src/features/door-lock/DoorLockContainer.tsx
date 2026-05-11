import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import DoorLockKeypad from "./DoorLockKeypad";

export default function DoorLockContainer() {
  const [input, setInput] = useState("");

  const handleKey = (key: string) => {
    if (key === "←") {
      setInput((prev) => prev.slice(0, -1));
    } else if (key !== "↵") {
      setInput((prev) => (prev.length < 10 ? prev + key : prev));
    }
  };

  return (
    <Flex h="100%">
      <Flex direction="column" flex="6">
        <Box
          flex="1"
          border="1px solid"
          borderColor="gray.200"
          display="flex"
          alignItems="center"
          px={6}
        >
          <Text
            fontSize="4xl"
            fontWeight="bold"
            letterSpacing="wide"
            fontVariantNumeric="tabular-nums"
            color="fg"
          >
            {input}
          </Text>
        </Box>
        <Flex flex="3">
          <Box flex="1" border="1px solid" borderColor="gray.200" />
          <Box flex="1" border="1px solid" borderColor="gray.200" />
        </Flex>
      </Flex>
      <Box flex="4">
        <DoorLockKeypad onKey={handleKey} />
      </Box>
    </Flex>
  );
}
