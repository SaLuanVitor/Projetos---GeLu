export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

export type AiAgentDescriptor = {
  key: string;
  name: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  codexFile: string;
};
