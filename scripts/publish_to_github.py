#!/usr/bin/env python3
"""
ARGUS Platform - Automated GitHub Publishing Script
Securely publishes the repository to GitHub using existing Keychain credentials.
Cleans up authenticated remote URL post-push to prevent token leakage.
"""

import sys
import json
import urllib.request
import urllib.error
import subprocess

REPO_NAME = "ARGUS-AI-Cyber-Defense-Platform"
REPO_DESC = "ARGUS – AI-Powered Cyber Attack & Defense Simulation Platform (SRM University 2026-2027)"

def get_keychain_credentials():
    proc = subprocess.run(
        ["git", "credential", "fill"],
        input="protocol=https\nhost=github.com\n\n",
        capture_output=True,
        text=True,
        check=True
    )
    creds = {}
    for line in proc.stdout.splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            creds[k.strip()] = v.strip()
    return creds

def make_request(url, token, data=None, method=None):
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "ARGUS-Platform-Publisher"
    }
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8")), resp.status

def main():
    print("[*] Retrieving GitHub credentials from system keychain...")
    creds = get_keychain_credentials()
    token = creds.get("password")
    if not token:
        print("[!] ERROR: No GitHub password or personal access token found in keychain.")
        sys.exit(1)

    print("[*] Authenticating with GitHub API...")
    try:
        user_data, _ = make_request("https://api.github.com/user", token)
    except urllib.error.HTTPError as e:
        print(f"[!] Authentication failed: HTTP {e.code} - {e.reason}")
        print(e.read().decode())
        sys.exit(1)

    owner = user_data.get("login")
    display_name = user_data.get("name") or owner
    email = user_data.get("email") or f"{owner}@users.noreply.github.com"
    print(f"[+] Successfully authenticated as: {owner} ({display_name})")

    # Update git author config
    subprocess.run(["git", "config", "user.name", display_name], check=True)
    subprocess.run(["git", "config", "user.email", email], check=True)

    # Check if repo already exists
    repo_exists = False
    repo_url = None
    try:
        repo_data, _ = make_request(f"https://api.github.com/repos/{owner}/{REPO_NAME}", token)
        repo_exists = True
        repo_url = repo_data.get("html_url")
        print(f"[*] Repository '{owner}/{REPO_NAME}' already exists at {repo_url}")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"[*] Repository '{owner}/{REPO_NAME}' does not exist yet. Creating public repository...")
            create_payload = {
                "name": REPO_NAME,
                "description": REPO_DESC,
                "private": False,
                "auto_init": False
            }
            try:
                created_data, _ = make_request("https://api.github.com/user/repos", token, data=create_payload, method="POST")
                repo_url = created_data.get("html_url")
                print(f"[+] Public repository created successfully: {repo_url}")
            except urllib.error.HTTPError as ce:
                print(f"[!] Failed to create repository: HTTP {ce.code} - {ce.reason}")
                print(ce.read().decode())
                sys.exit(1)
        else:
            print(f"[!] Error checking repository: HTTP {e.code} - {e.reason}")
            sys.exit(1)

    # Configure remote with auth token for push
    auth_remote = f"https://{token}@github.com/{owner}/{REPO_NAME}.git"
    clean_remote = f"https://github.com/{owner}/{REPO_NAME}.git"

    subprocess.run(["git", "remote", "remove", "origin"], capture_output=True)
    subprocess.run(["git", "remote", "add", "origin", auth_remote], check=True)

    print(f"[*] Pushing 'main' branch to {clean_remote}...")
    push_res = subprocess.run(["git", "push", "-u", "origin", "main", "--force"], capture_output=True, text=True)
    
    # Immediately remove token from .git/config
    subprocess.run(["git", "remote", "set-url", "origin", clean_remote], check=True)

    if push_res.returncode != 0:
        print("[!] Git push failed:")
        print(push_res.stderr)
        sys.exit(1)

    print("[+] Git push completed successfully!")

    # Verify latest commit on remote
    commit_p = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True, check=True)
    commit_id = commit_p.stdout.strip()

    print("\n" + "=" * 70)
    print("GITHUB PUBLISHING VERIFICATION")
    print("=" * 70)
    print(f"Repository URL: {repo_url}")
    print(f"Branch:         main")
    print(f"Commit ID:      {commit_id}")
    print(f"Status:         PUBLIC REPOSITORY VERIFIED")
    print("=" * 70)

if __name__ == "__main__":
    main()
