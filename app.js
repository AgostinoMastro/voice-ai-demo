// Import the Retell Web SDK
import { RetellWebClient } from 'retell-client-js-sdk';

const agentId = 'agent_eee812a470e1c7b44f765f3c28';
const llmId = 'llm_5054f2c9c2e1d13ada371c0bc990';

// Initialize the Retell Web Client
const retellWebClient = new RetellWebClient();

document.getElementById("startCallButton").addEventListener("click", async () => {
    // Request microphone permission
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        document.getElementById("status").innerText = "Status: Microphone Access Granted";
    } catch (error) {
        console.error("Microphone access denied:", error);
        document.getElementById("status").innerText = "Status: Microphone Access Denied";
        return;
    }

    document.getElementById("status").innerText = "Status: Connecting...";

    try {
        // Make a server call to get the access token (this should be handled securely in production)
        const response = await fetch('/get-access-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ agentId, llmId })
        });
        const { accessToken } = await response.json();

        // Start the call
        await retellWebClient.startCall({
            accessToken: accessToken,
            sampleRate: 24000,  // Optional: Set sample rate
            captureDeviceId: 'default',  // Optional: Device ID of the mic
            playbackDeviceId: 'default',  // Optional: Device ID of the speaker
            emitRawAudioSamples: true  // Enable audio events to hear the agent's voice
        });

        document.getElementById("status").innerText = "Status: Connected";
        document.getElementById("startCallButton").style.display = "none";
        document.getElementById("stopCallButton").style.display = "block";
    } catch (error) {
        console.error("Error starting call:", error);
        document.getElementById("status").innerText = "Status: Connection Failed";
    }
});

document.getElementById("stopCallButton").addEventListener("click", () => {
    retellWebClient.stopCall();
    document.getElementById("status").innerText = "Status: Call Stopped";
    document.getElementById("startCallButton").style.display = "block";
    document.getElementById("stopCallButton").style.display = "none";
});

// Event listeners for call status updates
retellWebClient.on("call_started", () => {
    console.log("Call started");
});

retellWebClient.on("call_ended", () => {
    console.log("Call ended");
    document.getElementById("status").innerText = "Status: Call Ended";
});

retellWebClient.on("agent_start_talking", () => {
    console.log("Agent started talking");
});

retellWebClient.on("agent_stop_talking", () => {
    console.log("Agent stopped talking");
});

// Handle audio playback if emitRawAudioSamples is enabled
retellWebClient.on("audio", (audio) => {
    // Convert the Float32Array audio to a playable audio format
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = audioContext.createBuffer(1, audio.length, 24000);
    buffer.copyToChannel(audio, 0);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
});
