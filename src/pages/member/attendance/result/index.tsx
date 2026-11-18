import { Navigate, useParams, useSearchParams } from "react-router-dom";
import SimpleLogoLayout from "../../../../layouts/SimpleLogoLayout";
import AttendanceResult from "../../../../features/member/AttendanceContainer/AttendanceResult";

export default function AttendanceResultPage() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  if (!scheduleId || code === null) return <Navigate to="/attendance" replace />;

  return (
    <SimpleLogoLayout>
      <AttendanceResult scheduleId={scheduleId} code={code} />
    </SimpleLogoLayout>
  );
}
