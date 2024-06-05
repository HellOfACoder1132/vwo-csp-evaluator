
export type GenericObject = { [prop: string]: any };

export type Directives = string[];

export interface AnalyzeCspOptions {
  csp: string;
  hasData360?: boolean;
  hasEngage?: boolean;
}

export interface CspResult {
  directive: string;
  status: "pass" | "fail";
  missingValues: string[];
}

export interface AnalyzeCspResult {
  csp: string;
  results: CspResult[];
  revisedCSP: string;
}
