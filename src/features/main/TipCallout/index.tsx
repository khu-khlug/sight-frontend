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

  const calloutType = data.type === "WARNING" ? "warning" : "info";

  return <Callout type={calloutType}>{data.content}</Callout>;
}
