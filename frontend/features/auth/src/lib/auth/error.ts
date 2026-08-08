import { ProblemDetail } from "@next-feature/client";
import { AuthError, CredentialsSignin } from "next-auth";

export class ApiAuthError extends AuthError {
  kind = 'signIn'
  constructor(readonly body: ProblemDetail) {
    super(body.detail);
  }
}