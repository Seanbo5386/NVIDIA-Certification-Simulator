import { Amplify } from "aws-amplify";

// Amplify Gen 2 generates amplify_outputs.json after `npx ampx sandbox` or deploy.
// The file is gitignored so it won't exist in CI or fresh clones.
// Auth features gracefully degrade when it's missing.
//
// import.meta.glob returns {} when no files match, so the build succeeds
// even without the file present.
const modules = import.meta.glob("../amplify_outputs.json", { eager: true });
const outputsModule = modules["../amplify_outputs.json"] as
  | { default: Record<string, unknown> }
  | undefined;

/** Whether Amplify was successfully configured with a valid outputs file. */
export const amplifyConfigured = !!outputsModule;

if (outputsModule) {
  Amplify.configure(outputsModule.default);
} else if (import.meta.env.DEV) {
  // Log a single clear message in development instead of letting Amplify
  // spam multiple "has not been configured" warnings on every auth call.
  console.info(
    "[DC-Sim] Amplify outputs not found — auth and cloud sync disabled. " +
      "Run `npx ampx sandbox` to enable.",
  );
}
