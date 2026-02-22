import { useState } from "react";
import { Box, Text, Spinner } from "@chakra-ui/react";
import Container from "../../../components/Container";
import IdeaCloudItem from "./IdeaCloudItem";
import IdeaCloudInput from "./IdeaCloudInput";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { useIdeaClouds } from "../../../hooks/ideaCloud/useIdeaClouds";
import { useCreateIdeaCloud } from "../../../hooks/ideaCloud/useCreateIdeaCloud";
import { useDeleteIdeaCloud } from "../../../hooks/ideaCloud/useDeleteIdeaCloud";
import { useIsManager } from "../../../hooks/user/useIsManager";

export default function IdeaCloud() {
  const { data, isLoading } = useIdeaClouds();
  const { isManager } = useIsManager();
  const createMutation = useCreateIdeaCloud();
  const deleteMutation = useDeleteIdeaCloud();

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const handleSubmit = (content: string) => {
    createMutation.mutate({ content });
  };

  const handleDeleteClick = (id: number) => {
    setDeleteTargetId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId !== null) {
      deleteMutation.mutate(deleteTargetId, {
        onSuccess: () => {
          setDeleteTargetId(null);
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTargetId(null);
  };

  return (
    <Container>
      <Text fontSize="xl" fontWeight="bold" marginBottom="8px">
        아이디어 클라우드
      </Text>

      <Box marginBottom="12px">
        <Text fontSize="sm" color="gray.600" marginBottom="4px">
          괜찮긴 한데 당장 내가 하긴 좀 그런 아이디어를 적어주세요.
        </Text>
        <Text fontSize="sm" color="gray.600">
          누구든 아이디어를 가져가서 실현해볼 수 있습니다.
        </Text>
      </Box>

      <Box marginBottom="16px">
        <IdeaCloudInput
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
        />
      </Box>

      {isLoading && (
        <Box display="flex" justifyContent="center" padding="40px">
          <Spinner size="lg" color="var(--main-color)" />
        </Box>
      )}

      {!isLoading && data && data.count > 0 && (
        <Box display="flex" flexDirection="column" marginBottom="12px">
          {data.ideaClouds.map((ideaCloud) => (
            <IdeaCloudItem
              key={ideaCloud.id}
              ideaCloud={ideaCloud}
              isManager={isManager}
              onDelete={handleDeleteClick}
            />
          ))}
        </Box>
      )}

      {!isLoading && data && data.count > 0 && (
        <Text fontSize="sm" color="gray.400">
          💡 만들어진 아이디어를 누르면 그룹을 만들 수 있어요.
        </Text>
      )}

      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </Container>
  );
}
