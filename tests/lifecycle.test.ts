import { describe, expect, it } from "vitest";

import { deriveAgentLifecycle } from "@/lib/lifecycle";
import type { ChatRun } from "@/lib/chat-types";

function run(overrides: Partial<ChatRun> = {}): ChatRun {
  return {
    id: "run_1",
    prompt: "hello",
    requestId: "req_1",
    model: null,
    text: "hi",
    status: "done",
    reason: null,
    submissionId: "sub_1",
    operationId: "sub_1",
    latencyMs: 10,
    createdAt: 1_700_000_000_000,
    error: null,
    httpStatus: 200,
    ...overrides,
  };
}

describe("deriveAgentLifecycle", () => {
  it("maps a resident agent to idle", () => {
    expect(
      deriveAgentLifecycle({ probe: { isPending: false, isError: false, data: { resident: true } } }),
    ).toBe("idle");
  });

  it("maps an in-flight prompt to running", () => {
    expect(
      deriveAgentLifecycle({
        probe: { isPending: false, isError: false, data: { resident: true } },
        promptInFlight: true,
      }),
    ).toBe("running");
  });

  it("maps a model_error run to error", () => {
    expect(
      deriveAgentLifecycle({
        probe: { isPending: false, isError: false, data: { resident: true } },
        lastRun: run({ reason: "model_error" }),
      }),
    ).toBe("error");
  });

  it("maps a failed request to error", () => {
    expect(
      deriveAgentLifecycle({
        probe: { isPending: false, isError: false, data: { resident: true } },
        lastRun: run({ status: "error" }),
      }),
    ).toBe("error");
  });

  it("maps a pending probe to initializing", () => {
    expect(deriveAgentLifecycle({ probe: { isPending: true, isError: false } })).toBe("initializing");
  });

  it("maps an unreachable agent to closed", () => {
    expect(deriveAgentLifecycle({ probe: { isPending: false, isError: true } })).toBe("closed");
    expect(
      deriveAgentLifecycle({ probe: { isPending: false, isError: false, data: { resident: false } } }),
    ).toBe("closed");
  });

  it("prefers live activity over a stale failure", () => {
    expect(
      deriveAgentLifecycle({
        probe: { isPending: false, isError: false, data: { resident: true } },
        promptInFlight: true,
        lastRun: run({ status: "error" }),
      }),
    ).toBe("running");
  });
});
