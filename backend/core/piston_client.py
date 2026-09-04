import requests

PISTON_URL = "https://emkc.org/api/v2/piston/execute"


def run_python(code: str, stdin: str = "", timeout_ms: int = 5000) -> dict:
    """
    Runs Python code against Piston's public execution API.
    Returns {"stdout": str, "stderr": str, "error": str | None}.
    error is None only when the code ran successfully (exit code 0).
    """
    payload = {
        "language": "python",
        "version": "*",
        "files": [{"content": code}],
        "stdin": stdin,
        "run_timeout": timeout_ms,
    }
    try:
        resp = requests.post(PISTON_URL, json=payload, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as e:
        return {"stdout": "", "stderr": "", "error": f"Judge unreachable: {e}"}

    data = resp.json()
    run = data.get("run", {})
    compile_ = data.get("compile", {})

    if compile_ and compile_.get("code") not in (None, 0):
        return {"stdout": "", "stderr": compile_.get("stderr", ""), "error": "Compile error"}

    return {
        "stdout": run.get("stdout", ""),
        "stderr": run.get("stderr", ""),
        "error": None if run.get("code") == 0 else f"Runtime error (exit {run.get('code')})",
    }