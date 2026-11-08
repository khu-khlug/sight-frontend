import { useState } from "react";
import { File } from "lucide-react";
import type { ChatAttachmentDto } from "../../../../../api/public/group/GroupChatApi";
import { draggableFileProps } from "../../../../../util/draggableFile";
import styles from "./style.module.css";

export default function MessageAttachment({ attachment }: { attachment: ChatAttachmentDto }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const isImage = attachment.contentType?.toLowerCase().startsWith("image/") === true;
  return (
    <a
      className={styles.messageAttachment}
      href={attachment.url}
      download={attachment.name}
      {...draggableFileProps({ url: attachment.url, name: attachment.name, size: attachment.size, contentType: attachment.contentType ?? "" })}
    >
      {isImage && failedUrl !== attachment.url && (
        <img
          className={styles.messageAttachmentImage}
          src={attachment.url}
          alt={attachment.name}
          draggable={false}
          onError={() => setFailedUrl(attachment.url)}
        />
      )}
      <span className={styles.messageAttachmentName}><File size={14} aria-hidden />{attachment.name}</span>
      {isImage && failedUrl === attachment.url && <span>이미지를 미리 볼 수 없습니다. 파일을 내려받아 확인해주세요.</span>}
    </a>
  );
}
