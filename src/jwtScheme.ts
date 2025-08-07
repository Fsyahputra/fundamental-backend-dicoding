import autoBind from "auto-bind";
import { UnauthorizedError } from "./exception.js";
import type { IAuthenticationService } from "./types/auth.js";
import type { Request as R, ResponseToolkit as H, Lifecycle as Lf, ServerAuthSchemeObject } from "@hapi/hapi";

class JwtAuthScheme {
  private authService: IAuthenticationService;

  constructor(authService: IAuthenticationService) {
    this.authService = authService;
    autoBind(this);
  }

  private findTokenFromRequest(r: R): string {
    const authHeader = r.headers["authorization"];
    if (!authHeader) {
      throw new UnauthorizedError("Authorization header is missing");
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new UnauthorizedError("Invalid authorization header format");
    }
    return parts[1];
  }

  private async verifyToken(r: R, h: H): Promise<Lf.ReturnValue> {
    const token = this.findTokenFromRequest(r);
    const credentials = await this.authService.verifyAccessToken(token);
    r.auth.credentials = { user: credentials };
    return h.continue;
  }

  public getAuthScheme(): ServerAuthSchemeObject {
    return {
      authenticate: this.verifyToken,
    };
  }
}

export default JwtAuthScheme;
