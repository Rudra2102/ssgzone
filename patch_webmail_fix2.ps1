$f = 'd:\Pradeep_Singh\Creations\Softwares\SSGzone\unified-login\src\WebmailDashboard.js'
$c = [System.IO.File]::ReadAllText($f)

# Find the stray fragment start — it starts right after the OOO nav closing </div>
# Pattern: the stray lines start with newline + 12 spaces + <span
$marker = "          </div>`n            <span style={{ fontSize: 14 }}>"
$idx = $c.IndexOf($marker)
Write-Host "Marker found at: $idx"

if ($idx -ge 0) {
  # Find the end of the stray fragment: ends at </div>\n        </div>
  $endMarker = "</div>`n        </div>"
  $endIdx = $c.IndexOf($endMarker, $idx)
  Write-Host "End marker at: $endIdx"
  
  if ($endIdx -ge 0) {
    # Remove from marker start to end of the stray </div>, keep \n        </div>
    $before = $c.Substring(0, $idx)
    $after = $c.Substring($endIdx)  # keeps </div>\n        </div>
    $c2 = $before + $after
    [System.IO.File]::WriteAllText($f, $c2)
    Write-Host "Fixed. Removed $($endIdx - $idx) chars of duplicate fragment."
  }
}
