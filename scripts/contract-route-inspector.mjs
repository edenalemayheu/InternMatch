const METHODS = new Set(['get', 'post', 'patch', 'put', 'delete']);
const RESPONSE = /\bres\.(?:json|status|send|end|redirect)\s*\(/;
const STUB = /\bTODO\b|not implemented|status\s*\(\s*501\s*\)/i;

function skipQuoted(source, start) {
  const quote = source[start];
  for (let i = start + 1; i < source.length; i++) {
    if (source[i] === '\\') { i++; continue; }
    if (source[i] === quote) return i + 1;
  }
  return source.length;
}

function skipTrivia(source, start) {
  let i = start;
  while (i < source.length) {
    if (/\s/.test(source[i])) { i++; continue; }
    if (source.startsWith('//', i)) { const end = source.indexOf('\n', i + 2); i = end < 0 ? source.length : end + 1; continue; }
    if (source.startsWith('/*', i)) { const end = source.indexOf('*/', i + 2); i = end < 0 ? source.length : end + 2; continue; }
    break;
  }
  return i;
}

function matchingDelimiter(source, start, opener = '(', closer = ')') {
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === "'" || source[i] === '"' || source[i] === '`') { i = skipQuoted(source, i) - 1; continue; }
    if (source.startsWith('//', i)) { const end = source.indexOf('\n', i + 2); i = end < 0 ? source.length : end; continue; }
    if (source.startsWith('/*', i)) { const end = source.indexOf('*/', i + 2); i = end < 0 ? source.length : end + 1; continue; }
    if (source[i] === opener) depth++;
    if (source[i] === closer && --depth === 0) return i;
  }
  return -1;
}

function splitArguments(source) {
  const parts = [];
  let start = 0, round = 0, square = 0, curly = 0;
  for (let i = 0; i < source.length; i++) {
    if (source[i] === "'" || source[i] === '"' || source[i] === '`') { i = skipQuoted(source, i) - 1; continue; }
    if (source.startsWith('//', i)) { const end = source.indexOf('\n', i + 2); i = end < 0 ? source.length : end; continue; }
    if (source.startsWith('/*', i)) { const end = source.indexOf('*/', i + 2); i = end < 0 ? source.length : end + 1; continue; }
    const char = source[i];
    if (char === '(') round++; else if (char === ')') round--;
    else if (char === '[') square++; else if (char === ']') square--;
    else if (char === '{') curly++; else if (char === '}') curly--;
    else if (char === ',' && round === 0 && square === 0 && curly === 0) { parts.push(source.slice(start, i).trim()); start = i + 1; }
  }
  parts.push(source.slice(start).trim());
  return parts;
}

export function inspectRegistrations(source, expression = /\brouter\.(get|post|patch|put|delete)\s*\(/gi, prefix = '/api') {
  const registrations = [];
  const searchable = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, value => value.replace(/[^\r\n]/g, ' '));
  for (const match of searchable.matchAll(expression)) {
    const open = source.indexOf('(', match.index);
    const close = matchingDelimiter(source, open);
    if (close < 0) { registrations.push({ method: match[1].toUpperCase(), path: null, handlerArgs: [], malformed: true }); continue; }
    const args = splitArguments(source.slice(open + 1, close));
    const rawPath = args[0]?.match(/^(['"`])([\s\S]*)\1$/);
    const routePath = rawPath?.[2];
    registrations.push({
      method: match[1].toUpperCase(),
      path: routePath ? `${prefix}${routePath === '/' ? '' : routePath}` : null,
      handlerArgs: args.slice(1),
      malformed: !routePath,
    });
  }
  return registrations;
}

function helperResponds(name, source) {
  const declaration = new RegExp(`\\bfunction\\s+${name}\\s*\\(`).exec(source);
  if (!declaration) return false;
  const bodyStart = source.indexOf('{', declaration.index);
  const bodyEnd = matchingDelimiter(source, bodyStart, '{', '}');
  return bodyEnd > bodyStart && RESPONSE.test(source.slice(bodyStart, bodyEnd + 1));
}

export function hasRealHandler(registration, source) {
  if (registration.malformed || registration.handlerArgs.length === 0) return false;
  const finalHandler = registration.handlerArgs.at(-1);
  if (STUB.test(finalHandler)) return false;
  if (/(?:=>|\bfunction\b)/.test(finalHandler)) return RESPONSE.test(finalHandler);
  const helper = finalHandler.match(/^([A-Za-z_$][\w$]*)\s*\(/)?.[1];
  return Boolean(helper && helperResponds(helper, source));
}

export function handlerFailure(registration, source) {
  if (registration.malformed) return 'route path is not a static string';
  if (!registration.handlerArgs.length) return 'route has no handler';
  if (!hasRealHandler(registration, source)) return 'route handler is missing a response or is a stub';
  return null;
}
