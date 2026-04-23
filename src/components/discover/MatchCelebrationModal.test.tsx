import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MatchCelebrationModal from "./MatchCelebrationModal";

const profileA = {
  first_name: "Alice",
  profile_photos: [{ photo_url: "https://example.com/a.jpg", is_primary: true }],
};

/**
 * Mirrors DiscoverPage's onSendMessage flow: only clears match context and
 * closes the modal on success. On failure, modal + matched profile persist
 * so the user can retry immediately.
 */
const Harness = ({ onSend }: { onSend: () => Promise<boolean> }) => {
  const [open, setOpen] = useState(true);
  const [matched, setMatched] = useState<typeof profileA | null>(profileA);
  const [sending, setSending] = useState(false);

  return (
    <MatchCelebrationModal
      open={open}
      onOpenChange={setOpen}
      matchedProfile={matched}
      isSendingMessage={sending}
      onSendMessage={async () => {
        setSending(true);
        let ok = false;
        try {
          ok = await onSend();
        } catch {
          ok = false;
        } finally {
          setSending(false);
          if (ok) {
            setOpen(false);
            setMatched(null);
          }
        }
      }}
      onKeepSwiping={() => setOpen(false)}
    />
  );
};

describe("MatchCelebrationModal — retry after failure", () => {
  it("keeps modal open and preserves matched profile when chat-open fails", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    render(<Harness onSend={onSend} />);

    expect(await screen.findAllByText("Alice")).not.toHaveLength(0);
    const sendBtn = screen.getByRole("button", { name: /send a message/i });

    await user.click(sendBtn);
    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /send a message/i })).toBeEnabled();
    });
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /keep swiping/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /send a message/i }));
    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /send a message/i })).not.toBeInTheDocument();
    });
  });

  it("disables both action buttons while a send is in flight", async () => {
    const user = userEvent.setup();
    let resolveSend: (v: boolean) => void = () => {};
    const onSend = vi.fn(
      () => new Promise<boolean>((res) => { resolveSend = res; }),
    );

    render(<Harness onSend={onSend} />);

    const sendBtn = await screen.findByRole("button", { name: /send a message/i });
    await user.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /opening chat/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /keep swiping/i })).toBeDisabled();
    });

    await act(async () => { resolveSend(false); });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /send a message/i })).toBeEnabled();
    });
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
  });
  it("re-enables buttons and preserves match context when onSendMessage rejects (RPC throws)", async () => {
    const user = userEvent.setup();
    const onSend = vi
      .fn()
      .mockRejectedValueOnce(new Error("RPC failed"))
      .mockResolvedValueOnce(true);

    render(<Harness onSend={onSend} />);

    const sendBtn = await screen.findByRole("button", { name: /send a message/i });

    // First click — RPC throws. The Harness's try/finally mirrors DiscoverPage:
    // it must not crash the modal and must reset the sending state.
    await user.click(sendBtn).catch(() => {});
    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));

    // Modal still open with same matched profile, both buttons re-enabled.
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /send a message/i })).toBeEnabled();
    });
    expect(screen.getByRole("button", { name: /keep swiping/i })).toBeEnabled();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);

    // Retry succeeds with the same context.
    await user.click(screen.getByRole("button", { name: /send a message/i }));
    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /send a message/i })).not.toBeInTheDocument();
    });
  });
});