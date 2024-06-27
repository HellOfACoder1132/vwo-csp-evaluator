import axios from "axios";
import CONSTANTS from "./constants";
import {
  AnalyzeCspOptions,
  AnalyzeCspResult,
  CspResult,
  Directives,
  GenericObject,
} from "../types/types";
import { load } from "cheerio";
import { findMessageForDirective } from "./messageHelper";

// const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
// const isBrowser = typeof window === "object" && typeof window.document === "object";

const getCspAnalysis = ({
  csp,
  hasData360,
  hasEngage,
}: AnalyzeCspOptions): AnalyzeCspResult => {
  if (!csp) {
    return { csp: "", results: [], revisedCSP: "" };
  }
  const directivesToFormattedCsp = (directives: Directives): string => {
    return directives.join(";\n");
  };
  const directives = csp
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean);

  const vwoDomains = ["*.visualwebsiteoptimizer.com", "app.vwo.com"];
  const requiredDirectives: Record<
    string,
    (string | { regex: RegExp; value: string })[]
  > = {
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

  if (!hasData360) {
    requiredDirectives["script-src-elem"].push("'unsafe-eval'");
  }
  if (hasEngage) {
    requiredDirectives["script-src-elem"].push(CONSTANTS.VWO_ENGAGE_CDN);
    requiredDirectives["style-src"].push(CONSTANTS.VWO_ENGAGE_CDN);
  }

  const cspDirectiveMap: Record<string, string[]> = directives.reduce(
    (map, directive) => {
      const [name, ...values] = directive.split(" ");
      map[name] = values;
      return map;
    },
    {} as Record<string, string[]>
  );

  const isDirectivePresent = (directive: string): boolean =>
    !!cspDirectiveMap[directive];

  const isPresent: Record<string, boolean> = {
    "script-src-elem": isDirectivePresent("script-src-elem"),
    "script-src": isDirectivePresent("script-src"),
    "script-src*":
      isDirectivePresent("script-src") && isDirectivePresent("script-src-elem"),
    [CONSTANTS.CSP.DIRECTIVES.WORKER_SRC]: isDirectivePresent(
      CONSTANTS.CSP.DIRECTIVES.WORKER_SRC
    ),
    "connect-src": isDirectivePresent("connect-src"),
    "frame-src": isDirectivePresent("frame-src"),
    "img-src": isDirectivePresent("img-src"),
    "style-src": isDirectivePresent("style-src"),
    "child-src": isDirectivePresent("child-src"),
    "default-src": isDirectivePresent("default-src"),
  };

  if (!isPresent["script-src-elem"]) {
    requiredDirectives["script-src"].push(
      ...requiredDirectives["script-src-elem"]
    );
  }

  if (!isPresent[CONSTANTS.CSP.DIRECTIVES.WORKER_SRC]) {
    const workerSrcValues =
      requiredDirectives[CONSTANTS.CSP.DIRECTIVES.WORKER_SRC];
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
      // If neither script-src nor script-src-elem is present, then add the VWO domains to default-src!
      (!isPresent["script-src"] && !isPresent["script-src-elem"]) ||
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
    const [directiveName, ...values] = directiveStr.split(" ");
    const requiredValues = requiredDirectives[directiveName];
    if (!requiredValues || !requiredValues.length) {
      return { directive: directiveName, status: "pass", missingValues: [] };
    }
    const missingValues: string[] = [];
    const messageList = [];
    for (const requiredVal of requiredValues) {
      if (
        typeof requiredVal === "object"
          ? !directiveStr.match(requiredVal.regex)
          : !values.includes(requiredVal)
      ) {
        const requiredValue =
          typeof requiredVal === "object" ? requiredVal.value : requiredVal;
        missingValues.push(requiredValue);
        messageList.push([requiredValue, findMessageForDirective(directiveName, requiredValue)]);
      }
    }
    if (missingValues.length) isCspValid = false;
    return {
      directive: directiveName,
      status: missingValues.length === 0 ? "pass" : "fail",
      missingValues,
      messageList
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

  const formattedCspStr =
    directivesToFormattedCsp(directives) + (directives.length ? ";" : "");

  return {
    csp: formattedCspStr,
    results,
    revisedCSP,
  };
};

const getCspFromMeta = (metaTagEle: HTMLElement): string => {
  let cspContent = "";
  if (
    metaTagEle &&
    typeof metaTagEle === "object" &&
    "nodeType" in metaTagEle &&
    "tagName" in metaTagEle
  ) {
    // Retrieve the content attribute of the meta tag
    cspContent = metaTagEle.getAttribute("content") || cspContent;
  }
  return cspContent;
};

const getCspFromLink = async (
  url: string,
  configObj: {
    hasData360?: boolean;
    hasEngage?: boolean;
    metaFallback?: boolean;
  } = {}
): Promise<{ csp: string; statusCode: number }> => {
  // Helper function to extract CSP from headers
  const getCSPFromHeaders = (headers: GenericObject) => {
    return (
      headers["content-security-policy"] ||
      headers["Content-Security-Policy"] ||
      ""
    );
  };
  // Helper function to extract CSP from meta tags
  const getCSPFromMetaOfCurrentDOM = (html: string) => {
    const $ = load(html);
    return (
      $('meta[http-equiv="Content-Security-Policy"]').attr("content") || ""
    );
  };
  let csp: string = "";
  let statusCode: number = 404;
  try {
    const response = await axios.get(url);
    csp = getCSPFromHeaders(response.headers);
    statusCode = response.status;
    if (!csp && configObj.metaFallback) {
      const cspFromMeta = getCSPFromMetaOfCurrentDOM(response.data);
      csp = cspFromMeta || csp;
    }
  } catch (e) {
    return { csp: "", statusCode: 500 };
  }
  return { csp, statusCode };
};

export { getCspFromLink, getCspFromMeta, getCspAnalysis };
