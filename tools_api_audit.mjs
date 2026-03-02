import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const BACKEND_DIR = path.join(ROOT, "pupoo_backend", "src", "main", "java");
const FRONTEND_SRC = path.join(ROOT, "pupoo_frontend", "src");
const OUT_DIR = path.join(ROOT, "docs", "api");

function walk(dir, pred = () => true, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, pred, acc);
    else if (pred(p)) acc.push(p);
  }
  return acc;
}

function toPosix(p) {
  return p.replace(/\\/g, "/");
}

function normalizePath(raw) {
  if (raw == null) return "/";
  let p = String(raw).trim();
  if (!p) return "/";
  p = p.replace(/^['"`]|['"`]$/g, "");
  if (/^https?:\/\//i.test(p)) {
    try {
      p = new URL(p).pathname;
    } catch {
      // noop
    }
  }
  const apiIdx = p.indexOf("/api/");
  if (apiIdx >= 0) p = p.slice(apiIdx);
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\?.*$/, "");
  p = p.replace(/\$\{[^}]+\}/g, "{param}");
  p = p.replace(/:\w+/g, "{param}");
  p = p.replace(/\/+/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

function routeKey(method, fullPath) {
  const normalized = normalizePath(fullPath)
    .split("/")
    .map((seg) => (seg.startsWith("{") && seg.endsWith("}") ? "*" : seg))
    .join("/");
  return `${method.toUpperCase()} ${normalized}`;
}

function extractPaths(args) {
  if (args == null) return [""];
  const a = args.replace(/\s+/g, " ").trim();
  if (!a) return [""];

  const quoted = (s) => [...s.matchAll(/"([^"]*)"/g)].map((m) => m[1]);

  const arrByNamed = a.match(/(?:value|path)\s*=\s*\{([^}]*)\}/);
  if (arrByNamed) {
    const v = quoted(arrByNamed[1]);
    return v.length ? v : [""];
  }

  const oneByNamed = a.match(/(?:value|path)\s*=\s*"([^"]*)"/);
  if (oneByNamed) return [oneByNamed[1]];

  const directArr = a.match(/^\{([^}]*)\}/);
  if (directArr) {
    const v = quoted(directArr[1]);
    return v.length ? v : [""];
  }

  const directOne = a.match(/^"([^"]*)"/);
  if (directOne) return [directOne[1]];

  return [""];
}

function extractRequestMethods(args) {
  if (!args) return ["REQUEST"];
  const methods = [...args.matchAll(/RequestMethod\.(GET|POST|PUT|PATCH|DELETE)/g)].map((m) => m[1]);
  return methods.length ? methods : ["REQUEST"];
}

function combinePaths(base, sub) {
  const b = normalizePath(base || "");
  const s = normalizePath(sub || "");
  if (b === "/" && s === "/") return "/";
  if (b === "/") return s;
  if (s === "/") return b;
  return normalizePath(`${b}/${s}`);
}

function extractBackendRoutes() {
  const files = walk(BACKEND_DIR, (p) => p.endsWith("Controller.java"));
  const routes = [];

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const classMatch = text.match(/class\s+(\w+)/);
    const controllerName = classMatch?.[1] || path.basename(file, ".java");
    const classIdx = classMatch?.index ?? 0;
    const header = text.slice(0, classIdx);

    let classPaths = [""];
    const classReqMatches = [...header.matchAll(/@RequestMapping(?:\s*\(([\s\S]*?)\))?/g)];
    if (classReqMatches.length) {
      classPaths = extractPaths(classReqMatches[classReqMatches.length - 1][1]);
    }

    const body = text.slice(classIdx);
    const annRegex = /@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)(?:\s*\(([\s\S]*?)\))?/g;

    let m;
    while ((m = annRegex.exec(body)) !== null) {
      const ann = m[1];
      const args = m[2] || "";
      const after = body.slice(annRegex.lastIndex);
      const methodSig = after.match(/\b(public|protected|private)\s+[\w<>,\[\]\s?]+\s+(\w+)\s*\(/);
      if (!methodSig) continue;
      const methodName = methodSig[2];

      const methodPaths = extractPaths(args);
      const methods = ann === "RequestMapping"
        ? extractRequestMethods(args)
        : [ann.replace("Mapping", "").toUpperCase()];

      for (const httpMethod of methods) {
        for (const cp of classPaths) {
          for (const mp of methodPaths) {
            const fullPath = combinePaths(cp, mp);
            routes.push({
              method: httpMethod,
              fullPath,
              controllerName,
              methodName,
              admin: fullPath === "/api/admin" || fullPath.startsWith("/api/admin/"),
            });
          }
        }
      }
    }
  }

  const unique = [];
  const seen = new Set();
  for (const r of routes) {
    const key = `${r.method}|${r.fullPath}|${r.controllerName}|${r.methodName}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }

  unique.sort((a, b) => `${a.method} ${a.fullPath}`.localeCompare(`${b.method} ${b.fullPath}`));
  return unique;
}

function extractFunctionSpans(text) {
  const spans = [];
  const patterns = [
    /function\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
    /([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?\([^)]*\)\s*=>/g,
    /([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g,
  ];

  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      spans.push({ index: m.index, name: m[1] });
    }
  }

  spans.sort((a, b) => a.index - b.index);
  return spans;
}

function nearestFn(spans, idx) {
  let ans = "anonymous";
  for (const s of spans) {
    if (s.index <= idx) ans = s.name;
    else break;
  }
  return ans;
}

function extractUrlVarAssignments(text) {
  const assignments = [];
  const patterns = [
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*buildUrl\s*\(\s*(["'`])([\s\S]*?)\2/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(["'`])([\s\S]*?)\2/g,
  ];

  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      const rawPath = m[3];
      if (!rawPath || !rawPath.includes("/api")) continue;
      assignments.push({
        index: m.index,
        name: m[1],
        rawPath,
      });
    }
  }

  assignments.sort((a, b) => a.index - b.index);
  return assignments;
}

function resolveUrlVariable(assignments, name, idx) {
  if (!name) return null;
  for (let i = assignments.length - 1; i >= 0; i -= 1) {
    const item = assignments[i];
    if (item.index <= idx && item.name === name) return item.rawPath;
  }
  return null;
}

function extractFrontendCalls() {
  const files = walk(
    FRONTEND_SRC,
    (p) => /\.(js|jsx|ts|tsx)$/.test(p) && !p.includes(`${path.sep}node_modules${path.sep}`) && !p.includes(`${path.sep}dist${path.sep}`),
  );

  const calls = [];

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const spans = extractFunctionSpans(text);
    const urlVars = extractUrlVarAssignments(text);

    const addCall = (method, rawPath, idx) => {
      if (!rawPath || !rawPath.includes("/api")) return;
      const fullPath = normalizePath(rawPath);
      calls.push({
        method: (method || "UNKNOWN").toUpperCase(),
        fullPath,
        filePath: toPosix(path.relative(ROOT, file)),
        functionName: nearestFn(spans, idx),
      });
    };

    const methodCallRegex = /\.(get|post|put|patch|delete)\s*\(\s*(["'`])([\s\S]*?)\2/g;
    let m;
    while ((m = methodCallRegex.exec(text)) !== null) {
      addCall(m[1], m[3], m.index);
    }

    const methodCallVarRegex = /\.(get|post|put|patch|delete)\s*\(\s*([A-Za-z_$][\w$]*)\s*(?:,|\))/g;
    while ((m = methodCallVarRegex.exec(text)) !== null) {
      const rawPath = resolveUrlVariable(urlVars, m[2], m.index);
      if (rawPath) addCall(m[1], rawPath, m.index);
    }

    const axiosCfgRegex = /\.request\s*\(\s*\{([\s\S]*?)\}\s*\)/g;
    while ((m = axiosCfgRegex.exec(text)) !== null) {
      const block = m[1];
      const method = block.match(/method\s*:\s*["'`]([A-Za-z]+)["'`]/)?.[1] || "UNKNOWN";
      const quotedUrl = block.match(/url\s*:\s*(["'`])([\s\S]*?)\1/)?.[2];
      if (quotedUrl) {
        addCall(method, quotedUrl, m.index);
      } else {
        const urlVar = block.match(/url\s*:\s*([A-Za-z_$][\w$]*)/)?.[1];
        const rawPath = resolveUrlVariable(urlVars, urlVar, m.index);
        if (rawPath) addCall(method, rawPath, m.index);
      }
    }

    const fetchRegex = /fetch\s*\(\s*(["'`])([\s\S]*?)\1\s*(?:,\s*\{([\s\S]*?)\})?\s*\)/g;
    while ((m = fetchRegex.exec(text)) !== null) {
      const method = m[3]?.match(/method\s*:\s*["'`]([A-Za-z]+)["'`]/)?.[1] || "GET";
      addCall(method, m[2], m.index);
    }

    const fetchVarRegex = /fetch\s*\(\s*([A-Za-z_$][\w$]*)\s*(?:,\s*\{([\s\S]*?)\})?\s*\)/g;
    while ((m = fetchVarRegex.exec(text)) !== null) {
      const method = m[2]?.match(/method\s*:\s*["'`]([A-Za-z]+)["'`]/)?.[1] || "GET";
      const rawPath = resolveUrlVariable(urlVars, m[1], m.index);
      if (rawPath) addCall(method, rawPath, m.index);
    }

  }

  const unique = [];
  const seen = new Set();
  for (const c of calls) {
    const key = `${c.method}|${c.fullPath}|${c.filePath}|${c.functionName}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }

  unique.sort((a, b) => `${a.method} ${a.fullPath}`.localeCompare(`${b.method} ${b.fullPath}`));
  return unique;
}

function matchRoutes(backendRoutes, frontendCalls) {
  const backendByKey = new Map();
  for (const b of backendRoutes) {
    const key = routeKey(b.method, b.fullPath);
    if (!backendByKey.has(key)) backendByKey.set(key, []);
    backendByKey.get(key).push(b);
  }

  const matched = [];
  const frontendOnly = [];
  const usedBackendKeys = new Set();

  for (const f of frontendCalls) {
    if (!f.fullPath.startsWith("/api/")) continue;

    const candidates = [];
    if (f.method !== "UNKNOWN") candidates.push(routeKey(f.method, f.fullPath));
    else {
      for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE", "REQUEST"]) {
        candidates.push(routeKey(m, f.fullPath));
      }
    }

    let found = null;
    for (const k of candidates) {
      const list = backendByKey.get(k);
      if (list?.length) {
        found = { key: k, backend: list[0] };
        break;
      }
    }

    if (found) {
      matched.push({ frontend: f, backend: found.backend });
      usedBackendKeys.add(found.key);
    } else {
      frontendOnly.push(f);
    }
  }

  const backendOnly = [];
  for (const b of backendRoutes) {
    const key = routeKey(b.method, b.fullPath);
    if (!usedBackendKeys.has(key)) backendOnly.push(b);
  }

  backendOnly.sort((a, b) => `${a.method} ${a.fullPath}`.localeCompare(`${b.method} ${b.fullPath}`));
  return { matched, frontendOnly, backendOnly };
}

function generateReport({ matched, frontendOnly, backendOnly }) {
  const line = [];
  line.push("# API 1:1 매칭 리포트");
  line.push("");
  line.push(`- 생성 시각: ${new Date().toISOString()}`);
  line.push(`- MATCHED: ${matched.length}건`);
  line.push(`- FRONTEND_ONLY: ${frontendOnly.length}건`);
  line.push(`- BACKEND_ONLY: ${backendOnly.length}건`);
  line.push("");

  line.push("## 1) MATCHED");
  line.push("");
  line.push("| HTTP | 경로 | 프론트 파일 | 프론트 함수 | 백엔드 컨트롤러#메서드 | 관리자 |\n|---|---|---|---|---|---|");
  for (const item of matched) {
    const f = item.frontend;
    const b = item.backend;
    line.push(`| ${b.method} | ${b.fullPath} | ${f.filePath} | ${f.functionName} | ${b.controllerName}#${b.methodName} | ${b.admin ? "Y" : "N"} |`);
  }
  if (matched.length === 0) line.push("| - | - | - | - | - | - |");
  line.push("");

  line.push("## 2) FRONTEND_ONLY");
  line.push("");
  line.push("| HTTP | 경로 | 파일 | 함수 |\n|---|---|---|---|");
  for (const f of frontendOnly) {
    line.push(`| ${f.method} | ${f.fullPath} | ${f.filePath} | ${f.functionName} |`);
  }
  if (frontendOnly.length === 0) line.push("| - | - | - | - |");
  line.push("");

  line.push("## 3) BACKEND_ONLY");
  line.push("");
  line.push("| HTTP | 경로 | 컨트롤러 | 메서드 | 관리자 |\n|---|---|---|---|---|");
  for (const b of backendOnly) {
    line.push(`| ${b.method} | ${b.fullPath} | ${b.controllerName} | ${b.methodName} | ${b.admin ? "Y" : "N"} |`);
  }
  if (backendOnly.length === 0) line.push("| - | - | - | - | - |");
  line.push("");

  return line.join("\n");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const backendRoutes = extractBackendRoutes();
const frontendCalls = extractFrontendCalls();
const match = matchRoutes(backendRoutes, frontendCalls);

fs.writeFileSync(path.join(OUT_DIR, "backend_routes.json"), JSON.stringify(backendRoutes, null, 2), "utf8");
fs.writeFileSync(path.join(OUT_DIR, "frontend_calls.json"), JSON.stringify(frontendCalls, null, 2), "utf8");
fs.writeFileSync(path.join(OUT_DIR, "backend_only.json"), JSON.stringify(match.backendOnly, null, 2), "utf8");
fs.writeFileSync(path.join(OUT_DIR, "api_match_report_ko.md"), generateReport(match), "utf8");

console.log(JSON.stringify({
  backend: backendRoutes.length,
  frontend: frontendCalls.length,
  matched: match.matched.length,
  frontendOnly: match.frontendOnly.length,
  backendOnly: match.backendOnly.length,
}, null, 2));
