import CONSTANTS from "./constants";

type CRITICALITY = "high" | "medium" | "low";

const messageStore: {
  [props: string]: { value?: string; msg: string; regex?: RegExp; criticality?: CRITICALITY }[] | string[];
} = {
  "script-src-elem": [
    {
      value: "'unsafe-inline'",
      msg: "the inline script tags will cease to function causing loading issues in VWO",
      criticality: "high"
    },
    {
      regex: /(?:dev|\*)\.visualwebsiteoptimizer\.com/,
      msg: "the scripts required for running VWO will not be loaded",
      criticality: "high"
    },
    {
      value: CONSTANTS.VWO_ENGAGE_CDN,
      msg: "the script tags required for loading VWO Engage will fease to function",
      criticality: "medium"
    },
    {
      value: "'unsafe-eval'",
      msg: "the absence of this directive will cause issues in VWO's functioning",
      criticality: "high"
    },
  ],
  "script-src": ["script-src-elem", CONSTANTS.CSP.DIRECTIVES.WORKER_SRC],
  [CONSTANTS.CSP.DIRECTIVES.WORKER_SRC]: [
    {
      value: "'self'",
      msg: "the worker script will not be allowed to load from the same origin",
      criticality: "high"
    },
    {
      value: "blob:",
      msg: "the worker script will not be allowed to load from blob URLs",
      criticality: "high"
    },
  ],
  "connect-src": [
    {
      value: "*.visualwebsiteoptimizer.com",
      msg: "the network calls required for performing data collection will be impacted",
      criticality: "high"
    },
    {
      value: "app.vwo.com",
      msg: "the network calls required for connecting", // not sure about this!
      criticality: "medium"
    },
  ],
  "frame-src": [
    {
      value: "*.visualwebsiteoptimizer.com",
      msg: "the preview debugger will not be able to load",
      criticality: "medium"
    },
    {
      value: "app.vwo.com",
      msg: "the network calls required for connecting", // not sure about this!
      criticality: "medium"
    },
  ],
  "img-src": [
    {
      value: CONSTANTS.USER_UPLOADS_DOMAIN,
      msg: "the images uploaded by the user will not be loaded",
      criticality: "medium"
    },
    {
      value: "*.visualwebsiteoptimizer.com",
      msg: "the images loaded via VWO will not be loaded",
      criticality: "medium"
    },
    {
      value: "app.vwo.com",
      msg: "the network calls required for connecting", // not sure about this!
      criticality: "medium"
    },
  ],
  "style-src": [
    {
      value: "'unsafe-inline'",
      msg: "the inline style tags will cease to function leading to issues in preview debugger",
      criticality: "medium"
    },
    {
      value: "*.visualwebsiteoptimizer.com",
      msg: "the styles required for loading the VWO editor will not be loaded",
      criticality: "medium"
    },
    {
      value: CONSTANTS.VWO_ENGAGE_CDN,
      msg: "the styles required for loading VWO Engage will cease to function",
      criticality: "medium"
    },
  ],
  "child-src": [CONSTANTS.CSP.DIRECTIVES.WORKER_SRC],
  "default-src": ["script-src", "img-src"], // Storing the directives here directly since we need to re-use their messages so as to prevent duplicate messages being stored!
};

export const findMessageForDirective = (
  directiveName: string,
  directiveReqValue: string
): { msg: string; criticality: CRITICALITY } => {
  let value: { msg: string; criticality: CRITICALITY } = { msg: "NA", criticality: "low"};
  if (Array.isArray(messageStore[directiveName])) {
    const messageStoreList = messageStore[directiveName];
    for (let idx = 0; idx < messageStoreList.length; idx++) {
      const msgEntry = messageStoreList[idx];
      if (value.msg !== "NA") {
        break;
      }
      if (typeof msgEntry === "string") {
        value = findMessageForDirective(msgEntry, directiveReqValue);
      } else if (
        msgEntry.value === directiveReqValue ||
        msgEntry?.regex?.test(directiveReqValue)
      ) {
        return { msg: msgEntry.msg, criticality: msgEntry.criticality || "low"};
      }
    }
  }
  return value;
};
