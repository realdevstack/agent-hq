import { useEffect, useState } from "react";
import { Mic, KeyRound, Settings } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import GlassCard from "@/components/GlassCard";
import VoiceOnboarding from "@/components/VoiceOnboarding";
import VoiceSessionUI from "@/components/VoiceSessionUI";
import { call } from "@/lib/api";

type Phase = "loading" | "onboarding" | "idle" | "session";

export default function Voice() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    void checkConfig();
  }, []);

  async function checkConfig() {
    try {
      const res = await call<{ configured: boolean }>("voice.config.check");
      setPhase(res.configured ? "idle" : "onboarding");
    } catch {
      setPhase("onboarding");
    }
  }

  async function startSession() {
    try {
      const res = await call<{ gemini_key: string }>("voice.config.get");
      setApiKey(res.gemini_key);
      setPhase("session");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to fetch Gemini key");
    }
  }

  async function resetConfig() {
    if (!confirm("Replace the stored Gemini key?")) return;
    try {
      await call("voice.config.clear");
      setPhase("onboarding");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to clear");
    }
  }

  if (phase === "loading") {
    return (
      <>
        <PageHeader title="Voice" subtitle="Talking to your agent, live, in your browser." />
        <GlassCard className="text-center py-16">
          <p className="text-white/70 font-medium">Loading...</p>
        </GlassCard>
      </>
    );
  }

  if (phase === "onboarding") {
    return (
      <>
        <PageHeader title="Voice" subtitle="Talking to your agent, live, in your browser." />
        <VoiceOnboarding onSaved={() => setPhase("idle")} />
      </>
    );
  }

  if (phase === "session" && apiKey) {
    return (
      <>
        <PageHeader title="Voice" subtitle="Live session. Speak naturally — your agent can act while you talk." />
        <VoiceSessionUI apiKey={apiKey} onSessionEnd={() => setPhase("idle")} />
      </>
    );
  }

  // Idle — ready to start a call
  return (
    <>
      <PageHeader
        title="Voice"
        subtitle="Your agent is configured. Start a conversation and watch it take real actions as you talk."
        right={
          <button
            onClick={() => void resetConfig()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 text-xs uppercase tracking-widest font-bold transition"
            title="Replace Gemini key"
          >
            <Settings size={14} /> Replace Key
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-5 mb-8">
        <Tile icon={KeyRound} label="Gemini Key" value="Configured" accent="success" />
        <Tile icon={Mic} label="Model" value="Gemini 2.0 Flash Live" accent="primary" />
        <Tile icon={Mic} label="Mode" value="Browser (WebRTC)" accent="purple" />
      </div>

      <GlassCard className="text-center py-16 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-purple/10 blur-3xl" />

        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-purple/30 border border-primary/40 flex items-center justify-center shadow-glow mx-auto mb-5">
            <Mic size={42} className="text-primary" strokeWidth={2} />
          </div>
          <h2 className="font-display text-2xl text-white font-bold tracking-wide mb-2">Ready when you are.</h2>
          <p className="text-sm text-white/75 font-medium max-w-md mx-auto mb-6">
            Your agent can create tasks, log activity, and query the dashboard while you talk.
            The transcript + actions appear live as you go.
          </p>
          <button
            onClick={() => void startSession()}
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-primary hover:bg-primary/90 text-black font-display font-black tracking-widest text-sm uppercase shadow-glow transition"
          >
            <Mic size={18} strokeWidth={3} /> Start Conversation
          </button>
          <p className="text-xs text-white/50 font-medium mt-4">
            Your browser will ask for microphone access.
          </p>
        </div>
      </GlassCard>
    </>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Mic;
  label: string;
  value: string;
  accent: "primary" | "success" | "purple";
}) {
  const cls =
    accent === "primary"
      ? "text-primary"
      : accent === "success"
        ? "text-success"
        : "text-purple";
  return (
    <GlassCard className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${cls}`}>
        <Icon size={20} strokeWidth={2.3} />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-white/65 font-display font-bold">{label}</div>
        <div className="text-sm text-white font-bold mt-0.5">{value}</div>
      </div>
    </GlassCard>
  );
}
