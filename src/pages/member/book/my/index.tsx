import MainLayout from "../../../../layouts/MainLayout";
import BookNavBar from "../../../../features/book/BookNavBar";
import BookMyBorrowingContainer from "../../../../features/book/BookMyBorrowingContainer";

export default function BookMyPage() {
  return (
    <MainLayout>
      <BookNavBar current="my" />
      <BookMyBorrowingContainer />
    </MainLayout>
  );
}
