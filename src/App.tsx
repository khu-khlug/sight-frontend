import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import InfraBluePage from "./pages/manage/infraBlue";
import MemberV2Page from "./pages/manage/member-v2";
import DiscordRolePage from "./pages/manage/discord-role";
import IntegrateDiscordPage from "./pages/member/integrate-discord";

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/">
        <Route
          path="/member/integrate-discord"
          element={<IntegrateDiscordPage />}
        />

        <Route path="/manage/infra-blue" element={<InfraBluePage />} />
        <Route path="/manage/member-v2" element={<MemberV2Page />} />
        <Route path="/manage/discord-role" element={<DiscordRolePage />} />
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
