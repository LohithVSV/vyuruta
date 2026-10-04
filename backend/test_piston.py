# Run from backend/:  python test_piston.py
from core.piston_client import run_python
r = run_python("print(int(input()) * 2)", stdin="21")
print(r)
print("PISTON OK" if r["stdout"].strip() == "42" else "PISTON NOT WORKING - see error above")