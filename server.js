const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ USE ENV VARIABLE (NO FILE)
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 🔥 TEST ROUTE
app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

// 🔥 SEND OTP
app.post("/api/send-otp", async (req, res) => {
  const { email, esimNumber } = req.body;

  if (!email || !esimNumber) {
    return res.json({ success: false, message: "Missing data" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await db.collection("otp").doc(esimNumber).set({
    otp,
    createdAt: Date.now(),
  });

  const chatId = `SYSTEM_${esimNumber}`;

  await db.collection("chats").doc(chatId).set({
    participants: ["SYSTEM", esimNumber],
    lastMessage: `Your OTP is ${otp}`,
    timestamp: Date.now(),
  });

  await db.collection("chats")
    .doc(chatId)
    .collection("messages")
    .add({
      sender: "SYSTEM",
      type: "text",
      content: `Your OTP is ${otp}`,
      timestamp: Date.now(),
    });

  res.json({ success: true, message: "OTP sent" });
});

// 🔥 VERIFY OTP
app.post("/api/verify-otp", async (req, res) => {
  const { esimNumber, otp } = req.body;

  const doc = await db.collection("otp").doc(esimNumber).get();

  if (!doc.exists) {
    return res.json({ success: false, message: "OTP not found" });
  }

  if (doc.data().otp === otp) {
    return res.json({ success: true, message: "OTP verified" });
  }

  res.json({ success: false, message: "Invalid OTP" });
});

app.listen(3000, () => console.log("Server running on port 3000"));