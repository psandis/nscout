import type { RegistryAdapter } from "../types.js";
import { npmAdapter } from "./npm.js";
import { githubAdapter } from "./github.js";
import { pypiAdapter } from "./pypi.js";
import { rdapAdapter } from "./rdap.js";
import { dockerHubAdapter } from "./dockerhub.js";

export const ADAPTERS = new Map<string, RegistryAdapter>([
  ["npm",       npmAdapter],
  ["github",    githubAdapter],
  ["pypi",      pypiAdapter],
  ["domains",   rdapAdapter],
  ["dockerhub", dockerHubAdapter],
]);
