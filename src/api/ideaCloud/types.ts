// IdeaCloud Author
export type IdeaCloudAuthor = {
  id: number;
  realname: string;
};

// IdeaCloud Item
export type IdeaCloudItem = {
  id: number;
  content: string;
  author: IdeaCloudAuthor;
  createdAt: string;
};

// Request

export type CreateIdeaCloudRequest = {
  content: string;
};

export type DeleteIdeaCloudRequest = {
  ideaId: number;
};

// Response
export type ListIdeaCloudsResponse = {
  count: number;
  ideaClouds: IdeaCloudItem[];
};

export type CreateIdeaCloudResponse = {
  ideaCloud: IdeaCloudItem;
};

// Combined API DTO type
export type IdeaCloudApiDto = {
  IdeaCloudItem: IdeaCloudItem;
  IdeaCloudAuthor: IdeaCloudAuthor;
  ListIdeaCloudsResponse: ListIdeaCloudsResponse;
  CreateIdeaCloudRequest: CreateIdeaCloudRequest;
  CreateIdeaCloudResponse: CreateIdeaCloudResponse;
  DeleteIdeaCloudRequest: DeleteIdeaCloudRequest;
};
