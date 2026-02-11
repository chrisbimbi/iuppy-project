# Guia de Deploy no Google Cloud Platform (GCP)

Este guia descreve o passo a passo para colocar o site **iuppy.com.br** no ar utilizando o **Google Cloud Run**.

O Cloud Run é ideal para sites Next.js pois é escalável, custa pouco (paga-se pelo uso) e gerencia automaticamente a infraestrutura (Serverless).

## Pré-requisitos

1.  Ter uma conta no Google Cloud Platform.
2.  Ter um **Projeto** criado no GCP.
3.  Ter o **Google Cloud CLI (gcloud)** instalado no seu computador.
    - Se não tiver, baixe aqui: [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

---

## Passo 1: Login e Configuração

Abra o terminal na pasta do projeto (`site_iuppy`) e faça login:

```bash
gcloud auth login
```

Configure o projeto que você criou (substitua `ID-DO-SEU-PROJETO` pelo ID real):

```bash
gcloud config set project ID-DO-SEU-PROJETO
```

## Passo 2: Habilitar Serviços Necessários

Você precisa habilitar o Cloud Run e o Artifact Registry (onde a imagem Docker ficará salva).

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

## Passo 3: Deploy (Comando Único)

Graças ao `Dockerfile` que eu criei, você pode fazer o deploy diretamente do código fonte. O Google vai construir a imagem e subir para o Cloud Run automaticamente.

Execute:

```bash
gcloud run deploy site-iuppy \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000
```

> **Nota:** Se ele perguntar se pode criar um repositório no Artifact Registry, diga **Sim (y)**.

... Aguarde o processo finalizar. No final, ele te dará uma URL (ex: `https://site-iuppy-xyz.a.run.app`).

## Passo 4: Configurar Domínio (iuppy.com.br)

Para substituir o Wordpress atual pelo novo site, você precisa apontar o domínio.

1.  No painel do GCP, vá em **Cloud Run**.
2.  Clique no serviço `site-iuppy`.
3.  Vá na aba **Integrações** ou **Gerenciar Domínios personalizados**.
4.  Clique em **Adicionar Mapeamento**.
5.  Selecione "Adicionar novo domínio" e verifique a propriedade do `iuppy.com.br` (via DNS TXT record).
6.  Após verificado, o Google te dará os registros DNS (A e AAAA) para colocar no seu provedor de domínio (Registro.br, GoDaddy, etc).

**Importante:** Atualize o DNS no seu provedor e aguarde a propagação (pode levar de 1h a 24h).

---

## Resumo dos Arquivos Criados

- **`Dockerfile`**: Configurado para otimização máxima (Standalone mode).
- **`.dockerignore`**: Garante que arquivos desnecessários não vão para o servidor.
- **`next.config.ts`**: Atualizado para `output: "standalone"`.

Seu site está pronto para voar! 🚀
