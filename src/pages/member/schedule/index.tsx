import { useState } from "react";
import dayjs from "dayjs";
import SightLayout from "../../../layouts/SightLayout";
import ScheduleContainer from "../../../features/member/ScheduleContainer/ScheduleContainer";
import ScheduleForm from "../../../features/member/ScheduleContainer/ScheduleForm";
import styles from "./style.module.css";

export default function SchedulePage() {
  const [showForm, setShowForm] = useState(false);
  const [anchorDate, setAnchorDate] = useState(dayjs().format("YYYY-MM-DD"));

  return (
    <SightLayout>
      <main className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>일정</h1>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "✕ 닫기" : "+ 일정 예약"}
          </button>
        </div>
        {showForm && (
          <ScheduleForm
            anchorDate={anchorDate}
            onDateChange={setAnchorDate}
            onClose={() => setShowForm(false)}
          />
        )}
        <ScheduleContainer
          anchorDate={anchorDate}
          onAnchorDateChange={setAnchorDate}
        />
      </main>
    </SightLayout>
  );
}
