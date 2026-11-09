import { Text } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import GroupDetailContainer from "../../../../features/member/GroupDetailContainer";
import WideLayout from "../../../../layouts/WideLayout";
import { isIntegerId } from "../../../../util/integerId";

export default function GroupDetailPage() {
  const { groupId } = useParams();
  return (
    <WideLayout backgroundColor="white" navPaddingY={12}>
      {isIntegerId(groupId)
        ? <GroupDetailContainer key={groupId} groupId={groupId} />
        : <Text p={6}>올바른 그룹 주소가 아닙니다.</Text>}
    </WideLayout>
  );
}
