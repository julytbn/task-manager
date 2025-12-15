#!/usr/bin/env pwsh
<#
.DESCRIPTION
Smoke tests for invoice API endpoints with new professional fields and lines/documents support.
#>

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Invoice API Smoke Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$apiBase = "http://localhost:3000/api"
$testResults = @()

# Helper: Make API call
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$TestName
    )
    
    try {
        $params = @{
            Uri = "$apiBase$Endpoint"
            Method = $Method
            Headers = @{ "Content-Type" = "application/json" }
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params
        $result = @{
            Test = $TestName
            Status = "✓ PASS"
            HttpCode = $response.StatusCode
            Message = "$($response.StatusCode) OK"
        }
        Write-Host "✓ $TestName: $($response.StatusCode)" -ForegroundColor Green
        return @{ success = $true; data = ($response.Content | ConvertFrom-Json); response = $response }
    }
    catch {
        $result = @{
            Test = $TestName
            Status = "✗ FAIL"
            HttpCode = $_.Exception.Response.StatusCode
            Message = $_.Exception.Message
        }
        Write-Host "✗ $TestName: $($_.Exception.Message)" -ForegroundColor Red
        return @{ success = $false; error = $_.Exception.Message }
    }
}

# Test 1: GET all invoices (should return array)
Write-Host "`n[TEST 1] GET /api/factures" -ForegroundColor Yellow
$test1 = Invoke-ApiCall -Method "Get" -Endpoint "/factures" -TestName "Fetch all invoices"
$testResults += $test1

# Test 2: POST create invoice with professional fields and lines
Write-Host "`n[TEST 2] POST /api/factures (with lignes and documentsRequis)" -ForegroundColor Yellow

$newInvoice = @{
    numero = "FAC-TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
    clientId = "test-client-id"  # This will likely fail if client doesn't exist, but tests the payload structure
    montant = 5000
    tauxTVA = 18
    dateEmission = (Get-Date -Format "yyyy-MM-dd")
    dateEcheance = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
    statut = "EN_ATTENTE"
    description = "Facture de test pour services professionnels"
    conditionsPaiement = "Net 30 jours"
    reference = "REF-TEST-001"
    montantEnLettres = "Cinq mille"
    abonnementId = $null
    projetId = $null
    lignes = @(
        @{
            designation = "Service de consultation"
            intervenant = "Équipe A"
            montantAPayer = 3000
            montantGlobal = 3540
            ordre = 1
        },
        @{
            designation = "Déplacement et frais"
            intervenant = "Équipe B"
            montantAPayer = 2000
            montantGlobal = 2360
            ordre = 2
        }
    )
    documentsRequis = @(
        @{
            nom = "Facture pro"
            obligatoire = $true
            notes = "Document justificatif"
        },
        @{
            nom = "Fiche d'intervention"
            obligatoire = $false
            notes = "Résumé des services"
        }
    )
}

$test2 = Invoke-ApiCall -Method "Post" -Endpoint "/factures" -Body $newInvoice -TestName "Create invoice with lines and documents"
$testResults += $test2

if ($test2.success) {
    $createdInvoiceId = $test2.data.id
    Write-Host "  Created invoice ID: $createdInvoiceId" -ForegroundColor Cyan
    Write-Host "  Lignes count: $($test2.data.lignes.Length)" -ForegroundColor Cyan
    Write-Host "  Documents count: $($test2.data.documentsRequis.Length)" -ForegroundColor Cyan
    
    # Test 3: GET single invoice (verify lignes and documents are returned)
    Write-Host "`n[TEST 3] GET /api/factures/{id} (verify nested relations)" -ForegroundColor Yellow
    $test3 = Invoke-ApiCall -Method "Get" -Endpoint "/factures/$createdInvoiceId" -TestName "Fetch single invoice"
    $testResults += $test3
    
    if ($test3.success) {
        Write-Host "  Returned invoice has:" -ForegroundColor Cyan
        Write-Host "    - lignes: $($test3.data.lignes.Length) items" -ForegroundColor Cyan
        Write-Host "    - documentsRequis: $($test3.data.documentsRequis.Length) items" -ForegroundColor Cyan
        Write-Host "    - description: '$($test3.data.description)'" -ForegroundColor Cyan
        Write-Host "    - conditionsPaiement: '$($test3.data.conditionsPaiement)'" -ForegroundColor Cyan
    }
    
    # Test 4: PUT update invoice (update professional fields and replace lignes/documents)
    Write-Host "`n[TEST 4] PUT /api/factures/{id} (update fields + replace nested items)" -ForegroundColor Yellow
    
    $updatePayload = @{
        statut = "EN_ATTENTE"
        montant = 5500
        tauxTVA = 18
        description = "Facture MISE À JOUR - services supplémentaires"
        conditionsPaiement = "Net 45 jours"
        reference = "REF-TEST-002"
        montantEnLettres = "Cinq mille cinq cents"
        lignes = @(
            @{
                designation = "Service principal"
                intervenant = "Équipe C"
                montantAPayer = 3500
                montantGlobal = 4130
                ordre = 1
            },
            @{
                designation = "Support additionnel"
                intervenant = "Équipe D"
                montantAPayer = 2000
                montantGlobal = 2360
                ordre = 2
            },
            @{
                designation = "Maintenance"
                intervenant = "Équipe E"
                montantAPayer = 500
                montantGlobal = 590
                ordre = 3
            }
        )
        documentsRequis = @(
            @{
                nom = "Devis approuvé"
                obligatoire = $true
            },
            @{
                nom = "Rapport d'intervention"
                obligatoire = $true
            }
        )
    }
    
    $test4 = Invoke-ApiCall -Method "Put" -Endpoint "/factures/$createdInvoiceId" -Body $updatePayload -TestName "Update invoice with replaced lines/documents"
    $testResults += $test4
    
    if ($test4.success) {
        Write-Host "  Updated invoice:" -ForegroundColor Cyan
        Write-Host "    - New montant: $($test4.data.montant)" -ForegroundColor Cyan
        Write-Host "    - New lignes count: $($test4.data.lignes.Length)" -ForegroundColor Cyan
        Write-Host "    - New documents count: $($test4.data.documentsRequis.Length)" -ForegroundColor Cyan
        Write-Host "    - Updated description: '$($test4.data.description)'" -ForegroundColor Cyan
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -eq "✓ PASS" }).Count
$total = $testResults.Count

Write-Host "Passed: $passed / $total" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })
$testResults | Format-Table -Property @(
    @{ Label = "Test"; Expression = { $_.Test } },
    @{ Label = "Result"; Expression = { $_.Status } },
    @{ Label = "Details"; Expression = { $_.Message } }
) -AutoSize

if ($passed -eq $total) {
    Write-Host "`n✓ All smoke tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n✗ Some tests failed" -ForegroundColor Red
    exit 1
}
