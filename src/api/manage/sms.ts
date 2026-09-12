import apiV2Client from "../client/v2";

export type SenderPhoneResponse = { phone: string };

export type SendSmsRequest = {
  memberIds: number[];
  additionalPhoneNumbers: string[];
  message: string;
};

export type SmsMessageType = "SMS" | "LMS";
export type SmsMessageResultStatus = "SENT" | "FAILED" | "SKIPPED";

export type SmsMessageResult = {
  memberId: number | null;
  phone: string | null;
  type: SmsMessageType | null;
  status: SmsMessageResultStatus;
  message: string | null;
};

export type SendSmsResponse = { results: SmsMessageResult[] };

const getSenderPhone = async () => {
  const response = await apiV2Client.get<SenderPhoneResponse>(
    "/manager/sender-phone",
  );
  return response.data;
};

const updateSenderPhone = async (phone: string) => {
  await apiV2Client.put("/manager/sender-phone", { phone });
};

const sendSms = async (request: SendSmsRequest) => {
  const response = await apiV2Client.post<SendSmsResponse>(
    "/manager/sms-messages",
    request,
    { validateStatus: (status) => status === 200 || status === 422 },
  );
  return response.data;
};

export const SmsManageApi = { getSenderPhone, updateSenderPhone, sendSms };
