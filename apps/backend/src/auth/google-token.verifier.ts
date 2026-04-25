import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client, type TokenPayload } from "google-auth-library";

@Injectable()
export class GoogleTokenVerifier {
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  constructor(private readonly config: ConfigService) {
    this.clientId = this.config.get<string>("GOOGLE_CLIENT_ID") ?? "";
    if (!this.clientId) {
      // eslint-disable-next-line no-console
      console.warn(
        "[auth] GOOGLE_CLIENT_ID is not set — Google sign-in will reject every request until it's configured.",
      );
    }
    this.client = new OAuth2Client(this.clientId);
  }

  async verify(idToken: string): Promise<TokenPayload> {
    if (!this.clientId) {
      throw new UnauthorizedException("Google sign-in is not configured on the server.");
    }
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        throw new UnauthorizedException("Invalid Google ID token.");
      }
      if (!payload.email_verified) {
        throw new UnauthorizedException("Google email is not verified.");
      }
      return payload;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException("Could not verify Google ID token.");
    }
  }
}
