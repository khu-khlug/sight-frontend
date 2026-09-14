import { isAxiosError } from "axios";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import CenterRingLoadingIndicator from "../RingLoadingIndicator/center";
import { useCurrentUser } from "../../hooks/user/useCurrentUser";
import Callout from "../Callout";
import Container from "../Container";
import { extractErrorMessage } from "../../util/extractErrorMessage";

export default function RequireLogin() {
  const location = useLocation();
  const { status, error } = useCurrentUser();

  if (status === "pending") {
    return <CenterRingLoadingIndicator />;
  }

  if (status === "error") {
    if (isAxiosError(error) && error.response?.status === 401) {
      const redirectPath = `${location.pathname}${location.search}${location.hash}`;
      const searchParams = new URLSearchParams({ redirect: redirectPath });

      return <Navigate to={`/login?${searchParams.toString()}`} replace />;
    }

    return (
      <Container>
        <Callout type="error">{extractErrorMessage(error)}</Callout>
      </Container>
    );
  }

  return <Outlet />;
}
