import { useCurrentTip } from "../../../hooks/main/useCurrentTip";
import { Spinner } from "@chakra-ui/react";
import Callout from "../../../components/Callout";

export default function TipCallout() {
  const { data, isLoading } = useCurrentTip();

  if (isLoading) {
    return (
      <Callout type="info">
        <Spinner size="sm" />
      </Callout>
    );
  }

  if (!data || !data.content) {
    return null;
  }

  return <Callout type="info">{data.content}</Callout>;
}
