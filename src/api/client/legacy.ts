import axios from "axios";

export const LEGACY_SITE_URL = "https://khlug.org";

const legacyClient = axios.create({
  baseURL: LEGACY_SITE_URL,
  withCredentials: true,
});

export default legacyClient;

export const getLegacyGroupCreateUrl = (ideaId: number) =>
  `${LEGACY_SITE_URL}/group/create?idea=${ideaId}`;
