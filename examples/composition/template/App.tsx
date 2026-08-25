import { eventBus, usePeer, usePeers, useRoom, useSpeakingState } from '@fishjam-cloud/composition';
import { Image, InputStream, Rescaler, Text, Tiles, View } from '@swmansion/smelter';
import { useCallback, useEffect, useState } from 'react';
import {
  FONT_FAMILY,
  LOGO_ID,
  SCENES,
  SCENE_EVENT,
  SHADOW_COLOR,
  SPEAKING_COLOR,
  TICKER_TEXT,
  type Scene,
} from './scene.ts';

type Camera = { peerId: string; inputId: string };
type LayoutProps = { cameras: Camera[] };

const FRAME = { width: 1280, height: 720 };
const MARGIN = 48;
const LOGO_SIZE = 72;
const TICKER = { height: 72, fontSize: 28, lineBox: 40, unit: 900, copies: 3, durationMs: 9000 };
const HEADER_HEIGHT = MARGIN * 2 + LOGO_SIZE;
const STAGE = { top: HEADER_HEIGHT, height: FRAME.height - HEADER_HEIGHT - TICKER.height - MARGIN };
const TILE_GAPS = { margin: 10, padding: 8 };
const PIP = { width: 220, height: 124, gap: 14, inset: 18 };
const MESSAGE = { width: 640, height: 92, fontSize: 34 };
const LOGO_HOME = { top: MARGIN, left: FRAME.width - MARGIN - LOGO_SIZE };
function stageWidth(height: number) {
  return (height * 16) / 9;
}

function useScene(): Scene {
  const [scene, setScene] = useState(SCENES[0]);
  useEffect(() => eventBus.on<Scene>(SCENE_EVENT, setScene), []);
  return scene;
}

function useTicking(everyMs: number): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((current) => current + 1), everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);

  return tick;
}

function CameraTile({ peerId, inputId }: Camera) {
  const speaking = useSpeakingState(peerId) === 'speech';

  return (
    <View
      style={{
        borderRadius: 20,
        borderWidth: 6,
        borderColor: speaking ? SPEAKING_COLOR : '#00000000',
        boxShadow: [{ color: SHADOW_COLOR, offsetX: 0, offsetY: 10, blurRadius: 24 }],
      }}
    >
      <Rescaler style={{ rescaleMode: 'fill' }}>
        <InputStream inputId={inputId} />
      </Rescaler>
    </View>
  );
}

function SpeakingProbe({ peerId, onChange }: { peerId: string; onChange: (peerId: string, on: boolean) => void }) {
  const speaking = useSpeakingState(peerId) === 'speech';
  useEffect(() => onChange(peerId, speaking), [peerId, speaking, onChange]);
  return null;
}

function MainTile({ peerId }: { peerId: string }) {
  const peer = usePeer(peerId);
  const stream = peer?.screenShareStream ?? peer?.cameraStream;

  return stream ? <CameraTile peerId={peerId} inputId={stream.inputId} /> : null;
}

function Logo({ top, left }: { top: number; left: number }) {
  return (
    <View style={{ width: LOGO_SIZE, height: LOGO_SIZE, top, left }}>
      <Image imageId={LOGO_ID} />
    </View>
  );
}

function Ticker({ scene }: { scene: Scene }) {
  const [offset, setOffset] = useState({ left: 0, sliding: false });

  useEffect(() => {
    const restart = () => {
      setOffset({ left: 0, sliding: false });
      setTimeout(() => setOffset({ left: -TICKER.unit, sliding: true }), 60);
    };

    restart();
    const loop = setInterval(restart, TICKER.durationMs + 200);
    return () => clearInterval(loop);
  }, []);

  return (
    <View style={{ bottom: 0, left: 0, width: FRAME.width, height: TICKER.height, backgroundColor: scene.heading }}>
      <View
        style={{
          direction: 'row',
          top: (TICKER.height - TICKER.lineBox) / 2,
          left: offset.left,
          width: TICKER.unit * TICKER.copies,
          height: TICKER.lineBox,
        }}
        transition={
          offset.sliding ? { durationMs: TICKER.durationMs, easingFunction: { functionName: 'linear' } } : undefined
        }
      >
        {Array.from({ length: TICKER.copies }, (_, copy) => (
          <Text
            key={copy}
            style={{
              width: TICKER.unit,
              fontSize: TICKER.fontSize,
              lineHeight: TICKER.lineBox,
              wrap: 'none',
              color: scene.background,
              fontFamily: FONT_FAMILY,
            }}
          >
            {TICKER_TEXT}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Message({ scene, text }: { scene: Scene; text: string }) {
  const dots = '.'.repeat((useTicking(500) % 3) + 1);

  return (
    <View
      style={{
        top: (FRAME.height - MESSAGE.height) / 2,
        left: (FRAME.width - MESSAGE.width) / 2,
        width: MESSAGE.width,
        height: MESSAGE.height,
        borderRadius: 14,
        borderWidth: 3,
        borderColor: scene.heading,
        paddingTop: (MESSAGE.height - MESSAGE.fontSize) / 2,
      }}
    >
      <Text
        style={{
          width: MESSAGE.width - 6,
          fontSize: MESSAGE.fontSize,
          lineHeight: MESSAGE.fontSize,
          align: 'center',
          color: scene.heading,
          fontFamily: FONT_FAMILY,
        }}
      >
        {`${text}${dots}`}
      </Text>
    </View>
  );
}

function TilesLayout({ cameras }: LayoutProps) {
  return (
    <Tiles style={{ ...TILE_GAPS, tileAspectRatio: cameras.length === 2 ? '8:9' : '16:9' }}>
      {cameras.map((camera) => (
        <CameraTile key={camera.inputId} {...camera} />
      ))}
    </Tiles>
  );
}

function PipLayout({ cameras }: LayoutProps) {
  const [main, ...rest] = cameras;
  const width = stageWidth(STAGE.height);

  return (
    <View style={{ height: STAGE.height, paddingLeft: (FRAME.width - width) / 2 }}>
      <View style={{ width, height: STAGE.height }}>
        <MainTile peerId={main.peerId} />
        {rest.slice(0, 3).map((camera, index) => (
          <View
            key={camera.inputId}
            style={{
              width: PIP.width,
              height: PIP.height,
              bottom: PIP.inset,
              right: PIP.inset + index * (PIP.width + PIP.gap),
            }}
          >
            <CameraTile {...camera} />
          </View>
        ))}
      </View>
    </View>
  );
}

function SpeakerLayout({ cameras }: LayoutProps) {
  const [speaking, setSpeaking] = useState<Record<string, boolean>>({});
  const onChange = useCallback(
    (peerId: string, on: boolean) =>
      setSpeaking((state) => (state[peerId] === on ? state : { ...state, [peerId]: on })),
    []
  );

  const main = cameras.find((camera) => speaking[camera.peerId]) ?? cameras[0];
  const rest = cameras.filter((camera) => camera.inputId !== main.inputId);
  const mainHeight = rest.length > 0 ? STAGE.height * 0.66 : STAGE.height;
  const sideGap = (FRAME.width - stageWidth(mainHeight)) / 2;

  return (
    <View style={{ direction: 'column' }}>
      {cameras.map((camera) => (
        <SpeakingProbe key={camera.peerId} peerId={camera.peerId} onChange={onChange} />
      ))}
      <View style={{ height: mainHeight, paddingLeft: sideGap, paddingRight: sideGap }}>
        <MainTile peerId={main.peerId} />
      </View>
      {rest.length > 0 && (
        <Tiles style={TILE_GAPS}>
          {rest.map((camera) => (
            <CameraTile key={camera.inputId} {...camera} />
          ))}
        </Tiles>
      )}
    </View>
  );
}

const LAYOUTS = { tiles: TilesLayout, pip: PipLayout, speaker: SpeakerLayout };

export default function App() {
  const scene = useScene();
  const room = useRoom();
  const peers = usePeers();
  const cameras = peers.flatMap((peer) =>
    peer.cameraStream ? [{ peerId: peer.id, inputId: peer.cameraStream.inputId }] : []
  );
  const Layout = LAYOUTS[scene.layout];
  const waiting = !room || cameras.length === 0;

  return (
    <View style={{ backgroundColor: scene.background }}>
      <View style={{ direction: 'column' }}>
        <View style={{ height: HEADER_HEIGHT }}>
          <Logo {...LOGO_HOME} />
        </View>
        {waiting ? (
          <Message scene={scene} text={room ? 'Waiting for someone to join' : 'Connecting'} />
        ) : (
          <View style={{ height: STAGE.height }}>
            <Layout cameras={cameras} />
          </View>
        )}
      </View>
      <Ticker scene={scene} />
    </View>
  );
}
