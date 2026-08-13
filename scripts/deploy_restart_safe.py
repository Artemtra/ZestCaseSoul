import getpass
import os
import shlex
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import paramiko


HOST = "139.100.235.67"
USER = "root"
APP_DIR = "/var/www/zestcasesoul"
SERVICE = "zestcasesoul"


def run_local(command, cwd):
    subprocess.run(command, cwd=cwd, check=True)


def run_remote(client, command, timeout=600):
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    code = stdout.channel.recv_exit_status()
    if code != 0:
        raise RuntimeError(f"Remote command failed ({code})\nSTDOUT:\n{out}\nSTDERR:\n{err}")
    return out.strip()


def main():
    root = Path(__file__).resolve().parents[1]
    stamp = time.strftime("%Y%m%d-%H%M%S")
    archive = Path(tempfile.gettempdir()) / f"zestcasesoul-deploy-{stamp}.tgz"
    remote_archive = f"/tmp/zestcasesoul-deploy-{stamp}.tgz"
    release_dir = f"/tmp/zestcasesoul-release-{stamp}"
    backup_dir = f"/root/zestcasesoul-code-backups/{stamp}"
    database_backup_dir = f"/root/zestcasesoul-backups/{stamp}-before-deploy"

    print(f"Creating archive: {archive}")
    run_local([
        "tar",
        "-czf",
        str(archive),
        "--exclude=.env",
        "--exclude=uploads",
        "--exclude=node_modules",
        "--exclude=.git",
        "--exclude=.agents",
        "-C",
        str(root),
        ".",
    ], root)

    password = os.environ.get("ZEST_SSH_PASSWORD") or getpass.getpass("SSH password: ")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print("Connecting to server...")
        client.connect(HOST, username=USER, password=password, timeout=25, banner_timeout=25, auth_timeout=25)
        with client.open_sftp() as sftp:
            print("Uploading archive...")
            sftp.put(str(archive), remote_archive)

        deploy_script = f"""
set -euo pipefail
APP_DIR={shlex.quote(APP_DIR)}
BACKUP_DIR={shlex.quote(backup_dir)}
DATABASE_BACKUP_DIR={shlex.quote(database_backup_dir)}
BACKUP_ROOT=/root/zestcasesoul-code-backups
ARCHIVE={shlex.quote(remote_archive)}
RELEASE_DIR={shlex.quote(release_dir)}
SERVICE={shlex.quote(SERVICE)}

mkdir -p "$BACKUP_DIR" "$DATABASE_BACKUP_DIR"
cd "$APP_DIR"
node - "$DATABASE_BACKUP_DIR/database.sql" <<'NODE'
const fs = require("node:fs");
const {{ spawnSync }} = require("node:child_process");
require("dotenv").config({{ path: "/var/www/zestcasesoul/.env" }});
const outputPath = process.argv[2];
const output = fs.openSync(outputPath, "w", 0o600);
const result = spawnSync("mysqldump", [
  "--single-transaction",
  "--quick",
  "--skip-lock-tables",
  "--host", process.env.DB_HOST || "127.0.0.1",
  "--port", String(process.env.DB_PORT || 3306),
  "--user", process.env.DB_USER || "root",
  process.env.DB_NAME || "case_editor"
], {{
  env: {{ ...process.env, MYSQL_PWD: process.env.DB_PASSWORD || "" }},
  stdio: ["ignore", output, "pipe"]
}});
fs.closeSync(output);
if (result.status !== 0) {{
  fs.rmSync(outputPath, {{ force: true }});
  throw new Error(String(result.stderr || "mysqldump failed"));
}}
NODE
gzip -f "$DATABASE_BACKUP_DIR/database.sql"
tar -czf "$BACKUP_DIR/code.tgz" \\
  --exclude=.env \\
  --exclude=uploads \\
  --exclude=tmp \\
  --exclude=node_modules \\
  --exclude=.git \\
  --exclude=.agents \\
  -C "$APP_DIR" .

rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"
tar -xzf "$ARCHIVE" -C "$RELEASE_DIR"

rsync -a --delete \\
  --exclude='.env' \\
  --exclude='uploads' \\
  --exclude='node_modules' \\
  --exclude='.git' \\
  --exclude='.agents' \\
  "$RELEASE_DIR"/ "$APP_DIR"/

if id -u zestcase >/dev/null 2>&1; then
  chown -R zestcase:www-data "$APP_DIR"
elif id -u www-data >/dev/null 2>&1; then
  chown -R www-data:www-data "$APP_DIR"
fi

cd "$APP_DIR"
npm run check
npm test
npm run migrate
systemctl restart "$SERVICE"
for i in $(seq 1 20); do
  if systemctl is-active --quiet "$SERVICE" && curl -fsS http://127.0.0.1:3000/api/models >/dev/null; then
    break
  fi
  sleep 1
done
systemctl is-active --quiet "$SERVICE"
curl -fsS http://127.0.0.1:3000/api/models >/dev/null
rm -rf "$RELEASE_DIR" "$ARCHIVE"

# Keep only the three newest code backups. Database backups are stored
# separately and are intentionally not touched here.
[ "$(readlink -f "$BACKUP_ROOT")" = "/root/zestcasesoul-code-backups" ]
while IFS= read -r OLD_NAME; do
  [ -n "$OLD_NAME" ] || continue
  OLD_PATH="$BACKUP_ROOT/$OLD_NAME"
  [ "$(dirname "$(readlink -f "$OLD_PATH")")" = "$BACKUP_ROOT" ]
  rm -rf -- "$OLD_PATH"
done < <(
  find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d \\
    -name '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9][0-9][0-9]' \\
    -printf '%f\n' | sort -r | tail -n +4
)

echo "BACKUP_DIR=$BACKUP_DIR"
echo "DATABASE_BACKUP_DIR=$DATABASE_BACKUP_DIR"
echo "SERVICE_STATUS=$(systemctl is-active "$SERVICE")"
"""

        print("Deploying code and restarting service...")
        print(run_remote(client, "bash -lc " + shlex.quote(deploy_script)))
        print("Deploy complete.")
        return 0
    finally:
        client.close()
        try:
            archive.unlink(missing_ok=True)
        except OSError:
            pass


if __name__ == "__main__":
    try:
      raise SystemExit(main())
    except Exception as error:
      print(f"ERROR: {error}", file=sys.stderr)
      raise SystemExit(1)
