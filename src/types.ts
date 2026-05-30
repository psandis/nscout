export type Registry = "npm" | "github" | "pypi" | "domains";
export type CheckStatus = "available" | "taken" | "reserved" | "expiring" | "unknown" | "error";
export type Style = "claw" | "short" | "portmanteau" | "free";

export interface CheckResult {
  registry: string;
  status: CheckStatus;
  detail?: string;
}

export interface NameResult {
  name: string;
  checks: CheckResult[];
}

export interface RunOptions {
  registries: string[];
  domains: string[];
  concurrency: number;
  timeout: number;
}

export interface RegistryAdapter {
  readonly name: string;
  check(name: string, options: RunOptions): Promise<CheckResult[]>;
}
