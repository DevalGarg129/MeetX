import { useRef, useState, useCallback, useEffect } from "react";
import { useSocket } from "../context/SocketContext";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/**
 * useWebRTC
 * Manages:
 *  - Local media stream (camera + mic)
 *  - Peer connections map: socketId -> RTCPeerConnection
 *  - Remote streams map: socketId -> MediaStream
 *  - Screen share stream
 */
const useWebRTC = (roomCode) => {
  const socket = useSocket();

  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef({}); // socketId -> RTCPeerConnection

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // socketId -> MediaStream
  const [screenStream, setScreenStream] = useState(null);

  // ─── Start local media ──────────────────────────────────────────
  const startLocalStream = useCallback(async (audioOn = true, videoOn = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoOn,
        audio: audioOn,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("getUserMedia error:", err);
      // Return empty stream if denied
      const empty = new MediaStream();
      localStreamRef.current = empty;
      setLocalStream(empty);
      return empty;
    }
  }, []);

  // ─── Create peer connection ──────────────────────────────────────
  const createPeer = useCallback(
    (targetSocketId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks to the peer
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // ICE candidates
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("webrtc:ice-candidate", {
            candidate: e.candidate,
            targetSocketId,
          });
        }
      };

      // Remote track received
      pc.ontrack = (e) => {
        const stream = e.streams[0];
        setRemoteStreams((prev) => ({ ...prev, [targetSocketId]: stream }));
      };

      pc.onconnectionstatechange = () => {
        if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[targetSocketId];
            return next;
          });
        }
      };

      peersRef.current[targetSocketId] = pc;
      return pc;
    },
    [socket]
  );

  // ─── Initiate call to a new participant ─────────────────────────
  const callPeer = useCallback(
    async (targetSocketId) => {
      const pc = createPeer(targetSocketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc:offer", { offer, targetSocketId });
    },
    [createPeer, socket]
  );

  // ─── Answer incoming call ───────────────────────────────────────
  const answerCall = useCallback(
    async (fromSocketId, offer) => {
      const pc = createPeer(fromSocketId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc:answer", { answer, targetSocketId: fromSocketId });
    },
    [createPeer, socket]
  );

  // ─── Toggle mic ─────────────────────────────────────────────────
  const toggleMic = useCallback(
    (enabled) => {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = enabled;
        });
      }
      if (roomCode) {
        socket.emit("media:toggle-mic", { roomCode, micOn: enabled });
      }
    },
    [socket, roomCode]
  );

  // ─── Toggle cam ─────────────────────────────────────────────────
  const toggleCam = useCallback(
    (enabled) => {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          t.enabled = enabled;
        });
      }
      if (roomCode) {
        socket.emit("media:toggle-cam", { roomCode, camOn: enabled });
      }
    },
    [socket, roomCode]
  );

  // ─── Feature 3: Screen share ─────────────────────────────────────
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      screenStreamRef.current = stream;
      setScreenStream(stream);

      // Replace video track in all peer connections
      const screenTrack = stream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });

      socket.emit("screenshare:start", { roomCode });

      // When user stops via browser UI
      screenTrack.onended = () => stopScreenShare();
      return stream;
    } catch (err) {
      if (err.name !== "NotAllowedError") console.error("Screen share error:", err);
      return null;
    }
  }, [socket, roomCode]);

  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
    }

    // Restore camera track
    if (localStreamRef.current) {
      const camTrack = localStreamRef.current.getVideoTracks()[0];
      if (camTrack) {
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(camTrack);
        });
      }
    }

    socket.emit("screenshare:stop", { roomCode });
  }, [socket, roomCode]);

  // ─── Cleanup ─────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
    }
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};
    setRemoteStreams({});
  }, []);

  // ─── Socket events ────────────────────────────────────────────────
  useEffect(() => {
    socket.on("webrtc:offer", async ({ offer, fromSocketId }) => {
      await answerCall(fromSocketId, offer);
    });

    socket.on("webrtc:answer", async ({ answer, fromSocketId }) => {
      const pc = peersRef.current[fromSocketId];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("webrtc:ice-candidate", async ({ candidate, fromSocketId }) => {
      const pc = peersRef.current[fromSocketId];
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (e) { console.error("ICE error:", e); }
      }
    });

    socket.on("room:user-left", ({ socketId }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    return () => {
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice-candidate");
      socket.off("room:user-left");
    };
  }, [socket, answerCall]);

  return {
    localStream,
    remoteStreams,
    screenStream,
    startLocalStream,
    callPeer,
    toggleMic,
    toggleCam,
    startScreenShare,
    stopScreenShare,
    cleanup,
  };
};

export default useWebRTC;
