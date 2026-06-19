import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type TranscriptionResponse = {
  text?: string;
};

@Injectable()
export class TranscriptionService {
  constructor(private readonly config: ConfigService) {}

  async transcribe(file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException("Audio file is required.");
    if (!file.mimetype.startsWith("audio/")) {
      throw new BadRequestException("Upload an audio file.");
    }

    const apiKey = this.config.get<string>("OPENAI_API_KEY");
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "Speech transcription is not configured.",
      );
    }

    const audioBytes = new Uint8Array(file.buffer.length);
    audioBytes.set(file.buffer);

    const form = new FormData();
    form.append("model", "gpt-4o-mini-transcribe");
    form.append("response_format", "json");
    form.append(
      "file",
      new Blob([audioBytes], { type: file.mimetype }),
      file.originalname || "speech.webm",
    );

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
      },
    );

    const data = (await response.json().catch(() => null)) as
      | TranscriptionResponse
      | { error?: { message?: string } }
      | null;

    if (!response.ok) {
      const message = data && "error" in data ? data.error?.message : undefined;
      throw new InternalServerErrorException(
        message || "Speech transcription failed.",
      );
    }

    const text = data && "text" in data ? data.text?.trim() : "";
    return { text: text ?? "" };
  }
}
