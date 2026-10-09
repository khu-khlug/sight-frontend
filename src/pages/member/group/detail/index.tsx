import { Text } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import GroupDetailContainer from "../../../../features/member/GroupDetailContainer";
import WideLayout from "../../../../layouts/WideLayout";

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const id = Number(groupId);
  return (
    <WideLayout backgroundColor="white" navPaddingY={12}>
      {Number.isInteger(id) && id > 0
        ? <GroupDetailContainer key={id} groupId={id} />
        : <Text p={6}>올바른 그룹 주소가 아닙니다.</Text>}
    </WideLayout>
  );
}
