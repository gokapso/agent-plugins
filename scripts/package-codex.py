"""Build the standalone Codex submission ZIP from the validated plugin tree."""
import json
import subprocess
import sys
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
plugin = root / "plugins" / "kapso"
subprocess.run(["npm", "run", "validate"], cwd=root, check=True)
subprocess.run(["npm", "run", "check:syntax"], cwd=root, check=True)
version = json.loads((plugin / ".codex-plugin/plugin.json").read_text())["version"]
destination = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "dist" / f"kapso-{version}-codex.zip"
destination.parent.mkdir(parents=True, exist_ok=True)
components = [plugin / name for name in [".codex-plugin", ".mcp.json", "skills", "assets", "LICENSE", "README.md", "CHANGELOG.md"]]
files = []
for component in components:
    candidates = component.rglob("*") if component.is_dir() else [component]
    for file in candidates:
        if file.is_symlink():
            raise ValueError(f"Symlinks are not allowed: {file.relative_to(plugin)}")
        if file.is_file() and "node_modules" not in file.parts and file.name != ".DS_Store":
            files.append(file)
with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(files):
        archive.write(file, file.relative_to(plugin).as_posix())
print(f"Created {destination.resolve()} ({len(files)} files)")
