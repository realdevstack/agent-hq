import { useState } from "react";
import Modal, { FormField, TextInput, PrimaryButton } from "./Modal";
import { call } from "@/lib/api";
import type { Agent } from "@/lib/types";

const EMOJI_SUGGESTIONS = ["🤖", "🧭", "🚀", "🎙️", "🔍", "✍️", "🧠", "⚡", "🦾", "🔮", "📡", "🛰️"];
const COLOR_SWATCHES = ["#00BFFF", "#FF6B35", "#A855F7", "#00E676", "#F59E0B", "#FF4D6D"];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (agent: Agent) => void;
};

export default function RegisterAgentModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [emoji, setEmoji] = useState("🤖");
  const [color, setColor] = useState("#00BFFF");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const agent = await call<Agent>("agent.register", {
        name: name.trim(),
        role: role.trim() || "Generalist",
        emoji,
        color,
      });
      localStorage.setItem("agent_hq_has_real_agent", "1");
      onCreated(agent);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setName("");
    setRole("");
    setEmoji("🤖");
    setColor("#00BFFF");
    setError(null);
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Register New Agent"
      description="Give your agent a name, a face, and a job. You'll get back a sign-in key it can use to post activity on its own."
    >
      <form onSubmit={submit} className="flex flex-col">
        <FormField label="Agent Name" required>
          <TextInput
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Atlas, Nova, Echo..."
            required
          />
        </FormField>

        <FormField label="Role">
          <TextInput
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Executive Assistant, Outreach SDR, Research Analyst..."
          />
        </FormField>

        <FormField label="Emoji">
          <div className="flex flex-wrap gap-2">
            {EMOJI_SUGGESTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition ${
                  emoji === e
                    ? "bg-primary/25 border-2 border-primary shadow-glow"
                    : "bg-white/5 border border-white/10 hover:border-white/30"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Color">
          <div className="flex gap-2">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-lg transition border-2 ${
                  color === c ? "border-white shadow-lg" : "border-transparent hover:border-white/40"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </FormField>

        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}

        <div className="flex items-center gap-3 mt-2">
          <PrimaryButton type="submit" loading={loading}>
            Register Agent
          </PrimaryButton>
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="px-4 py-3 text-sm text-white/70 hover:text-white font-display font-bold uppercase tracking-widest"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
