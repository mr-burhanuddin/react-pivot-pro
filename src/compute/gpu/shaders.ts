/**
 * WGSL compute shaders for aggregations.
 * First milestone: global (non-grouped) aggregations only.
 * Grouped pivot remains CPU fallback (documented limitation).
 *
 * Workgroup reduction pattern: each invocation loads one element,
 * folds into workgroup shared memory, then workgroup 0 writes partial.
 * Host performs final reduction over partials (keeps shader simple + portable).
 *
 * Numeric: f32. Float64 WGSL not yet universal; CPU is f64 oracle. Tolerance documented.
 * Valid mask: u32 array of 0/1 per row (1 = finite number, 0 = null/NaN/Infinity).
 */

// Shared prefix: workgroup size 64 balances occupancy. Keep in sync with GPU_WORKGROUP_SIZE.
const WORKGROUP = 64;

// Global SUM: sum of valid f32 values → partial sums per workgroup
export const WGSL_GLOBAL_SUM = `
@group(0) @binding(0) var<storage, read> values: array<f32>;
@group(0) @binding(1) var<storage, read> valid: array<u32>;
@group(0) @binding(2) var<storage, read_write> partials: array<f32>;
@group(0) @binding(3) var<uniform> params: Params;

struct Params { n: u32, workgroups: u32 }

var<workgroup> shared: array<f32, ${WORKGROUP}>;

@compute @workgroup_size(${WORKGROUP})
fn main(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(local_invocation_id) lid: vec3<u32>, @builtin(workgroup_id) wid: vec3<u32>) {
  let i = gid.x;
  var v: f32 = 0.0;
  if (i < params.n) {
    if (valid[i] == 1u) { v = values[i]; }
  }
  shared[lid.x] = v;
  workgroupBarrier();
  // reduction in shared
  for (var s: u32 = ${WORKGROUP}u / 2u; s > 0u; s >>= 1u) {
    if (lid.x < s) { shared[lid.x] += shared[lid.x + s]; }
    workgroupBarrier();
  }
  if (lid.x == 0u) { partials[wid.x] = shared[0]; }
}
`;

// Global COUNT: counts valid entries
export const WGSL_GLOBAL_COUNT = `
@group(0) @binding(0) var<storage, read> valid: array<u32>;
@group(0) @binding(1) var<storage, read_write> partials: array<u32>;
@group(0) @binding(2) var<uniform> params: Params;
struct Params { n: u32, workgroups: u32 }
var<workgroup> shared: array<u32, ${WORKGROUP}>;
@compute @workgroup_size(${WORKGROUP})
fn main(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(local_invocation_id) lid: vec3<u32>, @builtin(workgroup_id) wid: vec3<u32>) {
  let i = gid.x;
  var v: u32 = 0u;
  if (i < params.n && valid[i] == 1u) { v = 1u; }
  shared[lid.x] = v;
  workgroupBarrier();
  for (var s: u32 = ${WORKGROUP}u / 2u; s > 0u; s >>= 1u) {
    if (lid.x < s) { shared[lid.x] += shared[lid.x + s]; }
    workgroupBarrier();
  }
  if (lid.x == 0u) { partials[wid.x] = shared[0]; }
}
`;

// Global MIN: per-workgroup min of valid values; init to large f32 max
export const WGSL_GLOBAL_MIN = `
@group(0) @binding(0) var<storage, read> values: array<f32>;
@group(0) @binding(1) var<storage, read> valid: array<u32>;
@group(0) @binding(2) var<storage, read_write> partials: array<f32>;
@group(0) @binding(3) var<uniform> params: Params;
struct Params { n: u32, workgroups: u32 }
var<workgroup> shared: array<f32, ${WORKGROUP}>;
@compute @workgroup_size(${WORKGROUP})
fn main(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(local_invocation_id) lid: vec3<u32>, @builtin(workgroup_id) wid: vec3<u32>) {
  let i = gid.x;
  var v: f32 = 3.4028235e+38; // f32 max
  var has: bool = false;
  if (i < params.n && valid[i] == 1u) { v = values[i]; has = true; }
  shared[lid.x] = select(3.4028235e+38, v, has);
  workgroupBarrier();
  for (var s: u32 = ${WORKGROUP}u / 2u; s > 0u; s >>= 1u) {
    if (lid.x < s) { shared[lid.x] = min(shared[lid.x], shared[lid.x + s]); }
    workgroupBarrier();
  }
  if (lid.x == 0u) { partials[wid.x] = shared[0]; }
}
`;

export const WGSL_GLOBAL_MAX = WGSL_GLOBAL_MIN.replaceAll("min(", "max(").replaceAll("3.4028235e+38", "-3.4028235e+38");

// AVG is SUM + COUNT; host computes sum / count. No separate shader needed.
// For f64 precision fallback: host or CPU computes AVG from sum/count doubles.

/**
 * Atomic note (architecture doc §14):
 * Per-group reductions would require atomics (multiple workgroups → same group output).
 * Current core browsers lack atomicAdd<f32>. Two-phase approach (workgroup partials + CPU final)
 * avoids cross-workgroup atomics entirely for global case. Grouped case remains CPU fallback
 * until per-group strategy (shared groups → separate partials per group) is validated.
 */
