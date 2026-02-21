import { useState } from "react";
import { Input } from "@chakra-ui/react";

type Props = {
  onSubmit: (content: string) => void;
  isLoading: boolean;
};

export default function IdeaCloudInput({ onSubmit, isLoading }: Props) {
  const [value, setValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim() && !isLoading) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  return (
    <Input
      placeholder="아이디어를 입력하세요..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={isLoading}
      size="sm"
      borderRadius="md"
      _focus={{ borderColor: "var(--main-color)" }}
    />
  );
}
