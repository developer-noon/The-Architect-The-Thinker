/** @format */

// Use environment key if available, else check localStorage
let activeKey = "";

const roles = {
  architect: {
    title: "Software Architect",
    theory: 95,
    code: 15,
    desc: "Philosophers of the codebase. They determine the laws of physics for a digital system—deciding how parts communicate and ensuring structural integrity as systems scale.",
  },
  analyst: {
    title: "Systems Analyst",
    theory: 75,
    code: 5,
    desc: "Translators of chaos. They take messy human requirements and map them into the cold, perfect logic of system requirements.",
  },
  scientist: {
    title: "Data Scientist",
    theory: 90,
    code: 35,
    desc: "The new mathematicians. They find the hidden narrative inside millions of data points, using logic as their lens to view the future.",
  },
  ux: {
    title: "UX Strategist",
    theory: 85,
    code: 0,
    desc: "Architects of the mind. They use cognitive psychology and logic to map the intuitive path of a user through a digital landscape.",
  },
  researcher: {
    title: "AI Researcher",
    theory: 100,
    code: 25,
    desc: "Working at the edge of thought. They build the engines of future intelligence based on pure neural theory and math.",
  },
};

let currentRoleId = "architect";

function toggleSettings() {
  document.getElementById("settings-panel").classList.toggle("open");
}

function saveSettings() {
  const val = document.getElementById("api-key-input").value;
  if (val) {
    localStorage.setItem("gemini_api_key", val);
    activeKey = val;
    toggleSettings();
  }
}

function updateRole(id) {
  currentRoleId = id;
  const data = roles[id];
  const block = document.getElementById("content-block");
  block.classList.remove("fade-in");
  void block.offsetWidth;
  block.classList.add("fade-in");

  document.getElementById("display-title").textContent = data.title;
  document.getElementById("display-desc").textContent = data.desc;
  document.getElementById("bar-theory").style.width = data.theory + "%";
  document.getElementById("bar-code").style.width = data.code + "%";
  document.getElementById("val-theory").textContent = data.theory + "%";
  document.getElementById("val-code").textContent = data.code + "%";

  document
    .querySelectorAll(".role-link")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById("btn-" + id).classList.add("active");
  document.getElementById("ai-response-container").classList.add("hidden");
}

async function fetchGemini(
  payload,
  endpoint = "generateContent",
  model = "gemini-2.5-flash-preview-09-2025",
) {
  const key = activeKey || "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${key}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    if (response.status === 403)
      alert("Invalid API Key. Click 'Config' to set your key.");
    throw new Error("API Error");
  }
  return await response.json();
}

async function generateDeepDive() {
  const textField = document.getElementById("ai-text");
  const container = document.getElementById("ai-response-container");
  container.classList.remove("hidden");
  textField.innerHTML =
    '<span class="italic animate-pulse">Consulting the archives...</span>';

  const prompt = `Role: ${roles[currentRoleId].title}. Write a brief, academic thought experiment (100 words max) starting with "Imagine..." about a high-level conceptual challenge this role faces.`;

  try {
    const data = await fetchGemini({
      contents: [{ parts: [{ text: prompt }] }],
    });
    textField.textContent = data.candidates[0].content.parts[0].text;
    document.getElementById("tts-btn").classList.remove("hidden");
  } catch (e) {
    textField.textContent =
      "The connection failed. Check your API key in 'Config'.";
  }
}

async function consultMentor() {
  const input = document.getElementById("mentor-input").value;
  const status = document.getElementById("mentor-status");
  const mentorText = document.getElementById("mentor-text");
  const resDiv = document.getElementById("mentor-response");

  if (!input.trim()) return;
  status.textContent = "Reflecting...";

  const prompt = `User background: "${input}". Recommend a role (Software Architect, Systems Analyst, Data Scientist, UX Strategist, or AI Researcher). Explain why in 2 poetic, sophisticated sentences.`;

  try {
    const data = await fetchGemini({
      contents: [{ parts: [{ text: prompt }] }],
    });
    mentorText.textContent = data.candidates[0].content.parts[0].text;
    resDiv.classList.remove("hidden");
  } catch (e) {
    mentorText.textContent = "Reflection failed. Is your API key set?";
  } finally {
    status.textContent = "Complete";
  }
}

async function speakAiText() {
  const text = document.getElementById("ai-text").textContent;
  const btn = document.getElementById("tts-btn");
  btn.textContent = "Preparing Audio...";

  const payload = {
    contents: [
      { parts: [{ text: `Say in a calm, intellectual voice: ${text}` }] },
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } },
      },
    },
    model: "gemini-2.5-flash-preview-tts",
  };

  try {
    const response = await fetchGemini(
      payload,
      "generateContent",
      "gemini-2.5-flash-preview-tts",
    );
    const pcm = response.candidates[0].content.parts[0].inlineData.data;
    const blob = pcmToWav(pcm, 24000);
    new Audio(URL.createObjectURL(blob)).play();
    btn.textContent = "🔊 Playing";
    setTimeout(() => (btn.textContent = "🔊 Play Voice"), 5000);
  } catch (e) {
    btn.textContent = "Audio unavailable";
  }
}

function pcmToWav(base64Pcm, sampleRate) {
  const buffer = Uint8Array.from(atob(base64Pcm), (c) =>
    c.charCodeAt(0),
  ).buffer;
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + buffer.byteLength, true);
  view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, buffer.byteLength, true);
  return new Blob([wavHeader, buffer], { type: "audio/wav" });
}


