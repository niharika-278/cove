import { RoomProvider } from "@/lib/room/room-context";
import { WebRTCProvider } from "@/lib/webrtc/webrtc-context";
import { RoomShell } from "@/components/room/room-shell";

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  return (
    <RoomProvider roomId={roomId}>
      <WebRTCProvider>
        <RoomShell />
      </WebRTCProvider>
    </RoomProvider>
  );
}
