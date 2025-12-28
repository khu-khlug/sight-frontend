import axios from "axios";

const legacyClient = axios.create({
  baseURL: "https://khlug.org",
  withCredentials: true,
});

export default legacyClient;
