import { Router } from "express";
import { createRoom, getRoom, getRoomByCode, listActiveRooms } from "../lib/classroom";

const router = Router();

router.get("/classrooms", (_req, res) => {
  res.json(listActiveRooms());
});

router.post("/classrooms", (req, res) => {
  const { title, subject, teacherId, teacherName, scheduledAt } = req.body;
  if (!title || !subject || !teacherId || !teacherName) {
    return res.status(400).json({ error: "title, subject, teacherId, teacherName are required" });
  }
  const room = createRoom({
    title,
    subject,
    teacherId,
    teacherName,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
  });
  res.status(201).json({
    id: room.id,
    code: room.code,
    title: room.title,
    subject: room.subject,
    teacherName: room.teacherName,
    scheduledAt: room.scheduledAt,
  });
});

router.get("/classrooms/:id", (req, res) => {
  const room = getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json({
    id: room.id,
    code: room.code,
    title: room.title,
    subject: room.subject,
    teacherName: room.teacherName,
    scheduledAt: room.scheduledAt,
    isActive: room.isActive,
    participantCount: room.participants.size,
  });
});

router.get("/classrooms/code/:code", (req, res) => {
  const room = getRoomByCode(req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (!room.isActive) return res.status(410).json({ error: "Class has ended" });
  res.json({
    id: room.id,
    code: room.code,
    title: room.title,
    subject: room.subject,
    teacherName: room.teacherName,
  });
});

export default router;
