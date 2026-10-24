/* global importScripts, loadPyodide */
// Runs learner code in CPython compiled to WebAssembly (Pyodide), inside a Web Worker.
// The main thread terminates this worker if a run exceeds the time limit (infinite loops etc.).

importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

const HARNESS = `
import json, time, copy, traceback, sys
sys.setrecursionlimit(5000)
_tests = json.loads(TESTS_JSON)
_ns = {"__name__": "solution"}
_res = {"error": None, "tests": []}

def _safe(v):
    try:
        return json.dumps(v)
    except Exception:
        return repr(v)

def _norm(v):
    if isinstance(v, tuple):
        v = list(v)
    if isinstance(v, list):
        return [_norm(x) for x in v]
    return v

try:
    exec(USER_CODE, _ns)
except Exception:
    _res["error"] = traceback.format_exc(limit=0).strip()

if _res["error"] is None:
    _fn = _ns.get(FN_NAME)
    if not callable(_fn):
        _res["error"] = f"Define a function named {FN_NAME}(...)"
    else:
        for t in _tests:
            args = copy.deepcopy(t["args"])
            st = time.perf_counter()
            try:
                got = _fn(*args)
                ms = (time.perf_counter() - st) * 1000
                _res["tests"].append({"ok": _norm(got) == _norm(t["expected"]), "got": _safe(got), "ms": ms})
            except Exception as e:
                ms = (time.perf_counter() - st) * 1000
                _res["tests"].append({"ok": False, "error": f"{type(e).__name__}: {e}", "ms": ms})

json.dumps(_res)
`;

const ready = loadPyodide().then((py) => {
  self.postMessage({ type: "ready" });
  return py;
});

self.onmessage = async (e) => {
  const { id, code, fn, tests } = e.data;
  let stdout = "";
  try {
    const py = await ready;
    py.setStdout({ batched: (s) => (stdout += s + "\n") });
    py.setStderr({ batched: (s) => (stdout += s + "\n") });
    py.globals.set("USER_CODE", code);
    py.globals.set("FN_NAME", fn);
    py.globals.set("TESTS_JSON", JSON.stringify(tests));
    const out = py.runPython(HARNESS);
    self.postMessage({ id, result: { ...JSON.parse(out), stdout } });
  } catch (err) {
    self.postMessage({ id, result: { error: String((err && err.message) || err), tests: [], stdout } });
  }
};
