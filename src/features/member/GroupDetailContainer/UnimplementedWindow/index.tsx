import { Box, Text } from "@chakra-ui/react";

import Window from "../Window";
import { DualWindowActions, SingleWindowActions } from "../Window/HeaderActions";
import { WindowBinding } from "../WindowLayer";
import { sideForRole } from "../actions";

type Props = {
  binding: WindowBinding;
  // 해시 문법(§9.1)이 예약해둔 창 종류 표시("git", "edit" 등) — 아직 렌더링할 구현이 없다.
  type: string;
};

// §11에서 "이번 범위 아님"이라고 예약해둔 창 종류(기록 쓰기·파일 보기 전 git 트리 등)를
// URL로 직접 열었을 때 아무것도 안 보이거나 "존재하지 않는 카드"로 오판되지 않도록, 아직
// 구현 중이라는 것만 알리는 자리 표시 창이다.
export default function UnimplementedWindow({ binding, type }: Props) {
  const { role, minimized, isClosing, canGoDual, onToggleMinimize, onClose, onSwitchSide, onExpand, onSendToSide } = binding;
  const isDualLayer = role !== "single";
  const handleRequestClose = () => {
    onClose();
  };

  const middleActions = !isDualLayer
    ? <SingleWindowActions canGoDual={canGoDual} onSendToSide={onSendToSide} />
    : <DualWindowActions side={sideForRole(role === "main" ? "main" : "sub")} otherSideEmpty={binding.otherSideEmpty} onExpand={onExpand} onSwitchSide={onSwitchSide} />;

  return (
    <Window
      isSub={role === "sub"}
      minimized={minimized}
      onToggleMinimize={onToggleMinimize}
      isClosing={isClosing}
      onRequestClose={handleRequestClose}
      middleActions={middleActions}
      headerLeft={<Text fontWeight="semibold" pl="10px">구현 중: {type}</Text>}
    >
      <Box display="flex" alignItems="center" justifyContent="center" h="100%" color="gray.500">
        이 창 종류는 아직 구현되지 않았습니다.
      </Box>
    </Window>
  );
}
