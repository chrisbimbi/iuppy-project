#!/bin/bash
# Script para gerar certificado de teste .pfx
# Este certificado é APENAS para testes locais, NÃO usar em produção!

echo "📜 Gerando Certificado de Teste para eSocial"
echo "=============================================="
echo ""

# Configurações
CERT_DIR="./test-certificates"
COMPANY_NAME="Empresa Teste LTDA"
CNPJ="12345678000100"
PASSWORD="teste123"
DAYS_VALID=365

# Criar diretório
mkdir -p $CERT_DIR
cd $CERT_DIR

echo "1️⃣ Gerando chave privada..."
openssl genrsa -out test-private-key.pem 2048 2>/dev/null

echo "2️⃣ Criando requisição de certificado (CSR)..."
openssl req -new -key test-private-key.pem -out test-cert.csr \
  -subj "/C=BR/ST=SP/L=Sao Paulo/O=$COMPANY_NAME/OU=TI/CN=CNPJ:$CNPJ" 2>/dev/null

echo "3️⃣ Gerando certificado auto-assinado..."
openssl x509 -req -days $DAYS_VALID -in test-cert.csr \
  -signkey test-private-key.pem -out test-cert.pem 2>/dev/null

echo "4️⃣ Criando arquivo .pfx (PKCS#12)..."
openssl pkcs12 -export \
  -out test-esocial-certificate.pfx \
  -inkey test-private-key.pem \
  -in test-cert.pem \
  -password pass:$PASSWORD

# Limpar arquivos temporários
rm test-private-key.pem test-cert.csr test-cert.pem

echo ""
echo "✅ Certificado gerado com sucesso!"
echo "=============================================="
echo ""
echo "📁 Localização: $CERT_DIR/test-esocial-certificate.pfx"
echo "🔐 Senha: $PASSWORD"
echo "📅 Validade: $DAYS_VALID dias"
echo "🏢 Empresa: $COMPANY_NAME"
echo "🆔 CNPJ: $CNPJ"
echo ""
echo "⚠️  ATENÇÃO: Este é um certificado de TESTE!"
echo "   - Use APENAS para desenvolvimento local"
echo "   - NÃO use em produção"
echo "   - Para produção, use um e-CNPJ oficial"
echo ""
echo "🧪 Para testar:"
echo "   1. Vá para /nr1/esocial/config"
echo "   2. Habilite o eSocial"
echo "   3. Faça upload do arquivo: test-esocial-certificate.pfx"
echo "   4. Digite a senha: teste123"
echo ""
