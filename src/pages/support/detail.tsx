import { Box, Center, Heading, Spinner, Text, Textarea, VStack } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../../components/Button";
import Callout from "../../components/Callout";
import Container from "../../components/Container";
import { supportRequestCategoryLabels } from "../../features/support/category";
import SupportRequestForm from "../../features/support/SupportRequestForm";
import {
  supportRequestKeys,
  useCreateSupportRequestComment,
  useDeleteSupportRequest,
  useSupportRequest,
  useUpdateSupportRequest,
} from "../../hooks/supportRequest/useSupportRequests";
import { useCurrentUser } from "../../hooks/user/useCurrentUser";
import MainLayout from "../../layouts/MainLayout";
import { extractErrorMessage } from "../../util/extractErrorMessage";

const formatDateTime = (value: string) => new Date(value).toLocaleString("ko-KR");

export default function SupportRequestDetailPage() {
  const { supportRequestId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState("");
  const [commentValidationError, setCommentValidationError] = useState<string | null>(null);
  const supportRequestQuery = useSupportRequest(supportRequestId);
  const currentUserQuery = useCurrentUser();
  const updateSupportRequest = useUpdateSupportRequest();
  const deleteSupportRequest = useDeleteSupportRequest();
  const createComment = useCreateSupportRequestComment();

  if (supportRequestQuery.isPending || currentUserQuery.isPending) {
    return <MainLayout><Center py={10}><Spinner size="xl" /></Center></MainLayout>;
  }

  if (supportRequestQuery.isError || !supportRequestQuery.data) {
    return (
      <MainLayout>
        <Container><Box as="main" py={6}><Callout type="error">지원 신청을 찾을 수 없거나 접근할 수 없습니다.</Callout><Box mt={4}><Link to="/support">지원 신청 목록으로 돌아가기</Link></Box></Box></Container>
      </MainLayout>
    );
  }

  const supportRequest = supportRequestQuery.data;
  const isOwner = currentUserQuery.data?.id === supportRequest.requester.userId;
  const isManager = currentUserQuery.data?.manager === true;
  const canEdit = isOwner && !supportRequest.hasComments;
  const canComment = isOwner || isManager;

  const update = (input: { category: typeof supportRequest.category; title: string; content: string }) => {
    updateSupportRequest.mutate(
      { supportRequestId, input },
      {
        onSuccess: async () => {
          setIsEditing(false);
          await queryClient.invalidateQueries({ queryKey: supportRequestKeys.detail(supportRequestId) });
          await queryClient.invalidateQueries({ queryKey: supportRequestKeys.all });
        },
        onError: async (error) => {
          if ((error as { response?: { status?: number } }).response?.status === 409) {
            await queryClient.invalidateQueries({ queryKey: supportRequestKeys.detail(supportRequestId) });
            setIsEditing(false);
          }
        },
      },
    );
  };

  const remove = () => {
    if (!window.confirm("지원 신청과 댓글이 함께 영구 삭제됩니다. 계속하시겠습니까?")) return;
    deleteSupportRequest.mutate(supportRequestId, {
      onSuccess: () => navigate("/support"),
    });
  };

  const submitComment = () => {
    if (!comment.trim()) {
      setCommentValidationError("댓글 내용을 입력하세요.");
      return;
    }
    setCommentValidationError(null);
    createComment.mutate(
      { supportRequestId, content: comment },
      { onSuccess: () => setComment("") },
    );
  };

  return (
    <MainLayout>
      <Container>
        <Box as="main" py={6} maxW="896px">
          <Box mb={4}><Link to="/support">← 지원 신청 목록</Link></Box>
          {isEditing ? (
            <>
              <Heading size="xl" mb={5}>지원 신청 수정</Heading>
              <SupportRequestForm
                initialValue={{ category: supportRequest.category, title: supportRequest.title, content: supportRequest.content }}
                submitLabel="수정"
                isSubmitting={updateSupportRequest.isPending}
                error={updateSupportRequest.isError ? extractErrorMessage(updateSupportRequest.error) : null}
                onSubmit={update}
                onCancel={() => setIsEditing(false)}
              />
            </>
          ) : (
            <>
              <Box display="flex" justifyContent="space-between" gap={3} flexWrap="wrap" mb={5}>
                <Box>
                  <Text fontWeight="bold" color="blue.600">{supportRequestCategoryLabels[supportRequest.category]}</Text>
                  <Heading size="xl" mt={1}>{supportRequest.title}</Heading>
                  <Text mt={2} color="gray.600">신청자 {supportRequest.requester.name} · {formatDateTime(supportRequest.createdAt)}</Text>
                </Box>
                <Box display="flex" gap={2} alignItems="start">
                  {canEdit && <Button variant="neutral" onClick={() => setIsEditing(true)}>수정</Button>}
                  {isManager && <Button variant="danger" disabled={deleteSupportRequest.isPending} onClick={remove}>삭제</Button>}
                </Box>
              </Box>
              {isOwner && supportRequest.hasComments && <Callout type="info">첫 댓글이 등록되어 지원 신청을 수정할 수 없습니다. 추가 내용은 댓글로 남겨주세요.</Callout>}
              {deleteSupportRequest.isError && <Box mt={3}><Callout type="error">{extractErrorMessage(deleteSupportRequest.error)}</Callout></Box>}
              <Text mt={5} whiteSpace="pre-wrap">{supportRequest.content}</Text>
            </>
          )}

          {!isEditing && (
            <Box mt={10}>
              <Heading size="lg" mb={4}>댓글</Heading>
              <VStack align="stretch" gap={3}>
                {supportRequest.comments.length === 0 && <Text color="gray.600">등록된 댓글이 없습니다.</Text>}
                {supportRequest.comments.map((item) => (
                  <Box key={item.id} borderWidth="1px" borderRadius="md" p={4} bg="white">
                    <Text whiteSpace="pre-wrap">{item.content}</Text>
                    <Text mt={3} fontSize="sm" color="gray.600">{item.author.name} · {formatDateTime(item.createdAt)}</Text>
                  </Box>
                ))}
              </VStack>

              {canComment && (
                <Box mt={6}>
                  <label htmlFor="support-comment">댓글 작성</label>
                  <Textarea
                    id="support-comment"
                    mt={1}
                    rows={5}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    disabled={createComment.isPending}
                  />
                  {(commentValidationError || createComment.isError) && <Box mt={2}><Callout type="error">{commentValidationError ?? (createComment.error ? extractErrorMessage(createComment.error) : "댓글 등록에 실패했습니다.")}</Callout></Box>}
                  <Box mt={3} display="flex" justifyContent="flex-end"><Button disabled={createComment.isPending} onClick={submitComment}>댓글 등록</Button></Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Container>
    </MainLayout>
  );
}
