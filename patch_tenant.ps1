$f = 'd:\Pradeep_Singh\Creations\Softwares\SSGzone\unified-login\src\TenantAdminDashboard.js'
$c = [System.IO.File]::ReadAllText($f)

# 1. Add autoresponders state after communicationSettings state
$old1 = "  const [communicationSettings, setCommunicationSettings] = useState({`n    email_enabled: true,`n    chat_enabled: true,`n    whatsapp_enabled: false,`n    notifications_enabled: true`n  });"
$new1 = "  const [communicationSettings, setCommunicationSettings] = useState({`n    email_enabled: true,`n    chat_enabled: true,`n    whatsapp_enabled: false,`n    notifications_enabled: true`n  });`n  const [autoresponders, setAutoresponders] = useState([]);"
$c = $c.Replace($old1, $new1)

# 2. Add autoresponder fetch after communicationSettings fetch
$old2 = "tings);`n`n      }`n    } catch (error) {"
$new2 = "tings);`n`n      }`n`n      // Fetch tenant autoresponders`n      const arRes = await fetch('https://api.ssgzone.in/api/v1/autoresponder/tenant', {`n        headers: { 'Authorization': `"Bearer `${token}`" }`n      });`n      if (arRes.ok) {`n        const arData = await arRes.json();`n        if (arData.success) setAutoresponders(arData.data);`n      }`n`n    } catch (error) {"
$c = $c.Replace($old2, $new2)

# 3. Add Out of Office tab
$old3 = "              {canUse('email') && <Tab label=`"Communication Settings`" />}`n              {canUse('analytics') && <Tab label=`"Analytics`" />}"
$new3 = "              {canUse('email') && <Tab label=`"Communication Settings`" />}`n              {canUse('analytics') && <Tab label=`"Analytics`" />}`n              {canUse('email') && <Tab label=`"Out of Office`" />}"
$c = $c.Replace($old3, $new3)

[System.IO.File]::WriteAllText($f, $c)
Write-Host "Done. Contains autoresponders: $($c.Contains('autoresponders'))"
