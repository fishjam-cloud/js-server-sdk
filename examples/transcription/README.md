# Transcription with Fishjam and Gemini Live API

This example shows how to integrate Fishjam with the Gemini Live API.
It makes use of the peer subscriptions feature in Fishjam.

## Development
To start the development server copy `.env.example` to `.env` and run
```bash
bun run dev
```

You can obtain peer tokens with

```bash
curl http://localhost:3000/peers
```

When you connect peers to rooms, you will see their transcriptions in the terminal as logs.
