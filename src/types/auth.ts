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

export type AuthUserPayload = {
  userId: string;
  email: string;
  role: string;
  exp: number;
};
