$f = 'd:\Pradeep_Singh\Creations\Softwares\SSGzone\unified-login\src\WebmailDashboard.js'
$c = [System.IO.File]::ReadAllText($f)

# Fix the closing div that lost its indentation
$old = "            {!sidebarCollapsed && <span>Out of Office</span>}`n</div>"
$new = "            {!sidebarCollapsed && <span>Out of Office</span>}`n          </div>"
$c2 = $c.Replace($old, $new)

if ($c2 -eq $c) { Write-Host "No change made" } else {
  [System.IO.File]::WriteAllText($f, $c2)
  Write-Host "Fixed indentation."
}
