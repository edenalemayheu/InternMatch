// Compatibility export for the service path referenced by the original API spec.
// The pure algorithm lives under src/matching; this module only adapts it to storage.
export { runMatching, computeMatches } from '../matching/matchingEngine.js';
