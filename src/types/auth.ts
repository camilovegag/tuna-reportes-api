export type AuthRegisterPostResponse = {
  id: string;
  message: string;
};

export type AuthLoginPostResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
};
