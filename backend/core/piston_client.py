import os
import subprocess
import sys
import tempfile

MAX_OUTPUT = 10_000  # chars


def run_python(code: str, stdin: str = "", timeout_ms: int = 5000) -> dict:
    """
    Runs Python code in a subprocess with a timeout and a stripped environment.
    Returns {"stdout": str, "stderr": str, "error": str | None}.
    error is None only when the code ran successfully (exit code 0).
    """
    # Minimal env so user code can't read your DB URL / secrets from env vars.
    env = {}
    for key in ("SYSTEMROOT", "PATH"):
        if key in os.environ:
            env[key] = os.environ[key]

    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "main.py")
        with open(path, "w", encoding="utf-8") as f:
            f.write(code)

        try:
            proc = subprocess.run(
                [sys.executable, "-I", path],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=max(timeout_ms, 1000) / 1000 + 1,
                cwd=tmp,
                env=env,
            )
        except subprocess.TimeoutExpired:
            return {"stdout": "", "stderr": "", "error": "Time limit exceeded"}
        except Exception as e:
            return {"stdout": "", "stderr": "", "error": f"Judge error: {e}"}

    return {
        "stdout": proc.stdout[:MAX_OUTPUT],
        "stderr": proc.stderr[:MAX_OUTPUT],
        "error": None if proc.returncode == 0 else f"Runtime error (exit {proc.returncode})",
    }