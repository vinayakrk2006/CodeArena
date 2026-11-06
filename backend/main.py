import os
import asyncio
from typing import Literal

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

JUDGE0_API_URL = os.getenv("JUDGE0_API_URL", "https://ce.judge0.com").rstrip("/")
JUDGE0_API_KEY = os.getenv("JUDGE0_API_KEY", "").strip()
JUDGE0_AUTH_HEADER = os.getenv("JUDGE0_AUTH_HEADER", "X-Auth-Token").strip()
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

LANGUAGES = {
    "python": {"id": 71, "name": "Python 3"},
    "java": {"id": 62, "name": "Java (OpenJDK 17)"},
    "c": {"id": 50, "name": "C (GCC 9.2.0)"},
}

PROBLEMS = {
    "sum-two-integers": {
        "id": "sum-two-integers",
        "title": "Sum of Two Integers",
        "difficulty": "Easy",
        "acceptance": "92.4%",
        "topics": ["Math", "Input/Output"],
        "description": (
            "Given two integers a and b, print their sum.\n\n"
            "Input: Two integers separated by a space.\n"
            "Output: A single integer — the sum of a and b.\n\n"
            "Example 1:\nInput: 2 3\nOutput: 5\n\n"
            "Example 2:\nInput: -10 7\nOutput: -3"
        ),
        "sample_input": "2 3\n",
        "sample_output": "5\n",
        "tests": [
            {"input": "2 3\n", "expected": "5\n", "hidden": False},
            {"input": "-10 7\n", "expected": "-3\n", "hidden": False},
            {"input": "0 0\n", "expected": "0\n", "hidden": True},
            {"input": "100000 250000\n", "expected": "350000\n", "hidden": True},
            {"input": "-50 -20\n", "expected": "-70\n", "hidden": True},
        ],
    },
    "even-or-odd": {
        "id": "even-or-odd",
        "title": "Even or Odd",
        "difficulty": "Easy",
        "acceptance": "88.1%",
        "topics": ["Math", "Conditionals"],
        "description": (
            "Given an integer n, print `Even` if n is even; otherwise print `Odd`.\n\n"
            "Input: A single integer n.\n"
            "Output: `Even` or `Odd`.\n\n"
            "Example 1:\nInput: 4\nOutput: Even\n\n"
            "Example 2:\nInput: 7\nOutput: Odd"
        ),
        "sample_input": "4\n",
        "sample_output": "Even\n",
        "tests": [
            {"input": "4\n", "expected": "Even\n", "hidden": False},
            {"input": "7\n", "expected": "Odd\n", "hidden": False},
            {"input": "0\n", "expected": "Even\n", "hidden": True},
            {"input": "-3\n", "expected": "Odd\n", "hidden": True},
        ],
    },
}

STARTER_CODE = {
    "sum-two-integers": {
        "python": "a, b = map(int, input().split())\nprint(a + b)\n",
        "java": "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        System.out.println(a + b);\n    }\n}\n",
        "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    long long a, b;\n    cin >> a >> b;\n    cout << a + b << endl;\n    return 0;\n}\n",
    },
    "even-or-odd": {
        "python": "n = int(input())\nprint('Even' if n % 2 == 0 else 'Odd')\n",
        "java": "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(n % 2 == 0 ? \"Even\" : \"Odd\");\n    }\n}\n",
        "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    long long n;\n    cin >> n;\n    cout << (n % 2 == 0 ? \"Even\" : \"Odd\") << endl;\n    return 0;\n}\n",
    },
}

import re, sqlite3, datetime as dt
from contextlib import closing

DB_PATH = os.getenv("DB_PATH", "codearena.db")
PTS = {"Easy": 10, "Medium": 20, "Hard": 30}

PROBLEMS.update({
    "sum-1-to-n": {
        "id": "sum-1-to-n", "title": "Sum of 1 to N", "difficulty": "Easy", "acceptance": "85.0%",
        "topics": ["Loops", "Math"],
        "description": "Given a positive integer n, print the sum 1 + 2 + ... + n.\n\nInput: A single integer n.\nOutput: The sum.\n\nExample 1:\nInput: 5\nOutput: 15",
        "sample_input": "5\n", "sample_output": "15\n",
        "tests": [
            {"input": "5\n", "expected": "15\n", "hidden": False},
            {"input": "1\n", "expected": "1\n", "hidden": False},
            {"input": "100\n", "expected": "5050\n", "hidden": True},
            {"input": "1000\n", "expected": "500500\n", "hidden": True},
        ],
    },
    "palindrome-check": {
        "id": "palindrome-check", "title": "Palindrome Check", "difficulty": "Medium", "acceptance": "71.3%",
        "topics": ["Strings"],
        "description": "Given a word s (no spaces), print Yes if it reads the same backwards, otherwise print No.\n\nInput: A single word s.\nOutput: Yes or No.\n\nExample 1:\nInput: racecar\nOutput: Yes\n\nExample 2:\nInput: hello\nOutput: No",
        "sample_input": "racecar\n", "sample_output": "Yes\n",
        "tests": [
            {"input": "racecar\n", "expected": "Yes\n", "hidden": False},
            {"input": "hello\n", "expected": "No\n", "hidden": False},
            {"input": "a\n", "expected": "Yes\n", "hidden": True},
            {"input": "abba\n", "expected": "Yes\n", "hidden": True},
            {"input": "abca\n", "expected": "No\n", "hidden": True},
        ],
    },
    "max-subarray": {
        "id": "max-subarray", "title": "Maximum Subarray Sum", "difficulty": "Hard", "acceptance": "48.9%",
        "topics": ["Arrays", "Dynamic Programming"],
        "description": "Given n integers, print the largest sum of any non-empty contiguous subarray.\n\nInput: The first line has n. The second line has n integers.\nOutput: The maximum subarray sum.\n\nExample 1:\nInput: 5\n1 -2 3 4 -1\nOutput: 7",
        "sample_input": "5\n1 -2 3 4 -1\n", "sample_output": "7\n",
        "tests": [
            {"input": "5\n1 -2 3 4 -1\n", "expected": "7\n", "hidden": False},
            {"input": "3\n-3 -1 -2\n", "expected": "-1\n", "hidden": False},
            {"input": "1\n5\n", "expected": "5\n", "hidden": True},
            {"input": "6\n2 -1 2 3 -9 4\n", "expected": "6\n", "hidden": True},
        ],
    },
})

SKELETON = {
    "python": "# Read from stdin, print the answer\n",
    "java": "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // your code here\n    }\n}\n",
    "c": "#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}\n",
}
for _pid in ("sum-1-to-n", "palindrome-check", "max-subarray"):
    STARTER_CODE[_pid] = dict(SKELETON)
for _pid, _c in {
    "sum-two-integers": "#include <stdio.h>\n\nint main() {\n    long long a, b;\n    scanf(\"%lld %lld\", &a, &b);\n    printf(\"%lld\\n\", a + b);\n    return 0;\n}\n",
    "even-or-odd": "#include <stdio.h>\n\nint main() {\n    long long n;\n    scanf(\"%lld\", &n);\n    printf(\"%s\\n\", n % 2 == 0 ? \"Even\" : \"Odd\");\n    return 0;\n}\n",
}.items():
    STARTER_CODE[_pid].pop("cpp", None)
    STARTER_CODE[_pid]["c"] = _c

MCQS = [
    {"id": "py-loop-range", "lang": "python", "difficulty": "Easy", "topic": "Loops", "question": "What does this print?",
     "code": "for i in range(3):\n    print(i)", "options": ["0 1 2 (one per line)", "1 2 3", "0 1 2 3", "3"], "answer": 0,
     "explanation": "range(3) starts at 0 and stops before 3."},
    {"id": "py-default-arg", "lang": "python", "difficulty": "Hard", "topic": "Functions", "question": "What does the last line print?",
     "code": "def f(a, b=[]):\n    b.append(a)\n    return b\nf(1)\nprint(f(2))", "options": ["[2]", "[1, 2]", "[1]", "Error"], "answer": 1,
     "explanation": "The default list is created once and shared between calls."},
    {"id": "java-string-eq", "lang": "java", "difficulty": "Medium", "topic": "Strings", "question": "What does this print?",
     "code": "String a = \"hi\";\nString b = new String(\"hi\");\nSystem.out.println(a == b);", "options": ["true", "false", "Compile error", "hi"], "answer": 1,
     "explanation": "== compares references. new String creates a separate object, so use equals() to compare text."},
    {"id": "java-hashmap", "lang": "java", "difficulty": "Hard", "topic": "Collections", "question": "Which statement about HashMap is true?",
     "code": "", "options": ["It allows one null key", "It is thread-safe", "It keeps insertion order", "It rejects null values"], "answer": 0,
     "explanation": "HashMap allows one null key and many null values. It is not thread-safe and does not keep order."},
    {"id": "c-loop-print", "lang": "c", "difficulty": "Easy", "topic": "Loops", "question": "What does this print?",
     "code": "for (int i = 0; i < 3; i++)\n    printf(\"%d \", i);", "options": ["0 1 2", "1 2 3", "0 1 2 3", "Nothing"], "answer": 0,
     "explanation": "i takes the values 0, 1 and 2, each followed by a space."},
    {"id": "c-null-ptr", "lang": "c", "difficulty": "Hard", "topic": "Pointers", "question": "What happens here?",
     "code": "int *p = NULL;\n*p = 5;", "options": ["Stores 5 safely", "Undefined behavior (usually a crash)", "Prints 5", "Compile error"], "answer": 1,
     "explanation": "Writing through a NULL pointer is undefined behavior. It compiles, but typically crashes."},
]

from content import EXTRA_PROBLEMS, EXTRA_MCQS
PROBLEMS.update(EXTRA_PROBLEMS)
for _pid in EXTRA_PROBLEMS:
    STARTER_CODE[_pid] = dict(SKELETON)
MCQS.extend(EXTRA_MCQS)
for _pid in ("sum-two-integers", "even-or-odd"):
    STARTER_CODE[_pid] = dict(SKELETON)  # start empty, do not give away the answer

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

with closing(db()) as _c, _c:
    _c.execute("CREATE TABLE IF NOT EXISTS solves(user TEXT, kind TEXT, item TEXT, points INT, day TEXT, UNIQUE(user, kind, item))")

with closing(db()) as _c, _c:
    try:
        _c.execute("ALTER TABLE solves ADD COLUMN lang TEXT")
    except sqlite3.OperationalError:
        pass  # column already exists

def clean_user(name):
    name = (name or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9_ ]{2,20}", name):
        raise HTTPException(status_code=400, detail="Name must be 2-20 letters, numbers, spaces or underscores.")
    return name

def award(user, kind, item, difficulty, lang=None):
    pts = PTS.get(difficulty, 0)
    with closing(db()) as conn, conn:
        cur = conn.execute("INSERT OR IGNORE INTO solves(user, kind, item, points, day, lang) VALUES(?,?,?,?,?,?)", (user, kind, item, pts, dt.date.today().isoformat(), lang))
        return pts if cur.rowcount else 0

def streak_of(days):
    s, d, n = set(days), dt.date.today(), 0
    if d.isoformat() not in s:
        d -= dt.timedelta(days=1)
    while d.isoformat() in s:
        n += 1
        d -= dt.timedelta(days=1)
    return n

import hashlib, hmac, secrets, time
from fastapi import Depends, Header

SESSION_DAYS = 30
FAILS = {}

with closing(db()) as _c, _c:
    _c.execute("CREATE TABLE IF NOT EXISTS accounts(name TEXT PRIMARY KEY COLLATE NOCASE, email TEXT UNIQUE, salt TEXT, pw_hash TEXT)")
    _c.execute("CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, name TEXT, created TEXT)")

with closing(db()) as _c, _c:
    _c.execute("CREATE TABLE IF NOT EXISTS submissions(user TEXT, kind TEXT, item TEXT, verdict TEXT, lang TEXT, day TEXT)")
    _c.execute("CREATE INDEX IF NOT EXISTS submissions_user ON submissions(user)")
    for _col in ("location", "bio", "created"):
        try:
            _c.execute(f"ALTER TABLE accounts ADD COLUMN {_col} TEXT")
        except sqlite3.OperationalError:
            pass  # column already exists
    # accounts that solved things before submissions were tracked: count each solve as one accepted submission
    _c.execute("INSERT INTO submissions(user, kind, item, verdict, lang, day) SELECT user, kind, item, 'Accepted', lang, day FROM solves s WHERE NOT EXISTS (SELECT 1 FROM submissions x WHERE x.user = s.user AND x.kind = s.kind AND x.item = s.item)")

def record_submission(user, kind, item, accepted, lang):
    with closing(db()) as conn, conn:
        conn.execute("INSERT INTO submissions(user, kind, item, verdict, lang, day) VALUES(?,?,?,?,?,?)",
                     (user, kind, item, "Accepted" if accepted else "Rejected", lang, dt.date.today().isoformat()))

class RegisterRequest(BaseModel):
    name: str = Field(max_length=40)
    email: str = Field(max_length=120)
    password: str = Field(min_length=8, max_length=128)

class LoginRequest(BaseModel):
    email: str = Field(max_length=120)
    password: str = Field(max_length=128)

def hash_pw(pw, salt):
    return hashlib.pbkdf2_hmac("sha256", pw.encode(), bytes.fromhex(salt), 200_000).hex()

def tok_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()

def new_session(name):
    token = secrets.token_urlsafe(32)
    with closing(db()) as conn, conn:
        conn.execute("INSERT INTO sessions VALUES(?,?,?)", (tok_hash(token), name, dt.datetime.now(dt.timezone.utc).isoformat()))
    return {"token": token, "name": name}

def user_from_header(authorization):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    with closing(db()) as conn:
        row = conn.execute("SELECT name, created FROM sessions WHERE token_hash=?", (tok_hash(authorization[7:]),)).fetchone()
    if not row:
        return None
    age = dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(row["created"])
    return row["name"] if age.days < SESSION_DAYS else None

def optional_user(authorization: str | None = Header(default=None)):
    return user_from_header(authorization)

def require_user(authorization: str | None = Header(default=None)):
    user = user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Please log in.")
    return user

def best_streak(days):
    best = run = 0
    prev = None
    for d in sorted(set(days)):
        d = dt.date.fromisoformat(d)
        run = run + 1 if prev and (d - prev).days == 1 else 1
        best = max(best, run)
        prev = d
    return best

BADGES = [
    ("first-steps", "First Steps", "Solve your first question"),
    ("high-five", "High Five", "Solve 5 questions"),
    ("double-digits", "Double Digits", "Solve 10 questions"),
    ("century", "Century", "Earn 100 points"),
    ("problem-solver", "Problem Solver", "Solve 3 coding problems"),
    ("hard-hitter", "Hard Hitter", "Solve a Hard question"),
    ("polyglot", "Polyglot", "Solve an MCQ in Python, Java and C"),
    ("on-a-roll", "On a Roll", "Reach a 3-day streak"),
    ("week-warrior", "Week Warrior", "Reach a 7-day streak"),
]

def badges_for(rows, days):
    diff = {("problem", p["id"]): p["difficulty"] for p in PROBLEMS.values()}
    diff.update({("mcq", m["id"]): m["difficulty"] for m in MCQS})
    lang = {m["id"]: m["lang"] for m in MCQS}
    n = len(rows)
    pts = sum(r["points"] for r in rows)
    probs = sum(1 for r in rows if r["kind"] == "problem")
    hard = any(diff.get((r["kind"], r["item"])) == "Hard" for r in rows)
    langs = {lang[r["item"]] for r in rows if r["kind"] == "mcq"}
    best = best_streak(days)
    ok = {"first-steps": n >= 1, "high-five": n >= 5, "double-digits": n >= 10, "century": pts >= 100,
          "problem-solver": probs >= 3, "hard-hitter": hard, "polyglot": langs >= {"python", "java", "c"},
          "on-a-roll": best >= 3, "week-warrior": best >= 7}
    return [{"id": i, "name": nm, "desc": d, "earned": ok[i]} for i, nm, d in BADGES]

LANG_NAMES = {"python": "Python", "java": "Java", "c": "C"}

def profile_extras(user, rows, days):
    from collections import Counter
    meta = {("problem", p["id"]): (p["title"], p["difficulty"], p["topics"]) for p in PROBLEMS.values()}
    meta.update({("mcq", m["id"]): (LANG_NAMES[m["lang"]] + " MCQ: " + m["topic"], m["difficulty"], [m["topic"]]) for m in MCQS})
    history, skills, langs, solved_by = [], Counter(), Counter(), Counter()
    for r in rows:
        title, diff, topics = meta.get((r["kind"], r["item"]), (r["item"], "Easy", []))
        history.append({"kind": r["kind"], "id": r["item"], "title": title, "difficulty": diff, "points": r["points"], "day": r["day"], "lang": r["lang"]})
        skills.update(topics)
        solved_by[diff] += 1
        if r["lang"]:
            langs[r["lang"]] += 1
    total_by = Counter(v[1] for v in meta.values())
    with closing(db()) as conn:
        board = [x["user"] for x in conn.execute("SELECT user FROM solves GROUP BY user ORDER BY SUM(points) DESC, COUNT(*) DESC").fetchall()]
    return {
        "history": history,
        "skills": [{"topic": t, "count": c} for t, c in skills.most_common(8)],
        "languages": [{"lang": l, "count": c} for l, c in langs.most_common()],
        "by_difficulty": {d: {"solved": solved_by[d], "total": total_by[d]} for d in ("Easy", "Medium", "Hard")},
        "best_streak": best_streak(days),
        "rank": board.index(user) + 1 if user in board else None,
        "players": len(board),
    }

app = FastAPI(title="CodeArena API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in FRONTEND_ORIGIN.split(",") if o.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

class ExecuteRequest(BaseModel):
    problem_id: str = Field(min_length=1, max_length=80)
    language: Literal["python", "java", "c"]
    source_code: str = Field(min_length=1, max_length=30000)
    mode: Literal["run", "submit"] = "run"
    custom_input: str = Field(default="", max_length=10000)

def auth_headers():
    headers = {"Content-Type": "application/json"}
    if JUDGE0_API_KEY:
        headers[JUDGE0_AUTH_HEADER] = JUDGE0_API_KEY
    return headers

async def judge0_execute(client: httpx.AsyncClient, language_id: int, code: str, stdin: str):
    # Use asynchronous submission + polling: not all Judge0 hosts enable wait=true.
    create_url = f"{JUDGE0_API_URL}/submissions?base64_encoded=false&wait=false"
    try:
        response = await client.post(
            create_url,
            headers=auth_headers(),
            json={
                "source_code": code,
                "language_id": language_id,
                "stdin": stdin,
                "cpu_time_limit": 3,
                "wall_time_limit": 5,
                "memory_limit": 128000,
            },
        )
        response.raise_for_status()
        token = response.json().get("token")
        if not token:
            raise HTTPException(status_code=502, detail="Judge0 did not return a submission token.")

        result_url = f"{JUDGE0_API_URL}/submissions/{token}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status,time,memory"
        for _ in range(30):
            await asyncio.sleep(0.5)
            result_response = await client.get(result_url, headers=auth_headers())
            result_response.raise_for_status()
            result = result_response.json()
            status = (result.get("status") or {}).get("description", "Unknown")
            if status not in ("In Queue", "Processing"):
                return result
        return {"status": {"description": "Timed Out"}, "stderr": "Execution service took too long. Try again."}
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Judge0 request timed out. Try again.")
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Judge0 returned HTTP {exc.response.status_code}. Check the configured execution service or quota.",
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Could not reach Judge0. Check internet access or JUDGE0_API_URL.")

def normalize_output(value):
    return (value or "").replace("\r\n", "\n").strip()

@app.get("/api/health")
def health():
    return {"ok": True, "service": "CodeArena API"}

@app.get("/api/problems")
def get_problems():
    return [
        {k: v for k, v in problem.items() if k not in ("tests", "sample_input", "sample_output")}
        | {"starter_code": STARTER_CODE[problem["id"]]}
        for problem in PROBLEMS.values()
    ]

@app.get("/api/problems/{problem_id}")
def get_problem(problem_id: str):
    problem = PROBLEMS.get(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found.")
    return {
        **{k: v for k, v in problem.items() if k != "tests"},
        "starter_code": STARTER_CODE[problem_id],
    }

@app.post("/api/execute")
async def execute(request: ExecuteRequest, user: str | None = Depends(optional_user)):
    problem = PROBLEMS.get(request.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found.")
    if request.mode == "submit" and not user:
        raise HTTPException(status_code=401, detail="Log in to submit and earn points.")
    if len(request.source_code.strip()) == 0:
        raise HTTPException(status_code=400, detail="Source code cannot be empty.")

    lang_id = LANGUAGES[request.language]["id"]
    tests = (
        [{"input": request.custom_input, "expected": None, "hidden": False}]
        if request.mode == "run" and request.custom_input.strip()
        else [next(t for t in problem["tests"] if not t["hidden"])]
        if request.mode == "run"
        else problem["tests"]
    )

    results = []
    async with httpx.AsyncClient(timeout=httpx.Timeout(20.0, connect=8.0)) as client:
        for index, test in enumerate(tests, start=1):
            result = await judge0_execute(client, lang_id, request.source_code, test["input"])
            status = (result.get("status") or {}).get("description", "Unknown")
            output = result.get("stdout") or ""
            error = result.get("compile_output") or result.get("stderr") or result.get("message") or ""
            if status == "Accepted":
                passed = test["expected"] is None or normalize_output(output) == normalize_output(test["expected"])
                display_status = "Passed" if passed else "Wrong Answer"
            else:
                passed = False
                display_status = status
            results.append({
                "case": index,
                "status": display_status,
                "passed": passed,
                "input": test["input"],
                "expected": test["expected"] if not test["hidden"] else None,
                "output": output,
                "error": error,
                "hidden": test["hidden"],
                "time": result.get("time"),
                "memory": result.get("memory"),
            })
            if request.mode == "submit" and not passed:
                # Keep the response similar to an online judge: stop at the first failed test.
                break

    passed_count = sum(1 for r in results if r["passed"])
    accepted = passed_count == len(tests) and len(results) == len(tests)
    points = award(user, "problem", request.problem_id, problem["difficulty"], request.language) if accepted and request.mode == "submit" else 0
    if request.mode == "submit" and user:
        record_submission(user, "problem", request.problem_id, accepted, request.language)
    return {
        "points_awarded": points,
        "verdict": "Accepted" if accepted else next((r["status"] for r in results if not r["passed"]), "Wrong Answer"),
        "passed": passed_count,
        "total": len(tests),
        "results": results,
    }


class AnswerRequest(BaseModel):
    choice: int = Field(ge=0, le=9)

@app.get("/api/mcqs")
def get_mcqs():
    return [{k: v for k, v in m.items() if k not in ("answer", "explanation")} for m in MCQS]

@app.post("/api/mcqs/{mcq_id}/answer")
def answer_mcq(mcq_id: str, req: AnswerRequest, user: str = Depends(require_user)):
    m = next((x for x in MCQS if x["id"] == mcq_id), None)
    if not m:
        raise HTTPException(status_code=404, detail="Question not found.")
    correct = req.choice == m["answer"]
    points = award(user, "mcq", mcq_id, m["difficulty"], m["lang"]) if correct else 0
    record_submission(user, "mcq", mcq_id, correct, m["lang"])
    return {"correct": correct, "correct_index": m["answer"], "explanation": m["explanation"], "points_awarded": points}

@app.get("/api/me")
def me(user: str = Depends(require_user)):
    with closing(db()) as conn:
        rows = conn.execute("SELECT kind, item, points, day, lang FROM solves WHERE user=? ORDER BY rowid", (user,)).fetchall()
        subs = conn.execute("SELECT verdict, day FROM submissions WHERE user=?", (user,)).fetchall()
        acct = conn.execute("SELECT location, bio, created FROM accounts WHERE name=?", (user,)).fetchone()
    activity = {}
    for sb in subs:
        activity[sb["day"]] = activity.get(sb["day"], 0) + 1
    days = sorted({r["day"] for r in rows} | set(activity))
    accepted_n = sum(1 for sb in subs if sb["verdict"] == "Accepted")
    joined = (acct["created"] if acct and acct["created"] else (days[0] if days else None))
    lang_of = {m["id"]: m["lang"] for m in MCQS}
    mcq_by_lang = {"python": 0, "java": 0, "c": 0}
    for r in rows:
        if r["kind"] == "mcq":
            mcq_by_lang[lang_of[r["item"]]] += 1
    return {
        **profile_extras(user, rows, days),
        "activity": activity,
        "submissions": {"total": len(subs), "accepted": accepted_n,
                        "rate": round(100 * accepted_n / len(subs)) if subs else 0},
        "profile": {"location": (acct["location"] if acct else None) or "", "bio": (acct["bio"] if acct else None) or "", "joined": joined},
        "name": user,
        "points": sum(r["points"] for r in rows),
        "streak": streak_of(days),
        "days": days,
        "problems": [r["item"] for r in rows if r["kind"] == "problem"],
        "mcqs": [r["item"] for r in rows if r["kind"] == "mcq"],
        "mcq_by_lang": mcq_by_lang,
        "totals": {"problems": len(PROBLEMS), "mcqs": len(MCQS)},
        "mcq_totals": {l: sum(1 for m in MCQS if m["lang"] == l) for l in ("python", "java", "c")},
        "badges": badges_for(rows, days),
    }

@app.get("/api/leaderboard")
def leaderboard():
    with closing(db()) as conn:
        rows = conn.execute("SELECT user, SUM(points) AS pts, COUNT(*) AS solved FROM solves GROUP BY user ORDER BY pts DESC, solved DESC LIMIT 20").fetchall()
    return [{"name": r["user"], "points": r["pts"], "solved": r["solved"]} for r in rows]

@app.get("/api/daily")
def daily():
    n = dt.date.today().timetuple().tm_yday
    items = [{"kind": "problem", "id": p["id"], "title": p["title"], "difficulty": p["difficulty"], "topic": p["topics"][0]} for p in PROBLEMS.values()]
    items += [{"kind": "mcq", "id": m["id"], "title": m["question"] + (" " + m["code"].split("\n")[0] if m["code"] else ""), "difficulty": m["difficulty"], "topic": m["topic"], "lang": m["lang"]} for m in MCQS]
    out = {}
    for d in PTS:
        pool = sorted((i for i in items if i["difficulty"] == d), key=lambda i: i["id"])
        if pool:
            out[d] = pool[n % len(pool)]
    return out


@app.post("/api/auth/register")
def register(req: RegisterRequest):
    name = clean_user(req.name)
    email = req.email.strip().lower()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    with closing(db()) as conn:
        old = conn.execute("SELECT 1 FROM solves WHERE user=? COLLATE NOCASE LIMIT 1", (name,)).fetchone()
    if old:
        raise HTTPException(status_code=409, detail="That name is already taken. Pick another.")
    salt = secrets.token_hex(16)
    try:
        with closing(db()) as conn, conn:
            conn.execute("INSERT INTO accounts(name, email, salt, pw_hash, created) VALUES(?,?,?,?,?)", (name, email, salt, hash_pw(req.password, salt), dt.date.today().isoformat()))
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="That name or email is already registered.")
    return new_session(name)

@app.post("/api/auth/login")
def login(req: LoginRequest):
    email = req.email.strip().lower()
    now = time.time()
    recent = [t for t in FAILS.get(email, []) if now - t < 600]
    if len(recent) >= 5:
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in a few minutes.")
    with closing(db()) as conn:
        row = conn.execute("SELECT name, salt, pw_hash FROM accounts WHERE email=?", (email,)).fetchone()
    ok = row is not None and hmac.compare_digest(hash_pw(req.password, row["salt"]), row["pw_hash"])
    if not ok:
        FAILS[email] = recent + [now]
        raise HTTPException(status_code=401, detail="Wrong email or password.")
    FAILS.pop(email, None)
    return new_session(row["name"])

@app.post("/api/auth/logout")
def logout(authorization: str | None = Header(default=None)):
    if authorization and authorization.startswith("Bearer "):
        with closing(db()) as conn, conn:
            conn.execute("DELETE FROM sessions WHERE token_hash=?", (tok_hash(authorization[7:]),))
    return {"ok": True}


from guides import GUIDES

@app.get("/api/problems/{problem_id}/editorial")
def editorial(problem_id: str):
    g = GUIDES.get(problem_id)
    if not g:
        raise HTTPException(status_code=404, detail="No editorial for this problem yet.")
    return {"approach": g["approach"], "hints": g["hints"], "complexity": g["complexity"]}

@app.get("/api/problems/{problem_id}/solution")
def solution(problem_id: str, user: str | None = Depends(optional_user)):
    g = GUIDES.get(problem_id)
    if not g:
        raise HTTPException(status_code=404, detail="No solution for this problem yet.")
    if not user:
        raise HTTPException(status_code=401, detail="Log in and solve this problem to unlock the solution.")
    with closing(db()) as conn:
        done = conn.execute("SELECT 1 FROM solves WHERE user=? AND kind='problem' AND item=?", (user, problem_id)).fetchone()
    if not done:
        raise HTTPException(status_code=403, detail="Solve this problem first to unlock the solution.")
    return {"solutions": g["solutions"]}


class ProfileUpdate(BaseModel):
    location: str = Field(default="", max_length=60)
    bio: str = Field(default="", max_length=200)

@app.post("/api/profile")
def update_profile(req: ProfileUpdate, user: str = Depends(require_user)):
    with closing(db()) as conn, conn:
        conn.execute("UPDATE accounts SET location=?, bio=? WHERE name=?", (req.location.strip(), req.bio.strip(), user))
    return {"ok": True}
