import apiClient from "../client";

export type GetDoorLockPasswordResponseDto = {
  master: string;
  forJajudy: string;
  forFacilityTeam: string;
};

export type UpdateDoorLockPasswordRequestDto = {
  master: string;
  forJajudy: string;
  forFacilityTeam: string;
};

export const getDoorLockPassword = async () => {
  const response = await apiClient.get<GetDoorLockPasswordResponseDto>(
    "/manager/door-lock-password"
  );
  return response.data;
};

export const updateDoorLockPassword = async (
  request: UpdateDoorLockPasswordRequestDto
) => {
  const response = await apiClient.put<GetDoorLockPasswordResponseDto>(
    "/manager/door-lock-password",
    request
  );
  return response.data;
};
