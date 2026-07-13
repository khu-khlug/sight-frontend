import MainLayout from "../../../layouts/MainLayout";
import AttendanceManageContainer from "../../../features/manage/AttendanceManageContainer";
import Callout from "../../../components/Callout";
import { useIsManager } from "../../../hooks/user/useIsManager";

export default function ManageAttendancePage() {
  const { isManager } = useIsManager();

  return (
    <MainLayout>
      {isManager ? (
        <AttendanceManageContainer />
      ) : (
        <Callout type="error">권한이 부족합니다.</Callout>
      )}
    </MainLayout>
  );
}
