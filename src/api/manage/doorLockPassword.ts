import apiV2Client from "../client/v2";

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
  const response = await apiV2Client.get<GetDoorLockPasswordResponseDto>(
    "/manager/door-lock-password"
  );
  return response.data;
};

export const updateDoorLockPassword = async (
  request: UpdateDoorLockPasswordRequestDto
) => {
  const response = await apiV2Client.put<GetDoorLockPasswordResponseDto>(
    "/manager/door-lock-password",
    request
  );
  return response.data;
};
