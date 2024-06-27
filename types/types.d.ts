
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

declare const getCspAnalysis: ({ csp, hasData360, hasEngage }: AnalyzeCspOptions) => AnalyzeCspResult;

declare const getCspFromMeta: (metaTagEle: HTMLElement, additionalConfig?: {
    hasData360?: boolean;
    hasEngage?: boolean;
}) => string;

declare const getCspFromLink: (url: string, configObj?: {
    hasData360?: boolean;
    hasEngage?: boolean;
    metaFallback?: boolean;
}) => Promise<{ csp: string; statusCode: number }>;

export { getCspFromLink, getCspFromMeta, getCspAnalysis };
