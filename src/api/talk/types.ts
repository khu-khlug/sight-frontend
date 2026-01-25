// Talk Author
export type TalkAuthor = {
  id: number;
  realname: string;
};

// Talk
export type Talk = {
  id: number;
  title: string;
  author: TalkAuthor;
  createdAt: string;
};

// Request
export type ListTalksRequest = {
  offset?: number;
  limit?: number;
};

// Response
export type ListTalksResponse = {
  count: number;
  talks: Talk[];
};

// Combined API DTO type
export type TalkApiDto = {
  Talk: Talk;
  TalkAuthor: TalkAuthor;
  ListTalksRequest: ListTalksRequest;
  ListTalksResponse: ListTalksResponse;
};
