import { useDamsoPosts } from "../../../hooks/main/useDamsoPosts";
import { Box, Text, Spinner } from "@chakra-ui/react";
import Container from "../../../components/Container";
import PostItem from "./PostItem";

export default function RecentDamsoPosts() {
  const { data, isLoading } = useDamsoPosts(5);

  return (
    <Container>
      <Text fontSize="xl" fontWeight="bold" marginBottom="16px">
        최근 담소
      </Text>

      {isLoading && (
        <Box display="flex" justifyContent="center" padding="40px">
          <Spinner size="lg" color="var(--main-color)" />
        </Box>
      )}

      {!isLoading && data && data.count === 0 && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          padding="40px"
        >
          <Text color="gray.500">최근 게시글이 없습니다.</Text>
        </Box>
      )}

      {!isLoading && data && data.count > 0 && (
        <Box display="flex" flexDirection="column">
          {data.posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </Box>
      )}
    </Container>
  );
}
