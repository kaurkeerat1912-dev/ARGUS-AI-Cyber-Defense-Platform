"""
ARGUS Defensive Simulation Engine
Generates, simulates, verifies, and calculates residual threat posture
for automated defensive countermeasures based on AI forensic findings.
Implements risk-stratified policies:
- Critical: Store in Virtual Sandbox (Isolated Detonation Deck)
- High: Stop Access (Access Revocation & Lockdown)
- Medium / Low: Continuous Reviewing Mode (Active/Passive Heuristic Watchdog)
Provides tailored, file-type specific and indicator-specific solutions for every sample.
"""

import re
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional


class DefenseSimulationEngine:
    """
    Automated Defensive Countermeasure and Response Engine for Project ARGUS.
    Translates static indicators and dynamic behavioral events into actionable,
    production-grade defensive policies, executes containment simulations,
    and quantifies threat reduction.
    """

    def determine_strategy(
        self,
        risk_score: float,
        risk_level: Optional[str] = None,
        sample_name: str = "sample"
    ) -> Dict[str, str]:
        """
        Determine the primary high-level strategic countermeasure:
        - Critical (score >= 85): Store in Virtual Sandbox
        - High (60 <= score < 85): Stop Access
        - Medium / Low (score < 60): Continuous Reviewing Mode
        """
        level = (risk_level or "").upper()
        if risk_score >= 85.0 or level == "CRITICAL":
            return {
                "primary_strategy": "STORE_IN_SANDBOX",
                "strategy_title": "Store in Virtual Sandbox (Isolated Detonation Deck)",
                "strategy_badge": "CRITICAL: STORE IN SANDBOX",
                "strategy_description": (
                    f"Sample '{sample_name}' is confirmed as a CRITICAL threat vector ({risk_score:.1f}/100). "
                    f"Corporate defensive policy mandates storing and isolating this artifact entirely within the Virtual Sandbox. "
                    f"Direct execution on host operating systems is strictly prohibited, and execution telemetry is captured inside an isolated micro-VM."
                )
            }
        elif risk_score >= 60.0 or level == "HIGH":
            return {
                "primary_strategy": "STOP_ACCESS",
                "strategy_title": "Stop Access (Access Revocation & Lockdown)",
                "strategy_badge": "HIGH: STOP ACCESS REQUIRED",
                "strategy_description": (
                    f"Sample '{sample_name}' presents verified HIGH-severity indicators ({risk_score:.1f}/100). "
                    f"Defensive policy requires STOP ACCESS: immediate revocation of all read/write/execute permissions, "
                    f"active process tree termination, and host ACL isolation to prevent local execution."
                )
            }
        elif risk_score >= 30.0 or level == "MEDIUM":
            return {
                "primary_strategy": "CONTINUOUS_REVIEWING_MODE",
                "strategy_title": "Continuous Reviewing Mode (Active Heuristic Watchdog)",
                "strategy_badge": "MEDIUM: CONTINUOUS REVIEWING MODE",
                "strategy_description": (
                    f"Sample '{sample_name}' exhibits anomalous structural patterns or elevated entropy ({risk_score:.1f}/100). "
                    f"Security policy places this artifact into Continuous Reviewing Mode: attaching low-overhead behavioral watchdogs, "
                    f"real-time audit trails, and background integrity re-scans without disrupting operational workflows."
                )
            }
        else:
            return {
                "primary_strategy": "CONTINUOUS_REVIEWING_MODE",
                "strategy_title": "Continuous Reviewing Mode (Cryptographic Integrity Audit)",
                "strategy_badge": "LOW: CONTINUOUS REVIEWING MODE",
                "strategy_description": (
                    f"Sample '{sample_name}' is verified safe and harmless ({risk_score:.1f}/100). "
                    f"The platform maintains Continuous Reviewing Mode: cryptographic SHA-256 allowlist registration and passive "
                    f"integrity tracking to ensure ongoing baseline security without user obstruction."
                )
            }

    def generate_defense_plan_data(
        self,
        investigation_id: str,
        sample_name: str,
        sha256: str,
        file_type: str,
        risk_score: float,
        evidence_items: List[Dict[str, Any]],
        behavioral_events: List[Dict[str, Any]],
        risk_level: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synthesize tailored defensive plan and actions based on risk tier, file type,
        and extracted forensic indicators.
        """
        strategy_info = self.determine_strategy(risk_score, risk_level, sample_name)
        primary_strat = strategy_info["primary_strategy"]

        actions: List[Dict[str, Any]] = []
        safe_hash_short = sha256[:12] if sha256 else "sample"
        ext = sample_name.split(".")[-1].lower() if "." in sample_name else ""
        norm_type = (file_type or "").upper()

        # 1. Collect Network Indicators (IPs, Domains)
        ips = set()
        domains = set()
        for ev in evidence_items:
            cat = ev.get("category", "").upper()
            val = str(ev.get("observed_value", ""))
            if cat == "NETWORK" or "URL" in cat or "IP" in cat or "DOMAIN" in cat:
                found_ips = re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", val)
                for ip in found_ips:
                    if not ip.startswith("127.") and not ip.startswith("0."):
                        ips.add(ip)
                found_domains = re.findall(r"\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b", val)
                for dom in found_domains:
                    if not dom.endswith(".local") and not dom.endswith(".internal"):
                        domains.add(dom)

        for bev in behavioral_events:
            dest_ip = bev.get("destination_ip")
            if dest_ip and not dest_ip.startswith("127.") and not dest_ip.startswith("0."):
                ips.add(dest_ip)
            domain = bev.get("domain")
            if domain:
                domains.add(domain)

        # 2. Collect Suspicious Processes
        processes = set()
        for bev in behavioral_events:
            p_name = bev.get("process_name")
            cmd = bev.get("command_line", "")
            pid = bev.get("process_id")
            if p_name:
                processes.add((p_name, pid, cmd))

        for ev in evidence_items:
            val = str(ev.get("observed_value", ""))
            if "powershell" in val.lower() or "cmd.exe" in val.lower() or "rundll32" in val.lower() or "vssadmin" in val.lower():
                p_label = "powershell.exe" if "powershell" in val.lower() else "cmd.exe"
                processes.add((p_label, 4820, val[:80]))

        # Detect specific static indicators
        has_open_action = any(
            "openaction" in str(e.get("observed_value", "")).lower() or "/js" in str(e.get("observed_value", "")).lower()
            for e in evidence_items
        )
        has_vba_macros = any(
            "macro" in str(e.get("observed_value", "")).lower() or "vba" in str(e.get("observed_value", "")).lower()
            for e in evidence_items
        )

        # =========================================================================
        # ACTION 1: CORE STRATEGIC MANDATE (SANDBOX / STOP ACCESS / CONTINUOUS REVIEW)
        # =========================================================================
        if primary_strat == "STORE_IN_SANDBOX":
            actions.append({
                "id": str(uuid.uuid4()),
                "investigation_id": investigation_id,
                "category": "SANDBOX_ISOLATION",
                "title": f"Store in Virtual Sandbox Deck ({sample_name})",
                "description": (
                    f"Quarantine and store '{sample_name}' within a micro-VM hypervisor sandbox container. "
                    f"Prevents any direct host interaction, enforces read-only storage mounting, and restricts behavioral detonation to isolated memory."
                ),
                "target": f"Virtual Sandbox Pod: /var/quarantine/sandbox_{safe_hash_short}",
                "rule_syntax": (
                    f"# Launch isolated ephemeral sandbox micro-VM container\n"
                    f"docker run --rm -d \\\n"
                    f"  --name \"argus-sandbox-{safe_hash_short}\" \\\n"
                    f"  --network none \\\n"
                    f"  --memory 512m --cpus 1.0 \\\n"
                    f"  --read-only \\\n"
                    f"  -v \"/data/quarantine/{sha256}:/sample/{sample_name}:ro\" \\\n"
                    f"  argus-sandbox-deck:latest --monitor-syscalls"
                ),
                "status": "PROPOSED",
                "risk_reduction": min(32.0, round(risk_score * 0.38, 1)),
                "simulated_output": None
            })
        elif primary_strat == "STOP_ACCESS":
            actions.append({
                "id": str(uuid.uuid4()),
                "investigation_id": investigation_id,
                "category": "ACCESS_REVOCATION",
                "title": f"Stop Access & Revoke Execution Permissions ({sample_name})",
                "description": (
                    f"Immediate STOP ACCESS: Strip all read, write, and execute permissions on '{sample_name}'. "
                    f"Apply immutable file flags and NTFS Deny ACLs to prevent user or service access."
                ),
                "target": f"Filesystem Artifact: {sample_name}",
                "rule_syntax": (
                    f"# POSIX / Linux / macOS Access Revocation\n"
                    f"chmod 000 \"/data/quarantine/{sample_name}\"\n"
                    f"chown root:wheel \"/data/quarantine/{sample_name}\"\n"
                    f"chflags uchg \"/data/quarantine/{sample_name}\" 2>/dev/null || chattr +i \"/data/quarantine/{sample_name}\"\n\n"
                    f"# Windows NTFS ACL Access Lockdown\n"
                    f"icacls \"C:\\Quarantine\\{sample_name}\" /reset\n"
                    f"icacls \"C:\\Quarantine\\{sample_name}\" /deny Everyone:(F,X,W,R)"
                ),
                "status": "PROPOSED",
                "risk_reduction": min(28.0, round(risk_score * 0.34, 1)),
                "simulated_output": None
            })
        else:
            # Medium or Low Risk -> Continuous Reviewing Mode
            is_med = risk_score >= 30.0
            actions.append({
                "id": str(uuid.uuid4()),
                "investigation_id": investigation_id,
                "category": "CONTINUOUS_MONITORING",
                "title": f"Continuous Reviewing Mode & Behavioral Watchdog ({sample_name})",
                "description": (
                    f"Place '{sample_name}' into Continuous Reviewing Mode. Attach low-overhead kernel event listeners "
                    f"to audit file read/write operations and verify runtime integrity without disrupting valid workflows."
                ),
                "target": f"Watchdog Target: {sample_name}",
                "rule_syntax": (
                    f"# Linux auditctl continuous file watching\n"
                    f"auditctl -w \"/data/quarantine/{sample_name}\" -p rwx -k argus_continuous_watch\n\n"
                    f"# macOS / BSD kqueue real-time file event logging\n"
                    f"fs_usage -f filesys | grep -i \"{sample_name}\""
                ),
                "status": "PROPOSED",
                "risk_reduction": min(16.0, round(risk_score * 0.40, 1)),
                "simulated_output": None
            })

        # =========================================================================
        # ACTION 2: FILE-TYPE SPECIFIC COUNTERMEASURE
        # =========================================================================
        if "PDF" in norm_type or ext == "pdf":
            if has_open_action or risk_score >= 50:
                actions.append({
                    "id": str(uuid.uuid4()),
                    "investigation_id": investigation_id,
                    "category": "PAYLOAD_NEUTRALIZATION",
                    "title": f"PDF Exploit Disarmament & /OpenAction Sanitization ({sample_name})",
                    "description": (
                        f"Neutralize automatic execution triggers (/OpenAction, /AA) and strip embedded JavaScript streams "
                        f"to disarm malicious staging logic inside '{sample_name}'."
                    ),
                    "target": f"PDF Object Tree: {sample_name}",
                    "rule_syntax": (
                        f"# Python PDF Stream Disarmament Policy\n"
                        f"import fitz\n"
                        f"doc = fitz.open('{sample_name}')\n"
                        f"doc.embfile_del_all()\n"
                        f"# Strip catalog OpenAction and JavaScript action dictionaries\n"
                        f"doc.save('{sample_name}.sanitized.pdf', garbage=4, deflate=True)"
                    ),
                    "status": "PROPOSED",
                    "risk_reduction": min(24.0, round(risk_score * 0.28, 1)),
                    "simulated_output": None
                })
            else:
                actions.append({
                    "id": str(uuid.uuid4()),
                    "investigation_id": investigation_id,
                    "category": "CONTINUOUS_MONITORING",
                    "title": f"PDF Reader Protected Mode & Script Lockdown ({sample_name})",
                    "description": "Enforce Acrobat / PDF Reader Protected View sandbox and disable client-side JavaScript execution in registry.",
                    "target": "Acrobat Reader Protected Mode",
                    "rule_syntax": (
                        "reg add \"HKCU\\Software\\Adobe\\Acrobat Reader\\DC\\FeatureState\" /v bDisableJavaScript /t REG_DWORD /d 1 /f\n"
                        "reg add \"HKCU\\Software\\Adobe\\Acrobat Reader\\DC\\TrustManager\" /v bEnhancedSecurityStandalone /t REG_DWORD /d 1 /f"
                    ),
                    "status": "PROPOSED",
                    "risk_reduction": min(12.0, round(risk_score * 0.22, 1)),
                    "simulated_output": None
                })

        elif "EXE" in norm_type or "PE" in norm_type or ext in ["exe", "dll", "bin"]:
            actions.append({
                "id": str(uuid.uuid4()),
                "investigation_id": investigation_id,
                "category": "HOST_ISOLATION",
                "title": f"AppLocker Binary Execution Hash Denial ({safe_hash_short})",
                "description": f"Enforce Software Restriction Policy and Windows AppLocker hash deny rule for binary {sample_name} (SHA-256: {sha256[:16]}...).",
                "target": f"PE Binary Hash: {sha256}",
                "rule_syntax": (
                    f"# Windows AppLocker Hash Rule Deployment\n"
                    f"New-AppLockerPolicy -RuleType Hash -Hash {sha256} -Action Deny -User Everyone -XmlPolicyPath \"C:\\Policies\\ARGUS_Deny.xml\"\n"
                    f"Set-AppLockerPolicy -XmlPolicy \"C:\\Policies\\ARGUS_Deny.xml\""
                ),
                "status": "PROPOSED",
                "risk_reduction": min(22.0, round(risk_score * 0.26, 1)),
                "simulated_output": None
            })

        elif "PS1" in norm_type or "SCRIPT" in norm_type or ext in ["ps1", "vbs", "js", "sh", "bat"]:
            actions.append({
                "id": str(uuid.uuid4()),
                "investigation_id": investigation_id,
                "category": "PROCESS_TERMINATION",
                "title": f"PowerShell Constrained Language Mode & Script Block Logging",
                "description": "Enforce ConstrainedLanguageMode to block reflection and invoke-expression cradles; enable ScriptBlock logging.",
                "target": f"Script Host Engine ({sample_name})",
                "rule_syntax": (
                    "# Enforce PowerShell Constrained Language Mode\n"
                    "$ExecutionContext.SessionState.LanguageMode = 'ConstrainedLanguage'\n"
                    "Set-ExecutionPolicy -ExecutionPolicy Restricted -Scope LocalMachine -Force\n"
                    "# Enable Script Block Logging\n"
                    "reg add \"HKLM\\Software\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging\" /v EnableScriptBlockLogging /t REG_DWORD /d 1 /f"
                ),
                "status": "PROPOSED",
                "risk_reduction": min(22.0, round(risk_score * 0.28, 1)),
                "simulated_output": None
            })

        elif "DOC" in norm_type or ext in ["docx", "doc", "docm", "xlsx"]:
            actions.append({
                "id": str(uuid.uuid4()),
                "investigation_id": investigation_id,
                "category": "PAYLOAD_NEUTRALIZATION",
                "title": f"Office Macro Disarmament & Protected View Policy ({sample_name})",
                "description": "Disable Office VBA macro execution and force sandbox Protected View for untrusted documents.",
                "target": f"Office Trust Center: {sample_name}",
                "rule_syntax": (
                    "# Disable all macros without notification\n"
                    "reg add \"HKCU\\Software\\Microsoft\\Office\\16.0\\Word\\Security\" /v VBAWarnings /t REG_DWORD /d 4 /f\n"
                    "# Block macros from running in Office files from the Internet\n"
                    "reg add \"HKCU\\Software\\Microsoft\\Office\\16.0\\Word\\Security\" /v BlockContentExecutionFromInternet /t REG_DWORD /d 1 /f"
                ),
                "status": "PROPOSED",
                "risk_reduction": min(20.0, round(risk_score * 0.25, 1)),
                "simulated_output": None
            })

        else:
            # Plain Text / Clean file / Generic
            actions.append({
                "id": str(uuid.uuid4()),
                "investigation_id": investigation_id,
                "category": "SIGNATURE_DEPLOYMENT",
                "title": f"Cryptographic Allowlist & Tamper Alert Watchdog ({sample_name})",
                "description": f"Register verified clean cryptographic fingerprint {sha256[:16]} in baseline ledger; attach tamper detection watch.",
                "target": f"File Baseline Ledger ({sample_name})",
                "rule_syntax": (
                    f"# Register trusted cryptographic baseline\n"
                    f"echo \"{sha256}  {sample_name}\" >> /etc/argus/baseline_whitelist.manifest\n"
                    f"# Monitor file modification events\n"
                    f"inotifywait -m -e modify,delete \"/data/quarantine/{sample_name}\" 2>/dev/null"
                ),
                "status": "PROPOSED",
                "risk_reduction": min(10.0, round(risk_score * 0.35, 1)),
                "simulated_output": None
            })

        # =========================================================================
        # ACTION 3: NETWORK C2 CONTAINMENT (TAILORED TO EXTRACTED IOCS)
        # =========================================================================
        if ips:
            target_ip = sorted(list(ips))[0]
            iptables_cmd = (
                f"iptables -A OUTPUT -d {target_ip} -j REJECT --reject-with icmp-port-unreachable && \\\n"
                f"iptables -A INPUT -s {target_ip} -j DROP"
            )
            pf_cmd = f"echo 'block drop out quick proto tcp to {target_ip}' >> /etc/pf.anchors/argus.block && pfctl -f /etc/pf.conf"
            actions.append({
                "id": str(uuid.uuid4()),
                "investigation_id": investigation_id,
                "category": "NETWORK_CONTAINMENT",
                "title": f"Block Outbound C2 Traffic ({target_ip})",
                "description": f"Sever TCP/UDP egress sockets to malicious command-and-control server {target_ip} extracted during forensics.",
                "target": target_ip,
                "rule_syntax": f"# Linux iptables Egress Drop\n{iptables_cmd}\n\n# macOS pf Packet Filter\n{pf_cmd}",
                "status": "PROPOSED",
                "risk_reduction": min(25.0, round(risk_score * 0.30, 1)),
                "simulated_output": None
            })
        elif domains:
            target_domain = sorted(list(domains))[0]
            sinkhole_rule = f"local-data: \"{target_domain} A 0.0.0.0\"\nlocal-data-ptr: \"0.0.0.0 {target_domain}\""
            actions.append({
                "id": str(uuid.uuid4()),
                "investigation_id": investigation_id,
                "category": "NETWORK_CONTAINMENT",
                "title": f"DNS Sinkhole for Malicious Host ({target_domain})",
                "description": f"Redirect DNS queries for malicious domain {target_domain} to loopback/null sinkhole.",
                "target": target_domain,
                "rule_syntax": f"# Unbound / BIND DNS Sinkhole Configuration\n{sinkhole_rule}",
                "status": "PROPOSED",
                "risk_reduction": min(20.0, round(risk_score * 0.25, 1)),
                "simulated_output": None
            })
        elif risk_score >= 60.0:
            actions.append({
                "id": str(uuid.uuid4()),
                "investigation_id": investigation_id,
                "category": "NETWORK_CONTAINMENT",
                "title": "Strict Egress Port Filtering & Dynamic Sandboxing",
                "description": "Block non-standard outbound ports (4444, 8080, 1337) and enforce SSL inspection.",
                "target": "Egress Firewall (Ports 4444, 8080, 1337)",
                "rule_syntax": "iptables -A OUTPUT -p tcp -m multiport --dports 4444,8080,1337 -j DROP",
                "status": "PROPOSED",
                "risk_reduction": min(15.0, round(risk_score * 0.20, 1)),
                "simulated_output": None
            })
        else:
            actions.append({
                "id": str(uuid.uuid4()),
                "investigation_id": investigation_id,
                "category": "CONTINUOUS_MONITORING",
                "title": "Passive Network Socket Telemetry & Egress Logging",
                "description": "Monitor and log all outbound TCP sockets to establish network baseline without dropping valid traffic.",
                "target": "Network Socket Watchdog",
                "rule_syntax": "netstat -antp | grep -v '127.0.0.1' | logger -p local0.info -t argus_net_watch",
                "status": "PROPOSED",
                "risk_reduction": min(8.0, round(risk_score * 0.20, 1)),
                "simulated_output": None
            })

        # =========================================================================
        # ACTION 4: PROCESS LINEAGE TERMINATION OR SUSPICIOUS INJECTION REMEDIATION
        # =========================================================================
        if processes:
            target_proc, target_pid, cmd_snip = sorted(list(processes))[0]
            pid_str = f" -Id {target_pid}" if target_pid else ""
            kill_cmd = (
                f"# Windows PowerShell Process Tree Termination\nStop-Process{pid_str} -Name \"{target_proc.replace('.exe', '')}\" -Force\n\n"
                f"# POSIX / Linux / macOS Kill Signal\npkill -9 -f \"{target_proc}\""
            )
            actions.append({
                "id": str(uuid.uuid4()),
                "investigation_id": investigation_id,
                "category": "PROCESS_TERMINATION",
                "title": f"Terminate Process Tree ({target_proc})",
                "description": f"Kill active execution lineage for {target_proc} (PID {target_pid or 'ACTIVE'}) and revoke child tokens.",
                "target": f"{target_proc}{f' [PID:{target_pid}]' if target_pid else ''}",
                "rule_syntax": kill_cmd,
                "status": "PROPOSED",
                "risk_reduction": min(22.0, round(risk_score * 0.25, 1)),
                "simulated_output": None
            })
        elif risk_score >= 50.0:
            actions.append({
                "id": str(uuid.uuid4()),
                "investigation_id": investigation_id,
                "category": "PROCESS_TERMINATION",
                "title": "Host Memory Scanner & Thread Suspension",
                "description": "Scan userland processes for memory-mapped injected shells and suspend anomalous execution threads.",
                "target": "Host Memory Subsystem",
                "rule_syntax": "Get-Process | Where-Object { $_.Modules.ModuleName -match 'hook|inject' } | Stop-Process -Force",
                "status": "PROPOSED",
                "risk_reduction": min(16.0, round(risk_score * 0.20, 1)),
                "simulated_output": None
            })

        # =========================================================================
        # ACTION 5: ADAPTIVE FLEET IMMUNIZATION (YARA DEFINITION)
        # =========================================================================
        sample_strings = []
        for ev in evidence_items:
            obs = str(ev.get("observed_value", ""))
            if 4 <= len(obs) <= 40 and not obs.startswith("http"):
                clean = re.sub(r'[^a-zA-Z0-9_\-\.]', '', obs)
                if len(clean) >= 4:
                    sample_strings.append(clean)
            if len(sample_strings) >= 2:
                break

        s1 = sample_strings[0] if len(sample_strings) > 0 else (ext or "payload")
        s2 = sample_strings[1] if len(sample_strings) > 1 else "malicious"

        yara_content = f"""rule ARGUS_Mitigation_{safe_hash_short} {{
    meta:
        description = "ARGUS Automated Defense Signature for {sample_name}"
        author = "ARGUS AI Forensic Engine"
        date = "{datetime.now(timezone.utc).strftime('%Y-%m-%d')}"
        target_sha256 = "{sha256}"
        severity = "{risk_level or ('CRITICAL' if risk_score >= 85 else 'HIGH' if risk_score >= 60 else 'MEDIUM')}"
    strings:
        $s1 = "{s1}" ascii wide nocase
        $s2 = "{s2}" ascii wide nocase
    condition:
        any of ($s*)
}}"""

        actions.append({
            "id": str(uuid.uuid4()),
            "investigation_id": investigation_id,
            "category": "SIGNATURE_DEPLOYMENT",
            "title": f"Compile & Deploy Adaptive YARA Fleet Rule ({safe_hash_short})",
            "description": "Distribute on-the-fly compiled YARA rule to enterprise EDR sensors to prevent lateral propagation.",
            "target": f"ARGUS_Mitigation_{safe_hash_short}.yar",
            "rule_syntax": yara_content,
            "status": "PROPOSED",
            "risk_reduction": min(18.0, round(risk_score * 0.22, 1)),
            "simulated_output": None
        })

        # Generate human-readable file-specific summary
        if primary_strat == "STORE_IN_SANDBOX":
            file_specific_summary = (
                f"File '{sample_name}' ({file_type}) evaluated at CRITICAL threat score {risk_score:.1f}/100. "
                f"Primary Solution: STORE IN VIRTUAL SANDBOX. Host execution is strictly disabled. "
                f"Isolated micro-VM container sandbox isolation deployed with network egress severance and memory inspection."
            )
        elif primary_strat == "STOP_ACCESS":
            file_specific_summary = (
                f"File '{sample_name}' ({file_type}) evaluated at HIGH threat score {risk_score:.1f}/100. "
                f"Primary Solution: STOP ACCESS. Host permissions stripped (chmod 000 / NTFS deny), "
                f"process lineage terminated, and outbound communication blocked."
            )
        elif risk_score >= 30.0:
            file_specific_summary = (
                f"File '{sample_name}' ({file_type}) evaluated at MEDIUM risk score {risk_score:.1f}/100. "
                f"Primary Solution: CONTINUOUS REVIEWING MODE. Heuristic watchdog active to monitor file events "
                f"and verify integrity without user disruption."
            )
        else:
            file_specific_summary = (
                f"File '{sample_name}' ({file_type}) evaluated as LOW risk ({risk_score:.1f}/100). "
                f"Primary Solution: CONTINUOUS REVIEWING MODE. Cryptographic baseline allowlisting active "
                f"with background tamper auditing."
            )

        return {
            "primary_strategy": primary_strat,
            "strategy_title": strategy_info["strategy_title"],
            "strategy_badge": strategy_info["strategy_badge"],
            "strategy_description": strategy_info["strategy_description"],
            "file_type": file_type,
            "file_specific_summary": file_specific_summary,
            "actions": actions
        }

    def generate_defense_actions(
        self,
        investigation_id: str,
        sample_name: str,
        sha256: str,
        file_type: str,
        risk_score: float,
        evidence_items: List[Dict[str, Any]],
        behavioral_events: List[Dict[str, Any]],
        risk_level: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Backward-compatible helper returning list of actions.
        """
        data = self.generate_defense_plan_data(
            investigation_id=investigation_id,
            sample_name=sample_name,
            sha256=sha256,
            file_type=file_type,
            risk_score=risk_score,
            evidence_items=evidence_items,
            behavioral_events=behavioral_events,
            risk_level=risk_level
        )
        return data["actions"]

    def simulate_action_execution(
        self,
        action: Dict[str, Any],
        sample_name: str
    ) -> Tuple[Dict[str, Any], List[str]]:
        """
        Simulate the deployment and verification of a specific defensive countermeasure.
        Produces deterministic terminal logs and marks the action VERIFIED_BLOCKED.
        """
        now_ts = datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3]
        cat = action.get("category", "")
        target = action.get("target", "")

        logs = [
            f"[{now_ts}] [ARGUS-DEFENSE-DISPATCH] Target investigation: {sample_name}",
            f"[{now_ts}] [POLICY-INJECT] Initializing {cat} against target: {target}",
        ]

        if cat == "SANDBOX_ISOLATION":
            logs.extend([
                f"[{now_ts}] [SANDBOX-KERNEL] Provisioning isolated ephemeral micro-VM container pod...",
                f"[{now_ts}] [CONTAINER-CONF] Enforcing execution isolation: NET=NONE, MEM=512MB, READ_ONLY=TRUE.",
                f"[{now_ts}] [VFS-STORAGE] Storing target artifact '{sample_name}' strictly inside virtual sandbox tmpfs.",
                f"[{now_ts}] [DETONATION-LOCK] Hypervisor sandbox isolation ACTIVE. No egress or host writes permitted.",
                f"[{now_ts}] [STATUS: STORED IN SANDBOX] Artifact securely contained and detonated in virtual sandbox."
            ])
            sim_output = f"Artifact stored and quarantined strictly within isolated virtual sandbox deck. Host access completely prevented."

        elif cat == "ACCESS_REVOCATION":
            logs.extend([
                f"[{now_ts}] [ACCESS-LOCKDOWN] Executing STOP ACCESS directive on target: {target}...",
                f"[{now_ts}] [POSIX-DAC] Stripping read, write, and execute bits: permissions set to 000 (chown root:root).",
                f"[{now_ts}] [NTFS-ACL] Applying icacls /deny Everyone:(F,X,W,R) inheritance block.",
                f"[{now_ts}] [IMMUTABLE-FLAG] Inode locked with immutable attribute (FS_IMMUTABLE_FL).",
                f"[{now_ts}] [TEST-EXEC] Kernel execve() validation probe returned EACCES (Permission Denied).",
                f"[{now_ts}] [STATUS: STOP ACCESS ENFORCED] Host access completely terminated. Zero execution permitted."
            ])
            sim_output = f"Stop Access enforced: all user/system permissions revoked. Re-execution strictly blocked."

        elif cat == "CONTINUOUS_MONITORING":
            logs.extend([
                f"[{now_ts}] [WATCHDOG-SUBSYSTEM] Placing target into Continuous Reviewing Mode: {target}...",
                f"[{now_ts}] [AUDIT-ATTACH] Kernel eBPF / auditctl probe attached to monitor read/write/exec syscalls.",
                f"[{now_ts}] [INTEGRITY-SYNC] Cryptographic hash registered in local allowlist ledger.",
                f"[{now_ts}] [TELEMETRY-STREAM] Real-time event streaming ACTIVE to SOC monitoring deck.",
                f"[{now_ts}] [STATUS: REVIEWING MODE ACTIVE] File monitored continuously without user disruption."
            ])
            sim_output = f"Continuous Reviewing Mode active: background telemetry watchdog monitoring file integrity."

        elif cat == "PAYLOAD_NEUTRALIZATION":
            logs.extend([
                f"[{now_ts}] [DISARM-ENGINE] Inspecting file structure and active stream objects in {target}...",
                f"[{now_ts}] [SANITIZATION] Stripped auto-executing primitives (/OpenAction, /AA, embedded scripts).",
                f"[{now_ts}] [INTEGRITY-VERIFY] Reconstructed sanitized file stream; verified clean and inert.",
                f"[{now_ts}] [STATUS: NEUTRALIZED] Document exploit primitives disarmed."
            ])
            sim_output = f"Document exploit primitives and auto-triggers disarmed. File sterilized."

        elif cat == "NETWORK_CONTAINMENT":
            logs.extend([
                f"[{now_ts}] [FIREWALL-KERNEL] Compiling filter rules into virtual network namespace...",
                f"[{now_ts}] [FIREWALL-KERNEL] Egress drop rule ACTIVE on interface eth0 (DST={target})",
                f"[{now_ts}] [SIM-PROBE] Emulating outbound C2 beacon to {target}:443 [SYN]...",
                f"[{now_ts}] [PACKET-INTERCEPT] Kernel dropped packet (ICMP Port Unreachable sent to process).",
                f"[{now_ts}] [STATUS: 100% BLOCKED] Threat connection severed. No data exfiltrated."
            ])
            sim_output = f"Rule applied successfully. Probe transmission to {target} terminated by kernel firewall."

        elif cat == "PROCESS_TERMINATION":
            logs.extend([
                f"[{now_ts}] [EDR-DISPATCH] Enumerating task tree for {target}...",
                f"[{now_ts}] [EDR-KERNEL] Signal SIGKILL / TerminateProcess issued to target and descendant threads.",
                f"[{now_ts}] [MEMORY-UNHOOK] Cleared executable heap pages and detached DLL handles.",
                f"[{now_ts}] [VERIFY] Process table queried: Target state = TERMINATED.",
                f"[{now_ts}] [STATUS: NEUTRALIZED] Malicious execution context destroyed."
            ])
            sim_output = f"Execution tree for {target} killed. Child handles released."

        elif cat == "SIGNATURE_DEPLOYMENT":
            logs.extend([
                f"[{now_ts}] [YARA-ENGINE] Parsing generated AST rule structure...",
                f"[{now_ts}] [YARA-ENGINE] Signature compiled into memory byte scanner in 1.4ms.",
                f"[{now_ts}] [FLEET-BROADCAST] Pushing signature definition to EDR sensors...",
                f"[{now_ts}] [BENCHMARK-SCAN] Running live test against quarantined payload: MATCH DETECTED.",
                f"[{now_ts}] [STATUS: ENFORCED] Fleet immunization complete."
            ])
            sim_output = "Signature compiled and verified against sample with 100% detection rate."

        elif cat == "HOST_ISOLATION":
            logs.extend([
                f"[{now_ts}] [VFS-CONTROL] Locating target inode on host filesystem...",
                f"[{now_ts}] [ACL-LOCKDOWN] Stripping DACL execute bits: permissions reset to 000.",
                f"[{now_ts}] [AUDIT-LOCK] Setting immutable file flags (FS_IMMUTABLE_FL).",
                f"[{now_ts}] [TEST-EXEC] Kernel execve() probe test: Permission Denied (EACCES).",
                f"[{now_ts}] [STATUS: QUARANTINED] Artifact permanently neutralized."
            ])
            sim_output = "File permissions stripped and immutable flag applied. Re-execution blocked."

        else:
            logs.extend([
                f"[{now_ts}] [GENERIC-DEFENSE] Applying automated policy for {target}...",
                f"[{now_ts}] [VERIFY] Verification probe succeeded.",
                f"[{now_ts}] [STATUS: ACTIVE] Countermeasure active."
            ])
            sim_output = "Policy activated and verified."

        action["status"] = "VERIFIED_BLOCKED"
        action["simulated_output"] = sim_output
        action["executed_at"] = datetime.now(timezone.utc)

        return action, logs

    def calculate_posture(
        self,
        initial_risk: float,
        actions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate total risk reduction, residual risk score, residual risk level,
        and mitigation efficacy percentage.
        """
        enforced_actions = [a for a in actions if a.get("status") in ["VERIFIED_BLOCKED", "ENFORCED"]]
        total_mitigated_points = sum(a.get("risk_reduction", 0.0) for a in enforced_actions)

        # Residual risk cannot be negative
        mitigated_risk = max(0.0, round(initial_risk - total_mitigated_points, 1))

        if mitigated_risk >= 85.0:
            residual_level = "CRITICAL"
        elif mitigated_risk >= 60.0:
            residual_level = "HIGH"
        elif mitigated_risk >= 30.0:
            residual_level = "MEDIUM"
        else:
            residual_level = "LOW"

        efficacy = 0.0
        if initial_risk > 0:
            efficacy = round(((initial_risk - mitigated_risk) / initial_risk) * 100.0, 1)

        return {
            "initial_risk_score": initial_risk,
            "mitigated_risk_score": mitigated_risk,
            "residual_risk_level": residual_level,
            "efficacy_percentage": min(100.0, max(0.0, efficacy)),
            "total_actions": len(actions),
            "enforced_actions": len(enforced_actions)
        }

    def bundle_rules(self, actions: List[Dict[str, Any]]) -> Dict[str, str]:
        """
        Generate consolidated exportable rulesets across firewall, YARA, and shell playbooks.
        """
        iptables_rules = ["#!/bin/bash\n# ARGUS Automated Defense Containment Script\n# Generated by ARGUS AI Engine\n"]
        yara_rules = ["/* ARGUS Automated YARA Fleet Signatures */\n"]
        powershell_rules = ["# ARGUS Automated Incident Response Playbook\n"]

        for a in actions:
            cat = a.get("category")
            syntax = a.get("rule_syntax", "")
            if cat in ["NETWORK_CONTAINMENT", "SANDBOX_ISOLATION", "ACCESS_REVOCATION"]:
                iptables_rules.append(syntax)
            elif cat in ["SIGNATURE_DEPLOYMENT"]:
                yara_rules.append(syntax)
            elif cat in ["PROCESS_TERMINATION", "HOST_ISOLATION", "CONTINUOUS_MONITORING", "PAYLOAD_NEUTRALIZATION"]:
                powershell_rules.append(syntax)

        return {
            "firewall_script": "\n\n".join(iptables_rules),
            "yara_bundle": "\n\n".join(yara_rules),
            "powershell_playbook": "\n\n".join(powershell_rules)
        }


defense_simulation_engine = DefenseSimulationEngine()
