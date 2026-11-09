import { Box, IconButton, Popover, Portal, ScrollArea, Tabs, Text } from "@chakra-ui/react";
import { Smile } from "lucide-react";
import { useState, WheelEvent } from "react";
import dataByGroup from "unicode-emoji-json/data-by-group.json";

import HoverScrollbar from "../HoverScrollbar";
import { useGuildEmojis } from "../../hooks/group/useGuildEmojis";
import { cn } from "../../util/cn";
import styles from "./style.module.css";

type UnicodeEmojiEntry = { emoji: string; name: string; slug: string };
type UnicodeEmojiGroup = { name: string; slug: string; emojis: UnicodeEmojiEntry[] };

const UNICODE_GROUPS = dataByGroup as UnicodeEmojiGroup[];

type Props = {
  // 실제 전송 API가 없어서, 선택한 이모지는 문자열(유니코드 문자 또는 디스코드 :코드: 표기)로만 넘긴다.
  onSelect: (text: string) => void;
  onClose: () => void;
  transparentWhenIdle?: boolean;
  showGuildEmojis?: boolean;
};

/*
 * 채팅 입력창의 이모지 버튼 — 누르면 팝오버가 뜨고, 첫 탭은 이 그룹의 길드(커스텀) 이모지,
 * 나머지 탭은 유니코드 표준 분류(Smileys & Emotion, People & Body, ...)별 기본 이모지다.
 * 브라우저 자체 폰트로 그리기로 했으므로(Twemoji 등 이미지 세트는 무거워서 안 씀) 유니코드
 * 이모지는 문자 그대로 넣는다.
 */
export default function EmojiPicker({ onSelect, onClose, transparentWhenIdle = false, showGuildEmojis = true }: Props) {
  const [open, setOpen] = useState(true);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const guildEmojisQuery = useGuildEmojis(showGuildEmojis);
  const guildEmojis = guildEmojisQuery.data ?? [];

  // 여러 개를 연달아 고를 수 있어야 하니, 하나 고른다고 팝오버를 닫지 않는다 — 밖을
  // 클릭하거나 트리거를 다시 눌러야 닫힌다(Popover 기본 동작).
  const handleSelect = (text: string) => {
    onSelect(text);
  };

  // 탭 목록이 세로가 아니라 가로로 스크롤되는 영역이라, 마우스 휠(세로 스크롤)을 그대로
  // scrollLeft로 돌려준다 — 안 그러면 Shift를 누르고 있어야만 가로로 스크롤된다.
  const handleTabListWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.currentTarget.scrollLeft += event.deltaY;
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open);
        if (!details.open) onClose();
      }}
      lazyMount
      unmountOnExit
      positioning={{ placement: "top-start" }}
    >
      <Popover.Trigger asChild>
        <IconButton size="xs" variant="ghost" aria-label="이모지" minW="28px" h="28px" p={0}
          onPointerEnter={() => setTriggerHovered(true)} onPointerLeave={() => setTriggerHovered(false)}>
          <Smile size={16} />
        </IconButton>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content className={cn(styles.content, transparentWhenIdle && styles.transparentWhenIdle, triggerHovered && styles.triggerHovered)}>
            <Tabs.Root defaultValue={showGuildEmojis ? "guild" : UNICODE_GROUPS[0].slug} className={styles.tabsRoot} fitted lazyMount unmountOnExit>
              <Box className={styles.tabListWrap} onWheel={handleTabListWheel}>
                <Tabs.List className={styles.tabList}>
                  {showGuildEmojis && <Tabs.Trigger value="guild" className={styles.tabTrigger} aria-label="길드 이모지">
                    <img src="/icon/favicon-96x96.png" alt="" width={18} height={18} />
                  </Tabs.Trigger>}
                  {UNICODE_GROUPS.map((group) => (
                    <Tabs.Trigger key={group.slug} value={group.slug} className={styles.tabTrigger}>
                      {group.emojis[0]?.emoji}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
              </Box>

              {showGuildEmojis && <Tabs.Content value="guild" className={styles.panel}>
                <ScrollArea.Root h="100%" size="xs" variant="hover">
                  <ScrollArea.Viewport h="100%">
                    <ScrollArea.Content className={styles.grid}>
                      {guildEmojisQuery.isLoading ? (
                        <Text fontSize="xs" color="gray.400" gridColumn="1 / -1">
                          불러오는 중...
                        </Text>
                      ) : guildEmojis.length === 0 ? (
                        <Text fontSize="xs" color="gray.400" gridColumn="1 / -1">
                          디스코드 이모지 없음
                        </Text>
                      ) : (
                        guildEmojis.map((emoji) => (
                          <Box
                            key={emoji.id}
                            as="button"
                            className={styles.emojiButton}
                            aria-label={emoji.name}
                            title={emoji.name}
                            onClick={() => handleSelect(`:${emoji.name}:`)}
                          >
                            <img src={emoji.imageUrl} alt="" width={22} height={22} />
                          </Box>
                        ))
                      )}
                    </ScrollArea.Content>
                  </ScrollArea.Viewport>
                  <HoverScrollbar />
                </ScrollArea.Root>
              </Tabs.Content>}

              {UNICODE_GROUPS.map((group) => (
                <Tabs.Content key={group.slug} value={group.slug} className={styles.panel}>
                  <ScrollArea.Root h="100%" size="xs" variant="hover">
                    <ScrollArea.Viewport h="100%">
                      <ScrollArea.Content className={styles.grid}>
                        {group.emojis.map((emoji) => (
                          <Box
                            key={emoji.slug}
                            as="button"
                            className={styles.emojiButton}
                            aria-label={emoji.name}
                            title={emoji.name}
                            onClick={() => handleSelect(emoji.emoji)}
                          >
                            {emoji.emoji}
                          </Box>
                        ))}
                      </ScrollArea.Content>
                    </ScrollArea.Viewport>
                    <HoverScrollbar />
                  </ScrollArea.Root>
                </Tabs.Content>
              ))}
            </Tabs.Root>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
