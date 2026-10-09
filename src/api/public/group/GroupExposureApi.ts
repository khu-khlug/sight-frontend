import apiV2Client from "../../client/v2";

export type OpenSeminarCohortDto = { id: string; year: number; isSummerSeason: boolean; isSpeakAfter: boolean; seminarDate: string };
export type ActivityReportDto = {
  id: string; seminarId: string; seminarDate: string; isSummerSeason: boolean; isSpeakAfter: boolean;
  isPresentation: boolean; reportFileUrl: string; fileName: string; createdAt: string;
};
export type ActivityReportUploadLinkDto = { url: string; fileUploadId: string };
export const GroupExposureApi = {
  async getActivityReportContext(groupId: number): Promise<OpenSeminarCohortDto | null> {
    return (await apiV2Client.get<OpenSeminarCohortDto | null>(`/groups/${groupId}/activity-report-context`)).data;
  },
  async listActivityReports(groupId: number): Promise<ActivityReportDto[]> {
    return (await apiV2Client.get<ActivityReportDto[]>(`/groups/${groupId}/activity-report`)).data;
  },
  async publishGroupPortfolio(groupId: number): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/portfolio`);
  },
  async cancelGroupPortfolio(groupId: number): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/portfolio`);
  },
  async issueActivityReportUploadLink(groupId: number, input: { fileName: string; contentType: string }): Promise<ActivityReportUploadLinkDto> {
    return (await apiV2Client.post<ActivityReportUploadLinkDto>(`/groups/${groupId}/activity-report/upload-link`, input)).data;
  },
  async uploadActivityReportFile(url: string, file: File): Promise<void> {
    const response = await fetch(url, { method: "PUT", body: file });
    if (!response.ok) throw new Error("파일 업로드에 실패했습니다.");
  },
  async submitActivityReport(groupId: number, input: { isPresentation: boolean; fileUploadId: string; seminarId: string }): Promise<void> {
    await apiV2Client.post(`/groups/${groupId}/activity-report`, input);
  },
  async updateActivityReport(groupId: number, reportId: string, input: { isPresentation?: boolean; fileUploadId?: string }): Promise<void> {
    await apiV2Client.patch(`/groups/${groupId}/activity-report/${encodeURIComponent(reportId)}`, input);
  },
  async cancelActivityReport(groupId: number, reportId: string): Promise<void> {
    await apiV2Client.delete(`/groups/${groupId}/activity-report/${encodeURIComponent(reportId)}`);
  },
};
