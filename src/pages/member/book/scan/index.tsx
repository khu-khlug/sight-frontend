import { useSearchParams } from "react-router-dom";
import MainLayout from "../../../../layouts/MainLayout";
import BookNavBar from "../../../../features/book/BookNavBar";
import BookBorrowScanContainer from "../../../../features/book/BookBorrowScanContainer";
import BookRegisterScanContainer from "../../../../features/book/BookRegisterScanContainer";

export default function BookScanPage() {
  const [searchParams] = useSearchParams();
  const actionParam = searchParams.get("action");
  const preset = searchParams.get("preset") ?? undefined;

  if (actionParam === "register") {
    return (
      <MainLayout>
        <BookNavBar />
        <BookRegisterScanContainer />
      </MainLayout>
    );
  }

  const action = actionParam === "return" ? "return" : "borrow";
  return (
    <MainLayout>
      <BookNavBar current={action} />
      <BookBorrowScanContainer action={action} presetBookId={preset} />
    </MainLayout>
  );
}
