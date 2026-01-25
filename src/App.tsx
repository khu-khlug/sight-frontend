import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import MainPage from "./pages/main";
import InfraBluePage from "./pages/manage/infraBlue";
import MemberV2Page from "./pages/manage/member-v2";
import DiscordRolePage from "./pages/manage/discord-role";
import IntegrateDiscordPage from "./pages/member/integrate-discord";
import FinancePage from "./pages/finance";
import GroupMatchingPage from "./pages/member/group-matching";
import GroupMatchingManagementPage from "./pages/manage/group-matching";
import GroupMatchingAnswersPage from "./pages/manage/group-matching-answers";
import GroupMatchingFieldsPage from "./pages/manage/group-matching-fields";
import GroupMatchingFieldRequestsPage from "./pages/manage/group-matching-field-requests";
import LoginPage from "./pages/login";

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/">
        <Route index element={<MainPage />} />
        <Route
          path="/member/integrate-discord"
          element={<IntegrateDiscordPage />}
        />
        <Route
          path="/member/group-matching"
          element={<GroupMatchingPage />}
        />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/manage/infra-blue" element={<InfraBluePage />} />
        <Route path="/manage/member-v2" element={<MemberV2Page />} />
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
          path="/manage/group-matching-fields"
          element={<GroupMatchingFieldsPage />}
        />
        <Route
          path="/manage/group-matching-field-requests"
          element={<GroupMatchingFieldRequestsPage />}
        />
        <Route path="/finance" element={<FinancePage />} />
      </Route>
    ),
    {
      future: {
        v7_fetcherPersist: true,
        v7_normalizeFormMethod: true,
        v7_partialHydration: true,
        v7_relativeSplatPath: true,
        v7_skipActionErrorRevalidation: true,
      },
    }
  );

  return (
    <RouterProvider future={{ v7_startTransition: true }} router={router} />
  );
}

export default App;
