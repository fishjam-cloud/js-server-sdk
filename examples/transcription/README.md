# Transcription with Fishjam and Gemini Live API

This example shows how to integrate Fishjam with the Gemini Live API.
It makes use of the peer subscriptions feature in Fishjam.

## Development

To start the development server you must first copy `.env.example` to `.env`.

Then you need to set the following variables:
- `FISHJAM_ID`: your Fishjam ID, which you can get at <https://fishjam.io>
- `FISHJAM_TOKEN`: your Fishjam management token, which you can get at <https://fishjam.io>
- `GEMINI_API_TOKEN`: your Gemini API token, which you can get at <https://aistudio.google.com/app/apikey>

Once you've set up your environment variables, all you need to do is run the following command:

```bash
yarn dev
```

When the server is running, you can obtain peer tokens by going to <http://localhost:3000/peers>.

When you connect the created peers, you will see their transcriptions in the terminal as logs.
You can connect peers with the [fishjam minimal-react example](https://github.com/fishjam-cloud/web-client-sdk/tree/main/examples/react-client).
