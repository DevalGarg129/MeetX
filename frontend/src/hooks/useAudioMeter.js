import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useAudioMeter
 * Feature 5: Analyzes a MediaStream's audio and provides
 * a live volume level (0–1) using the Web Audio API AnalyserNode.
 * Also emits speaking state changes via a callback.
 */
const useAudioMeter = (stream, onSpeakingChange) => {
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const speakingRef = useRef(false);
  const [level, setLevel] = useState(0); // 0 to 1

  const SPEAK_THRESHOLD = 0.12;

  const start = useCallback(() => {
    if (!stream || !stream.getAudioTracks().length) return;

    try {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.4;

      const source = audioCtxRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const data = new Uint8Array(analyserRef.current.frequencyBinCount);

      const tick = () => {
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        const normalized = Math.min(avg / 80, 1);
        setLevel(normalized);

        const isSpeaking = normalized > SPEAK_THRESHOLD;
        if (isSpeaking !== speakingRef.current) {
          speakingRef.current = isSpeaking;
          if (onSpeakingChange) onSpeakingChange(isSpeaking);
        }

        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.warn("AudioMeter error:", e);
    }
  }, [stream, onSpeakingChange]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  return { level };
};

export default useAudioMeter;
