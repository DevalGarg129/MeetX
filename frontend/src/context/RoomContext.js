import React, { createContext, useContext, useState, useCallback } from "react";

const RoomContext = createContext(null);

export const RoomProvider = ({ children }) => {
  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [sidebarTab, setSidebarTab] = useState(null); // null = closed
  const [reactions, setReactions] = useState([]); // [{socketId, name, emoji, id}]

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { ...msg, id: Date.now() + Math.random() }]);
  }, []);

  const addParticipant = useCallback((participant) => {
    setParticipants((prev) => {
      if (prev.find((p) => p.socketId === participant.socketId)) return prev;
      return [...prev, participant];
    });
  }, []);

  const removeParticipant = useCallback((socketId) => {
    setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
  }, []);

  const updateParticipant = useCallback((socketId, updates) => {
    setParticipants((prev) =>
      prev.map((p) => (p.socketId === socketId ? { ...p, ...updates } : p))
    );
  }, []);

  const addReaction = useCallback((reaction) => {
    const id = Date.now() + Math.random();
    setReactions((prev) => [...prev, { ...reaction, id }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
  }, []);

  const resetRoom = useCallback(() => {
    setRoomCode("");
    setRoomName("");
    setParticipants([]);
    setMessages([]);
    setMicOn(true);
    setCamOn(true);
    setHandRaised(false);
    setScreenSharing(false);
    setSidebarTab(null);
    setReactions([]);
  }, []);

  return (
    <RoomContext.Provider
      value={{
        roomCode, setRoomCode,
        roomName, setRoomName,
        userName, setUserName,
        participants, addParticipant, removeParticipant, updateParticipant,
        messages, addMessage,
        micOn, setMicOn,
        camOn, setCamOn,
        handRaised, setHandRaised,
        screenSharing, setScreenSharing,
        sidebarTab, setSidebarTab,
        reactions, addReaction,
        resetRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
};
