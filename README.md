# VWO-CSP-EVALUATOR

This repository is used to process and analyze Content Security Policies (CSPs). It includes functionality to fetch CSPs from headers or meta tags, analyze the CSP directives, and generate a revised CSP if necessary.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Analyzing CSP](#analyzing-csp)
  - [Fetching CSP from Meta Tag](#fetching-csp-from-meta-tag)
  - [Fetching CSP from URL](#fetching-csp-from-url)
- [API](#api)
  - [`getCspAnalysis`](#getcspanalysis)
  - [`getCspFromMeta`](#getcspfrommeta)
  - [`getCspFromLink`](#getcspfromlink)
- [Contributing](#contributing)
- [License](#license)

## Installation

To use this package, you need to have Node.js installed. Then, you can install the package and its dependencies using npm:

```bash
Put the repo URL inside the package.json (as a dependency)

{
"vwo-csp-evaluator": "git@github.com:HellOfACoder1132/vwo-csp-evaluator.git#{commitId|branchName}"
}

and do,

npm install
```

## Usage

### Analyzing CSP

The `getCspAnalysis` function analyzes a given CSP and returns the analysis results and a revised CSP if necessary.

```javascript
import { getCspAnalysis } from './path/to/cspProcessor';

const csp = "default-src 'self'; script-src 'self' 'unsafe-inline';";
const options = {
  csp: csp,
  hasData360: false,
  hasEngage: true
};

const result = getCspAnalysis(options);
console.log(result);
```

### Fetching CSP from Meta Tag

The `getCspFromMeta` function retrieves the CSP from a meta tag in the HTML.

```javascript
import { getCspFromMeta } from './path/to/cspProcessor';

// Assuming metaTagEle is an HTMLElement representing the meta tag
const metaTagEle = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
const csp = getCspFromMeta(metaTagEle);
console.log(csp);
```

### Fetching CSP from URL

The `getCspFromLink` function fetches the CSP from a given URL. If the CSP is not found in the headers, it can optionally fall back to checking the meta tags in the HTML.

```javascript
import { getCspFromLink } from './path/to/cspProcessor';

const url = 'https://example.com';
const configObj = {
  hasData360: false,
  hasEngage: true,
  metaFallback: true // Used for extracting CSP from meta tag if no header of the URL had a CSP!
};

getCspFromLink(url, configObj).then(csp => {
  console.log(csp);
});
```

## API

### `getCspAnalysis`

Analyzes a given CSP and returns the analysis results and a revised CSP if necessary.

#### Parameters

- `options` (`AnalyzeCspOptions`): The options for analyzing the CSP.
  - `csp` (`string`): The CSP to analyze.
  - `hasData360` (`boolean`): Indicates if Data360 is used.
  - `hasEngage` (`boolean`): Indicates if Engage is used.

#### Returns

- `AnalyzeCspResult`: The result of the CSP analysis, including the original CSP, the analysis results, and the revised CSP if necessary.

### `getCspFromMeta`

Retrieves the CSP from a meta tag in the HTML.

#### Parameters

- `metaTagEle` (`HTMLElement`): The meta tag element.

#### Returns

- `string`: The CSP found in the meta tag.

### `getCspFromLink`

Fetches the CSP from a given URL. If the CSP is not found in the headers, it can optionally fall back to checking the meta tags in the HTML.

#### Parameters

- `url` (`string`): The URL to fetch the CSP from.
- `configObj` (`object`): The configuration object.
  - `hasData360` (`boolean`): Indicates if Data360 is used.
  - `hasEngage` (`boolean`): Indicates if Engage is used.
  - `metaFallback` (`boolean`): Indicates if it should fall back to checking the meta tags in the HTML if the CSP is not found in the headers.

#### Returns

- `Promise<string>`: A promise that resolves to the CSP found at the URL.
