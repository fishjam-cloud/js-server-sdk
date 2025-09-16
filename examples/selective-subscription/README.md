# Selective subscription with Fishjam

A minimal example demonstrating Fishjam's selective subscription flow. The example runs a small server that creates peers (manual subscription mode) and lets you subscribe one peer to another peer’s tracks — either all tracks or only specific tracks.

Setup

1. Install dependencies:
    ```bash
    yarn
    ```

2. Copy and configure the environment:
    ```bash
    cp .env.example .env
    ```
    Set the following in `.env`:
    ```
    FISHJAM_ID=your_fishjam_project_id
    FISHJAM_TOKEN=your_fishjam_management_token
    ```

3. Start the dev server:
    ```bash
    yarn dev
    ```

The server logs Fishjam notifications (peer IDs and track IDs) — use those values with the API endpoints below.

API

- POST /peers
  - Create a new peer in a room configured for manual subscription.
  - Example:
     ```bash
     curl -X POST http://localhost:3000/peers
     ```
  - Response: JSON containing the created peer ID and a peer token.

- POST /subscribe_peer?subId=<SUBSCRIBER_ID>&prodId=<PRODUCER_ID>
  - Subscribe the subscriber peer (subId) to all tracks published by the producer peer (prodId).
  - Example:
     ```bash
     curl -X POST "http://localhost:3000/subscribe_peer?subId=72457c2f-e4d2-46aa-9ff2-5a400f169df7&prodId=41ed79fb-6ce1-47b0-b5c8-1c33b78d95b4"
     ```
  - Response: JSON status and any error messages.

- POST /subscribe_tracks?subId=<SUBSCRIBER_ID>&tracks=<TRACK_ID>,<TRACK_ID>...
  - Subscribe the subscriber peer (subId) to a comma-separated list of specific tracks.
  - Example (subscribe to one track):
     ```bash
     curl -X POST "http://localhost:3000/subscribe_tracks?subId=41ed79fb-6ce1-47b0-b5c8-1c33b78d95b4&tracks=72457c2f-e4d2-46aa-9ff2-5a400f169df7:3c7ccb28-542c-418d-aaa1-e25b4c067824"
     ```

  - Response: JSON status and any error messages.

Notes
- Replace SUBSCRIBER_ID, PRODUCER_ID, and TRACK_ID with values emitted in the server logs (Fishjam notifications).
- Endpoints return JSON with status and errors. Check server logs for detailed Fishjam request/response traces.

Client integration
- You can connect peers using the fishjam minimal-react example:
  https://github.com/fishjam-cloud/web-client-sdk/tree/main/examples/react-client
- Pass the peer token returned when creating a peer as the peer's token in the client.
