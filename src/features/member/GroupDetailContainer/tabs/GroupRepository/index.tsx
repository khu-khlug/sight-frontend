import ContentSkeleton from "../../../../../components/ContentSkeleton";
import { Box, Button, ScrollArea, Text } from "@chakra-ui/react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { RefObject } from "react";

import { GroupRepositoryApi } from "../../../../../api/public/group/GroupRepositoryApi";
import { RepoCommit } from "../../../../../api/public/group/GroupRepositoryApi";
import AppTooltip from "../../../../../components/AppTooltip";
import SimpleIcon from "../../../../../components/SimpleIcon";
import HoverScrollbar from "../../../../../components/HoverScrollbar";
import { useRepoBranches } from "../../../../../hooks/repo/useRepoBranches";
import { useRepoBranchSource } from "../../../../../hooks/repo/useRepoBranchSource";
import { useRepoCommits } from "../../../../../hooks/repo/useRepoCommits";
import { useRepoTree } from "../../../../../hooks/repo/useRepoTree";
import type { FileWindowContent } from "../../FileWindow/types";
import RepositorySelect from "./RepositorySelect";
import RepositoryTree from "./RepositoryTree";
import type { RepositoryScrollMetrics } from "./RepositoryTree";
import type { FileTreeNode } from "./buildFileTree";
import styles from "./style.module.css";

export type { RepositoryScrollMetrics } from "./RepositoryTree";

type Props = {
  repositoryUrls: string[];
  viewportRef: RefObject<HTMLDivElement>;
  viewportId: string;
  onScrollMetricsChange: (metrics: RepositoryScrollMetrics) => void;
  onOpenFile: (content: FileWindowContent) => void;
};

// GitRepoBadge와 같은 방식 — 호스트 뒤 경로("사용자명/레포명")만 엔드포인트로 보여준다.
function repoEndpoint(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\/+|\/+$/g, "");
  } catch {
    return url;
  }
}

// 아이콘 + 엔드포인트 — 드롭다운 안의 각 항목과, 저장소가 하나뿐일 때의 고정 표시에 같이 쓴다.
function RepoLabel({ url }: { url: string }) {
  return (
    <Box as="span" display="flex" alignItems="center" gap="6px" minW={0} maxW="100%">
      <SimpleIcon slug="github" size={16} />
      <Text as="span" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
        {repoEndpoint(url)}
      </Text>
    </Box>
  );
}

function CommitText({ commit, fallbackSha, showSha = true }: { commit?: RepoCommit; fallbackSha: string; showSha?: boolean }) {
  const shortSha = (commit?.sha ?? fallbackSha).slice(0, 7);
  const message = commit ? commit.message || "(메시지 없음)" : "HEAD";

  return (
    <span className={styles.commitRow}>
      {showSha && <span className={styles.commitSha}>{shortSha}</span>}
      <span className={styles.commitClip}>
        <span className={styles.commitText}>{message}</span>
      </span>
    </span>
  );
}

function commitLabel(commit: RepoCommit | undefined, fallbackSha: string): string {
  return `${(commit?.sha ?? fallbackSha).slice(0, 7)} ${commit?.message || (commit ? "(메시지 없음)" : "HEAD")}`;
}

/*
 * 저장소가 여러 개면 위쪽 드롭다운으로 고르고, 하나뿐이면 그걸로 고정(드롭다운 없음).
 * 지정된(깃허브) 저장소가 하나도 없으면 안내 문구만 보여준다. 선택된 저장소는 드롭다운
 * 자체(또는 고정 표시)로 이미 보이므로 따로 다시 적지 않는다.
 * 그 아래에 파일 트리를 보여준다 — 접근 불가/에러면 안내 문구, 정상이면 트리 박스.
 */
export default function GroupRepository({
  repositoryUrls,
  viewportRef,
  viewportId,
  onScrollMetricsChange,
  onOpenFile,
}: Props) {
  const queryClient = useQueryClient();
  const githubRepos = repositoryUrls;
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [revision, setRevision] = useState<{
    url: string;
    branch: string;
    commitSha: string | null;
  } | null>(null);
  const activeUrl =
    selectedUrl && githubRepos.includes(selectedUrl) ? selectedUrl : (githubRepos[0] ?? null);

  const branchesQuery = useRepoBranches(activeUrl);
  const branches = branchesQuery.data ?? [];
  const defaultBranch = branches.find((branch) => branch.isDefault) ?? branches[0];
  const activeBranch =
    (revision?.url === activeUrl && branches.find((branch) => branch.name === revision.branch)) ||
    defaultBranch;
  const activeCommitSha = activeBranch
    ? revision?.url === activeUrl && revision.branch === activeBranch.name && revision.commitSha
      ? revision.commitSha
      : activeBranch.headSha
    : null;
  const sourceQuery = useRepoBranchSource(activeUrl, activeBranch ?? null, branches);
  const sourceLookupPending = Boolean(activeBranch && !activeBranch.isDefault && branches.length > 1 && sourceQuery.isPending);
  const baseBranch = sourceLookupPending
    ? null
    : activeBranch?.isDefault
      ? defaultBranch
      : sourceQuery.data ?? defaultBranch;
  const commitsQuery = useRepoCommits(activeUrl, activeBranch ?? null, baseBranch ?? null);
  const commits = useMemo(
    () =>
      (commitsQuery.data?.pages.flatMap((page) => page.items) ?? []).sort(
        (a, b) => a.isForkPoint ? 1 : b.isForkPoint ? -1 : Date.parse(b.committedAt) - Date.parse(a.committedAt),
      ),
    [commitsQuery.data],
  );
  const commitsBySha = useMemo(() => new Map(commits.map((commit) => [commit.sha, commit])), [commits]);
  const selectedCommit = activeCommitSha ? commitsBySha.get(activeCommitSha) : undefined;
  const treeQuery = useRepoTree(activeUrl, activeCommitSha);
  const isFetching = branchesQuery.isFetching || sourceQuery.isFetching || commitsQuery.isFetching || treeQuery.isFetching;

  async function refreshRepository() {
    if (!activeUrl || isRefreshing || isFetching) return;
    setIsRefreshing(true);
    setRefreshError(false);
    try {
      await GroupRepositoryApi.refreshRepository(activeUrl);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[1] === activeUrl &&
          ["repo-branches", "repo-branch-source", "repo-commits", "repo-tree"].includes(String(query.queryKey[0])),
        refetchType: "active",
      }, { throwOnError: true });
    } catch {
      setRefreshError(true);
    } finally {
      setIsRefreshing(false);
    }
  }

  const repoItems = githubRepos.map((url) => ({ label: url, value: url }));
  const branchItems = branches.map((branch) => ({ label: branch.name, value: branch.name }));
  const commitItems = commits.map((commit) => ({
    label: `${commit.sha.slice(0, 7)} ${commit.message}`,
    value: commit.sha,
  }));

  return (
    <Box className={styles.container}>
      <Box display="flex" alignItems="center" gap="6px" mb={2}>
        <Text fontSize="sm" color="gray.500">
          지원하는 저장소:
        </Text>
        <SimpleIcon slug="github" size={18} />
      </Box>
      <div className={styles.refreshNotice}>
        <Text fontSize="xs" color="gray.500">
          잦은 새로고침은 저장소 API 요청 한도를 초과할 수 있습니다.
        </Text>
      </div>
      {refreshError && <Text fontSize="xs" color="red.500" mb={2}>새로고침에 실패했습니다.</Text>}

      {githubRepos.length === 0 || !activeUrl ? (
        <Text fontSize="sm" color="gray.500">
          지정된 저장소가 없습니다.
        </Text>
      ) : (
        <>
          <div className={styles.repoSelectorRow}>
            <div className={styles.repoSelector}>
              {githubRepos.length === 1 ? (
                <AppTooltip content={activeUrl}>
                  <span className={styles.tooltipTarget}><RepoLabel url={activeUrl} /></span>
                </AppTooltip>
              ) : (
                <RepositorySelect
                  items={repoItems}
                  value={activeUrl}
                  onChange={setSelectedUrl}
                  fullWidth
                  renderValue={
                    <AppTooltip content={activeUrl}>
                      <span className={styles.tooltipTarget}><RepoLabel url={activeUrl} /></span>
                    </AppTooltip>
                  }
                  renderItem={(item) => (
                    <AppTooltip content={item.value}>
                      <span className={styles.tooltipTarget}><RepoLabel url={item.value} /></span>
                    </AppTooltip>
                  )}
                />
              )}
            </div>
            <Button
              size="xs"
              variant="outline"
              aria-label="저장소 새로고침"
              disabled={isRefreshing || isFetching}
              onClick={() => void refreshRepository()}
            >
              <RefreshCw size={13} />
            </Button>
          </div>

          {branchesQuery.isLoading ? (
            <ContentSkeleton />
          ) : branchesQuery.isError ? (
            <Text fontSize="sm" color="gray.500" mt={4}>
              저장소에 접근할 수 없습니다.
            </Text>
          ) : !activeBranch ? (
            <Text fontSize="sm" color="gray.500" mt={4}>브랜치가 없습니다.</Text>
          ) : (
            <>
              <div className={styles.revisionControls}>
                <RepositorySelect
                  items={branchItems}
                  value={activeBranch.name}
                  onChange={(branch) => setRevision({ url: activeUrl, branch, commitSha: null })}
                  triggerClassName={styles.revisionTrigger}
                  valueClassName={styles.branchValue}
                  menuClassName={styles.branchMenu}
                  scrollable
                  renderValue={
                    <AppTooltip content={activeBranch.name}>
                      <span className={styles.branchValue}>{activeBranch.name}</span>
                    </AppTooltip>
                  }
                  renderItem={(item) => (
                    <AppTooltip content={item.label}>
                      <span className={styles.branchValue}>{item.label}</span>
                    </AppTooltip>
                  )}
                />
                <RepositorySelect
                  items={commitItems}
                  value={activeCommitSha ?? ""}
                  onChange={(commitSha) => setRevision({ url: activeUrl, branch: activeBranch.name, commitSha })}
                  triggerClassName={styles.revisionTrigger}
                  valueClassName={styles.commitValue}
                  menuClassName={styles.commitMenu}
                  itemClassName={styles.commitOption}
                  scrollable
                  disabled={sourceLookupPending || commitsQuery.isLoading || (commitsQuery.isError && commits.length === 0)}
                  onMenuScroll={(event) => {
                    const menu = event.currentTarget;
                    if (
                      menu.scrollTop + menu.clientHeight >= menu.scrollHeight - 32 &&
                      commitsQuery.hasNextPage &&
                      !commitsQuery.isFetchingNextPage
                    ) {
                      void commitsQuery.fetchNextPage();
                    }
                  }}
                  renderValue={
                    <AppTooltip content={commitLabel(selectedCommit, activeCommitSha ?? "")}>
                      <span className={styles.tooltipTarget}>
                        <CommitText commit={selectedCommit} fallbackSha={activeCommitSha ?? ""} showSha={false} />
                      </span>
                    </AppTooltip>
                  }
                  renderItem={(item) => (
                    <AppTooltip content={commitLabel(commitsBySha.get(item.value), item.value)}>
                      <span className={styles.tooltipTarget}>
                        <CommitText commit={commitsBySha.get(item.value)} fallbackSha={item.value} />
                      </span>
                    </AppTooltip>
                  )}
                  footer={
                    <>
                      {commitsQuery.isFetchingNextPage && (
                        <ContentSkeleton />
                      )}
                      {commitsQuery.isFetchNextPageError && (
                        <Text fontSize="xs" px={2} py={1} color="gray.500">이전 커밋을 불러올 수 없습니다.</Text>
                      )}
                      <div className={styles.commitSource} role="note">
                        {activeBranch.isDefault
                          ? "기본 브랜치"
                          : sourceLookupPending
                            ? "분기 기준 확인 중..."
                            : sourceQuery.data
                              ? `${sourceQuery.data.name}에서 분기됨`
                              : "분기 기준 확인 불가"}
                      </div>
                    </>
                  }
                />
              </div>
              {commitsQuery.isError && commits.length === 0 && (
                <Text fontSize="xs" color="gray.500" mt={2}>
                  커밋 목록을 불러올 수 없습니다. 브랜치 HEAD의 파일을 표시합니다.
                </Text>
              )}
              {treeQuery.isLoading ? (
                <ContentSkeleton />
              ) : treeQuery.isError ? (
                <Text fontSize="sm" color="gray.500" mt={4}>
                  파일 트리를 불러올 수 없습니다.
                </Text>
              ) : treeQuery.data ? (
                <ScrollArea.Root className={styles.treeScrollArea} size="sm" variant="hover">
                  <ScrollArea.Viewport h="100%" style={{ overflowX: "hidden" }}>
                    <ScrollArea.Content className={styles.treeScrollContent} w="100%" style={{ minWidth: 0 }}>
                      <RepositoryTree
                        key={`${activeUrl}:${activeCommitSha}`}
                        entries={treeQuery.data}
                        viewportRef={viewportRef}
                        viewportId={viewportId}
                        onScrollMetricsChange={onScrollMetricsChange}
                        onFileClick={(node: FileTreeNode) => {
                          if (!node.rawUrl) return;
                          onOpenFile({ source: "repository", fileName: node.name, fileUrl: node.rawUrl, path: node.path, repositoryUrl: activeUrl });
                        }}
                      />
                    </ScrollArea.Content>
                  </ScrollArea.Viewport>
                  <HoverScrollbar />
                </ScrollArea.Root>
              ) : null}
            </>
          )}
        </>
      )}
    </Box>
  );
}
