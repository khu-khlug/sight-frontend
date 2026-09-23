import { useEffect, useState } from "react";
import dayjs from "dayjs";
import MainLayout from "../../../layouts/MainLayout";
import ScheduleContainer from "../../../features/member/ScheduleContainer/ScheduleContainer";
import ScheduleForm from "../../../features/member/ScheduleContainer/ScheduleForm";
import styles from "./style.module.css";

export default function SchedulePage() {
  const [formMounted, setFormMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [anchorDate, setAnchorDate] = useState(dayjs().format("YYYY-MM-DD"));

  useEffect(() => {
    if (pendingOpen) {
      const id = requestAnimationFrame(() => {
        setShowForm(true);
        setPendingOpen(false);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [pendingOpen]);

  const handleToggleForm = () => {
    if (showForm) {
      setShowForm(false);
    } else {
      setFormMounted(true);
      setPendingOpen(true);
    }
  };

  return (
    <MainLayout>
      <main className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>일정</h1>
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleToggleForm}
          >
            {showForm ? "✕ 닫기" : "+ 일정 예약"}
          </button>
        </div>
        {formMounted && (
          <div
            className={`${styles.formWrapper} ${showForm ? styles.formWrapperOpen : ""}`}
            onTransitionEnd={(e) => {
              if (e.propertyName === "grid-template-rows" && !showForm) {
                setFormMounted(false);
              }
            }}
          >
            <div className={styles.formWrapperInner}>
              <ScheduleForm
                anchorDate={anchorDate}
                onDateChange={setAnchorDate}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        )}
        <ScheduleContainer
          anchorDate={anchorDate}
          onAnchorDateChange={setAnchorDate}
        />
      </main>
    </MainLayout>
  );
}
