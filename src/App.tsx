import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import InfraBluePage from "./pages/manage/infraBlue";
import MemberV2Page from "./pages/manage/member-v2";

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/">
        <Route path="/manage/infra-blue" element={<InfraBluePage />} />
        <Route path="/manage/member-v2" element={<MemberV2Page />} />
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
