import { Amplify } from "aws-amplify";

// Amplify Gen 2 generates this file after `npx ampx sandbox` or deploy.
// In development, run `npx ampx sandbox` to generate it.
// In production, Amplify Hosting generates it automatically.
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);
