import SmsManagementContainer from "../../../features/manage/SmsManagementContainer";
import SightLayout from "../../../layouts/SightLayout";
import Location from "../../../components/Location";

export default function SmsManagePage() {
  return (
    <SightLayout>
      <Location label="문자 발송" />
      <main>
        <SmsManagementContainer />
      </main>
    </SightLayout>
  );
}
