import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import MainPage from "./pages/main";
import InfraBluePage from "./pages/manage/infraBlue";
import ManageMemberPage from "./pages/manage/member";
import DiscordRolePage from "./pages/manage/discord-role";
import IntegrateDiscordPage from "./pages/member/integrate-discord";
import FinancePage from "./pages/finance";
import GroupMatchingPage from "./pages/member/group-matching";
import GroupMatchingManagementPage from "./pages/manage/group-matching";
import GroupMatchingAnswersPage from "./pages/manage/group-matching-answers";
import GroupMatchingNewPage from "./pages/manage/group-matching-new";
import LoginPage from "./pages/login";
import BookListPage from "./pages/book";
import BookMyPage from "./pages/member/book/my";
import BookDetailPage from "./pages/book/detail";
import BookManagePage from "./pages/manage/book";
const BookScanPage = lazy(() => import("./pages/member/book/scan"));

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/">
        <Route index element={<MainPage />} />
        <Route
          path="/member/integrate-discord"
          element={<IntegrateDiscordPage />}
        />
        <Route path="/group-matching" element={<GroupMatchingPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/manage/infra-blue" element={<InfraBluePage />} />
        <Route path="/manage/member" element={<ManageMemberPage />} />
        <Route path="/manage/discord-role" element={<DiscordRolePage />} />
        <Route
          path="/manage/group-matching"
          element={<GroupMatchingManagementPage />}
        />
        <Route
          path="/manage/group-matching-answers"
          element={<GroupMatchingAnswersPage />}
        />
        <Route
          path="/manage/group-matching/new"
          element={<GroupMatchingNewPage />}
        />
        <Route path="/manage/book" element={<BookManagePage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/book" element={<BookListPage />} />
        <Route path="/book/my" element={<BookMyPage />} />
        <Route path="/book/:bookId" element={<BookDetailPage />} />
        <Route
          path="/book/scan"
          element={
            <Suspense fallback={null}>
              <BookScanPage />
            </Suspense>
          }
        />
      </Route>,
    ),
    {
      future: {
        v7_fetcherPersist: true,
        v7_normalizeFormMethod: true,
        v7_partialHydration: true,
        v7_relativeSplatPath: true,
        v7_skipActionErrorRevalidation: true,
      },
    },
  );

  return (
    <RouterProvider future={{ v7_startTransition: true }} router={router} />
  );
}

export default App;
