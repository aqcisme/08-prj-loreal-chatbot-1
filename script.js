// Insert your Cloudflare Worker URL after deployment.
const WORKER_URL = "YOUR_CLOUDFLARE_WORKER_URL";

const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const messagesEl = document.getElementById("chat-messages");

const conversation = [];

function addMessage(text, role, extraClass = "") {
  const article = document.createElement("article");

  article.className = `message ${
    role === "user" ? "user-message" : "assistant-message"
  } ${extraClass}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "YOU" : "L";

  const content = document.createElement("div");
  content.className = "message-content";

  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent =
    role === "user" ? "YOU" : "L'ORÉAL BEAUTY ASSISTANT";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  content.append(label, bubble);
  article.append(avatar, content);
  messagesEl.appendChild(article);

  messagesEl.scrollTop = messagesEl.scrollHeight;

  return article;
}

async function sendMessage(rawText) {
  const message = rawText.trim();

  if (!message) return;

  addMessage(message, "user");

  conversation.push({
    role: "user",
    content: message
  });

  input.value = "";
  sendButton.disabled = true;

  const typing = addMessage(
    "Finding the right beauty advice for you...",
    "assistant",
    "typing"
  );

  try {
    if (!WORKER_URL.startsWith("https://")) {
      throw new Error("Cloudflare Worker URL has not been configured.");
    }

    const response = await fetch(
      `${WORKER_URL.replace(/\/$/, "")}/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: conversation
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to contact the assistant.");
    }

    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error("The assistant returned an empty response.");
    }

    typing.remove();

    addMessage(answer, "assistant");

    conversation.push({
      role: "assistant",
      content: answer
    });

  } catch (error) {
    typing.remove();
    conversation.pop();

    addMessage(
      "Sorry, I couldn't connect just now. " + error.message,
      "assistant"
    );

  } finally {
    sendButton.disabled = false;
    input.focus();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(input.value);
});

document.querySelectorAll(".suggestion-chip").forEach((button) => {
  button.addEventListener("click", () => {
    sendMessage(button.dataset.prompt || "");
  });
});