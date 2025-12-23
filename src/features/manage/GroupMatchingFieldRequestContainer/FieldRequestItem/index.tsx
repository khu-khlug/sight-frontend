import Button from "../../../../components/Button";
import { GroupMatchingManageApiDto } from "../../../../api/manage/groupMatching";
import { DateFormats, formatDate } from "../../../../util/date";

import styles from "./style.module.css";

type Props = {
  request: GroupMatchingManageApiDto["GroupMatchingFieldRequestDto"];
  onApprove: (id: string, fieldName: string) => void;
  onReject: (id: string) => void;
};

export default function FieldRequestItem({
  request,
  onApprove,
  onReject,
}: Props) {
  const isPending = !request.approvedAt && !request.rejectedAt;
  const isApproved = !!request.approvedAt;
  const isRejected = !!request.rejectedAt;

  return (
    <div
      className={styles["container"]}
      data-status={
        isPending ? "pending" : isApproved ? "approved" : "rejected"
      }
    >
      <div className={styles["header"]}>
        <div className={styles["requester-info"]}>
          <span className={styles["name"]}>{request.requesterName}</span>
        </div>
        <div className={styles["status-badge"]}>
          {isPending && "대기"}
          {isApproved && "승인"}
          {isRejected && "거부"}
        </div>
      </div>

      <div className={styles["content"]}>
        <div className={styles["row"]}>
          <span className={styles["label"]}>분야 이름:</span>
          <span className={styles["field-name"]}>{request.fieldName}</span>
        </div>

        <div className={styles["row"]}>
          <span className={styles["label"]}>요청 사유:</span>
          <p className={styles["reason"]}>{request.requestReason}</p>
        </div>

        <div className={styles["row"]}>
          <span className={styles["label"]}>요청 일시:</span>
          <span>
            {formatDate(new Date(request.createdAt), DateFormats.DATE_KOR)}
          </span>
        </div>

        {isApproved && (
          <div className={styles["row"]}>
            <span className={styles["label"]}>승인 일시:</span>
            <span>
              {formatDate(
                new Date(request.approvedAt!),
                DateFormats.DATE_KOR
              )}
            </span>
          </div>
        )}

        {isRejected && (
          <>
            <div className={styles["row"]}>
              <span className={styles["label"]}>거부 일시:</span>
              <span>
                {formatDate(
                  new Date(request.rejectedAt!),
                  DateFormats.DATE_KOR
                )}
              </span>
            </div>
            <div className={styles["row"]}>
              <span className={styles["label"]}>거부 사유:</span>
              <p className={styles["reason"]}>{request.rejectReason}</p>
            </div>
          </>
        )}
      </div>

      {isPending && (
        <div className={styles["actions"]}>
          <Button onClick={() => onApprove(request.id, request.fieldName)}>
            승인
          </Button>
          <Button variant="neutral" onClick={() => onReject(request.id)}>
            거부
          </Button>
        </div>
      )}
    </div>
  );
}
