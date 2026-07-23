param(
  [int]$Port = 8080,
  [string]$Root = $PSScriptRoot
)

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Serving $Root on $prefix"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".ico"  = "image/x-icon"
}

# In-memory party session store (lives only as long as this server process runs).
# Not persisted, not thread-safe beyond this single-threaded request loop —
# that's fine for a local party demo, not meant for production traffic.
$parties = @{}
$partyAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

function New-PartyCode {
  $code = ""
  for ($i = 0; $i -lt 6; $i++) { $code += $partyAlphabet[(Get-Random -Maximum $partyAlphabet.Length)] }
  return $code
}

function Write-JsonResponse($response, $obj, [int]$statusCode = 200) {
  $response.StatusCode = $statusCode
  $response.ContentType = "application/json; charset=utf-8"
  $json = $obj | ConvertTo-Json -Depth 8 -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  $response.ContentLength64 = $bytes.Length
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Read-Body($request) {
  $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
  $text = $reader.ReadToEnd()
  $reader.Close()
  if ([string]::IsNullOrWhiteSpace($text)) { return $null }
  return $text | ConvertFrom-Json
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response
  try {
    $path = $request.Url.AbsolutePath
    $method = $request.HttpMethod

    if ($path -eq "/api/party/create" -and $method -eq "POST") {
      $body = Read-Body $request
      $code = New-PartyCode
      $parties[$code] = @{
        code = $code
        host = @{ name = $body.hostName; dna = $body.hostDna }
        guests = New-Object System.Collections.ArrayList
        createdAt = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
      }
      Write-JsonResponse $response @{ ok = $true; code = $code }
    }
    elseif ($path -eq "/api/party/join" -and $method -eq "POST") {
      $body = Read-Body $request
      $code = "$($body.code)".ToUpper()
      if ($parties.ContainsKey($code)) {
        [void]$parties[$code].guests.Add(@{ name = $body.name; dna = $body.dna; joinedAt = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() })
        Write-JsonResponse $response @{ ok = $true }
      } else {
        Write-JsonResponse $response @{ ok = $false; error = "Party-Code nicht gefunden" } 404
      }
    }
    elseif ($path -eq "/api/party/state" -and $method -eq "GET") {
      $code = "$($request.QueryString['code'])".ToUpper()
      if ($parties.ContainsKey($code)) {
        Write-JsonResponse $response @{ ok = $true; party = $parties[$code] }
      } else {
        Write-JsonResponse $response @{ ok = $false; error = "Party-Code nicht gefunden" } 404
      }
    }
    elseif ($path -eq "/api/party/end" -and $method -eq "POST") {
      $body = Read-Body $request
      $code = "$($body.code)".ToUpper()
      $parties.Remove($code)
      Write-JsonResponse $response @{ ok = $true }
    }
    else {
      $relPath = [Uri]::UnescapeDataString($path.TrimStart('/'))
      if ([string]::IsNullOrEmpty($relPath)) { $relPath = "index.html" }
      $filePath = Join-Path $Root $relPath

      if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = $mime[$ext]
        if (-not $contentType) { $contentType = "application/octet-stream" }
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentType = $contentType
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $response.StatusCode = 404
        $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $relPath")
        $response.OutputStream.Write($notFound, 0, $notFound.Length)
      }
    }
  } catch {
    try {
      Write-JsonResponse $response @{ ok = $false; error = "$_" } 500
    } catch {
      $response.StatusCode = 500
    }
  } finally {
    $response.OutputStream.Close()
  }
}
