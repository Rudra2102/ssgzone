$f = 'd:\Pradeep_Singh\Creations\Softwares\SSGzone\unified-login\src\WebmailDashboard.js'
$c = [System.IO.File]::ReadAllText($f)

# Remove the duplicate stray fragment left after OOO nav div
$old = "          </div>`n            <span style={{ fontSize: 14 }}>dY`"<</span>`n            {!sidebarCollapsed && <span>Templates</span>}`n          </div>`n        </div>"
$new = "          </div>`n        </div>"
$c2 = $c.Replace($old, $new)

if ($c2 -eq $c) {
  Write-Host "EXACT match failed, trying alternate..."
  # Try finding the stray span lines directly
  $idx = $c.IndexOf("          </div>`n            <span style={{ fontSize: 14 }}>")
  Write-Host "Index: $idx"
  if ($idx -ge 0) {
    Write-Host $c.Substring($idx, 150)
  }
} else {
  [System.IO.File]::WriteAllText($f, $c2)
  Write-Host "Fixed. File saved."
}
