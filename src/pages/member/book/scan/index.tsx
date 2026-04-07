import { useSearchParams } from "react-router-dom";
import MainLayout from "../../../../layouts/MainLayout";
import BookNavBar from "../../../../features/book/BookNavBar";
import BookBorrowScanContainer from "../../../../features/member/BookBorrowScanContainer";
import BookRegisterScanContainer from "../../../../features/manage/BookRegisterScanContainer";
import Callout from "../../../../components/Callout";
import { useIsManager } from "../../../../hooks/user/useIsManager";

export default function BookScanPage() {
  const [searchParams] = useSearchParams();
  const actionParam = searchParams.get("action");
  const preset = searchParams.get("preset") ?? undefined;
  const { isManager } = useIsManager();

  if (actionParam === "register") {
    return (
      <MainLayout>
        <BookNavBar />
        {isManager ? (
          <BookRegisterScanContainer />
        ) : (
          <Callout type="error">권한이 부족합니다.</Callout>
        )}
      </MainLayout>
    );
  } else {
    const action = actionParam === "return" ? "return" : "borrow";
    return (
      <MainLayout>
        <BookNavBar current={action} />
        <BookBorrowScanContainer action={action} presetBookId={preset} />
      </MainLayout>
    );
  }
}
