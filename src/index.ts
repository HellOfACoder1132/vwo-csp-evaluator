import CONSTANTS from "./constants";
import { AnalyzeCspOptions, AnalyzeCspResult, CspResult, Directives } from "./types/types";

function directivesToFormattedCsp(directives: Directives): string {
  return directives.join(";\n");
}

export default function analyzeCSP({ csp, hasData360, hasEngage }: AnalyzeCspOptions): AnalyzeCspResult {
  const directives = csp
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean);

  const vwoDomains = ["*.visualwebsiteoptimizer.com", "app.vwo.com"];
  const requiredDirectives: Record<string, (string | { regex: RegExp, value: string })[]> = {
    [CONSTANTS.CSP.DIRECTIVES.WORKER_SRC]: ["'self'", "blob:"],
    "style-src": ["'unsafe-inline'", ...vwoDomains],
    "default-src": [],
    "child-src": [],
    "img-src": [...vwoDomains, CONSTANTS.USER_UPLOADS_DOMAIN],
    "connect-src": vwoDomains,
    "frame-src": vwoDomains,
    "script-src": [],
    "script-src-elem": [
      "'unsafe-inline'",
      {
        regex: /(?:dev|\*)\.visualwebsiteoptimizer\.com/,
        value: vwoDomains[0],
      },
    ],
  };

  if (!hasData360) requiredDirectives["script-src-elem"].push("'unsafe-eval'");
  if (hasEngage) requiredDirectives["script-src-elem"].push(CONSTANTS.VWO_ENGAGE_CDN);

  const cspDirectiveMap: Record<string, string[]> = directives.reduce((map, directive) => {
    const [name, ...values] = directive.split(" ");
    map[name] = values;
    return map;
  }, {} as Record<string, string[]>);

  const isDirectivePresent = (directive: string): boolean => !!cspDirectiveMap[directive];

  const isPresent: Record<string, boolean> = {
    "script-src-elem": isDirectivePresent("script-src-elem"),
    "script-src": isDirectivePresent("script-src"),
    "script-src*": isDirectivePresent("script-src") && isDirectivePresent("script-src-elem"),
    [CONSTANTS.CSP.DIRECTIVES.WORKER_SRC]: isDirectivePresent(CONSTANTS.CSP.DIRECTIVES.WORKER_SRC),
    "connect-src": isDirectivePresent("connect-src"),
    "frame-src": isDirectivePresent("frame-src"),
    "img-src": isDirectivePresent("img-src"),
    "style-src": isDirectivePresent("style-src"),
    "child-src": isDirectivePresent("child-src"),
    "default-src": isDirectivePresent("default-src"),
  };

  if (!isPresent["script-src-elem"]) {
    requiredDirectives["script-src"].push(...requiredDirectives["script-src-elem"]);
  }

  if (!isPresent[CONSTANTS.CSP.DIRECTIVES.WORKER_SRC]) {
    const workerSrcValues = requiredDirectives[CONSTANTS.CSP.DIRECTIVES.WORKER_SRC];
    if (isPresent["script-src"]) {
      requiredDirectives["script-src"].push(...workerSrcValues);
    } else if (isPresent["child-src"]) {
      requiredDirectives["child-src"].push(...workerSrcValues);
    } else if (isPresent["default-src"]) {
      requiredDirectives["default-src"].push(...workerSrcValues);
    }
  }

  if (!isPresent["script-src*"]) {
    requiredDirectives["script-src"].forEach((directiveVal) => {
      if (typeof directiveVal === "object") directiveVal = directiveVal.value;
      requiredDirectives["default-src"].push(directiveVal);
    });
  }

  if (
    isPresent["default-src"] &&
    (!isPresent["img-src"] ||
      !isPresent["connect-src"] ||
      !isPresent["script-src*"] ||
      !(isPresent["frame-src"] && isPresent["child-src"]))
  ) {
    requiredDirectives["default-src"].push(...vwoDomains);
  }

  if (isPresent["default-src"] && !isPresent["img-src"]) {
    requiredDirectives["default-src"].push(CONSTANTS.USER_UPLOADS_DOMAIN);
  }

  let isCspValid = true;
  const results: CspResult[] = directives.map((directive) => {
    const directiveStr = directive.replace("https://", "");
    const [name, ...values] = directiveStr.split(" ");
    const requiredValues = requiredDirectives[name];
    if (!requiredValues || !requiredValues.length) {
      return { directive: name, status: "pass", missingValues: [] };
    }
    const missingValues: string[] = [];
    for (const requiredVal of requiredValues) {
      if (
        typeof requiredVal === "object"
          ? !directiveStr.match(requiredVal.regex)
          : !values.includes(requiredVal)
      ) {
        missingValues.push((requiredVal as { value: string }).value || requiredVal as string);
      }
    }
    if (missingValues.length) isCspValid = false;
    return {
      directive: name,
      status: missingValues.length === 0 ? "pass" : "fail",
      missingValues,
    };
  });

  const revisedCSPMap: Record<string, string[]> = { ...cspDirectiveMap };

  results.forEach((result) => {
    if (result.status === "fail") {
      revisedCSPMap[result.directive] = [
        ...(revisedCSPMap[result.directive] || []),
        ...result.missingValues,
      ];
    }
  });

  const revisedCSP = isCspValid
    ? ""
    : Object.entries(revisedCSPMap)
        .map(([directive, values]) => `${directive} ${values.join(" ")}`)
        .join(";\n");

  const formattedCspStr = directivesToFormattedCsp(directives) + (directives.length ? ";" : "");

  return {
    csp: formattedCspStr,
    results,
    revisedCSP,
  };
}
