#!/bin/bash

API="http://localhost:4000" # Mapped in docker-compose
COMPANY="ACME_TEST"

# 0. Login & Get Token
echo "Logging in..."
TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@iuppy.com.br","password":"123"}' | jq -r '.accessToken')

if [ "$TOKEN" == "null" ]; then
  echo "Login Failed!"
  exit 1
fi
echo "Login Success! Token: ${TOKEN:0:10}..."

AUTH="Authorization: Bearer $TOKEN"

echo "\n=== F0: Preflight ==="
curl -s -w "\n%{http_code}\n" "$API/health"
curl -s -w "\n%{http_code}\n" "$API/feature-flags" -H "$AUTH"

echo "\n=== F2: Inventory (App Flow) ==="
# 1. Create Risk (App/CMS)
# 1. Create Risk (App/CMS)
RESPONSE=$(curl -s -X POST "$API/nr1/risks" \
  -H 'Content-Type: application/json' \
  -H "$AUTH" \
  -d '{
    "company_id": "'"$COMPANY"'",
    "processo": "CURL_TEST",
    "perigo": "Ruído Intenso",
    "classificacao_risco": "a",
    "ambiente": "Galpão Principal",
    "atividade": "Operação de Máquinas",
    "fonte_circunstancia": "Motor Gerador",
    "possiveis_lesoes": "Perda Auditiva",
    "grupos_expostos": ["Operadores"],
    "medidas_prevencao": [{"desc": "Protetor Auricular", "status": "implementado"}],
    "caracterizacao_exposicao": "Contínua"
  }')

echo "Create Response: $RESPONSE"
RISK_ID=$(echo $RESPONSE | jq -r '.id')
echo "Risk Created: $RISK_ID"

# 2. List Risks (App Feed)
echo "Listing Risks:"
curl -s "$API/nr1/risks?companyId=$COMPANY" -H "$AUTH" | jq '. | length'

# 3. Publish Version (CMS Action)
curl -s -X POST "$API/nr1/risks/publish" \
  -H 'Content-Type: application/json' \
  -H "$AUTH" \
  -d '{"companyId":"'"$COMPANY"'","spaceId":null}'

echo "\n=== F7: Analytics (Dashboard) ==="
curl -s "$API/nr1/analytics/dashboard?companyId=$COMPANY" -H "$AUTH"

echo "\n=== F4: eSocial (Gov Integration) ==="
# Generate S-2240 for an Employee
curl -s -X POST "$API/nr1/esocial/generate-s2240" \
  -H 'Content-Type: application/json' \
  -H "$AUTH" \
  -d '{"employeeId":"emp-001-test"}'

# Check Queue
echo "eSocial Queue:"
curl -s "$API/nr1/esocial/queue?companyId=$COMPANY" -H "$AUTH"

echo "\n=== F3: Evidence Vault ==="
# Verify we can list evidence even if empty
curl -s "$API/nr1/evidence?companyId=$COMPANY" -H "$AUTH"


