#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="project-nandi"
REGION="us-central1"
INSTANCE_ID="nandi-pilot-db"
INSTANCE_CONNECTION_NAME="${PROJECT_ID}:${REGION}:${INSTANCE_ID}"
DB_NAME="nandi"
DB_USER="nandi_app"
SA_ID="nandi-runtime"
SA_EMAIL="${SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROXY_BIN="${TMPDIR:-/tmp}/cloud-sql-proxy-v2.28.0"
PROXY_VERSION="v2.28.0"

gcloud config set project "$PROJECT_ID"
gcloud config set run/region "$REGION"

if ! gcloud sql instances describe "$INSTANCE_ID" --project="$PROJECT_ID" >/dev/null 2>&1; then
  printf 'Cloud SQL instance %s not found. Create the free-trial instance in the console first.\n' "$INSTANCE_ID" >&2
  exit 1
fi

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com \
  storage-api.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com

if ! gcloud sql databases describe "$DB_NAME" --instance="$INSTANCE_ID" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud sql databases create "$DB_NAME" --instance="$INSTANCE_ID" --project="$PROJECT_ID"
fi

DB_PASSWORD="$(openssl rand -hex 24)"
if gcloud sql users describe "$DB_USER" --instance="$INSTANCE_ID" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud sql users set-password "$DB_USER" --instance="$INSTANCE_ID" --project="$PROJECT_ID" --password="$DB_PASSWORD"
else
  gcloud sql users create "$DB_USER" --instance="$INSTANCE_ID" --project="$PROJECT_ID" --password="$DB_PASSWORD"
fi

read -rsp 'Qdrant API key: ' QDRANT_API_KEY
printf '\n'
if [[ -z "$QDRANT_API_KEY" ]]; then
  printf 'Qdrant API key is required.\n' >&2
  exit 1
fi

read -rp 'Qdrant URL: ' QDRANT_URL
if [[ -z "$QDRANT_URL" ]]; then
  printf 'Qdrant URL is required.\n' >&2
  exit 1
fi
QDRANT_URL="${QDRANT_URL%/}"

read -rp "GCS bucket name [${PROJECT_ID}-nandi-uploads]: " GCS_BUCKET
GCS_BUCKET="${GCS_BUCKET:-${PROJECT_ID}-nandi-uploads}"

read -rsp 'Gemini API key: ' GEMINI_API_KEY
printf '\n'
if [[ -z "$GEMINI_API_KEY" ]]; then
  printf 'Gemini API key is required.\n' >&2
  exit 1
fi

read -rp 'Gemini model [gemini-2.0-flash]: ' GEMINI_MODEL
GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.0-flash}"

if ! gcloud storage buckets describe "gs://${GCS_BUCKET}" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://${GCS_BUCKET}" --project="$PROJECT_ID" --location="$REGION" --uniform-bucket-level-access
fi

if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA_ID" --project="$PROJECT_ID" --display-name="Nandi runtime"
fi

for ROLE in \
  roles/secretmanager.secretAccessor \
  roles/cloudsql.client \
  roles/logging.logWriter \
  roles/monitoring.metricWriter \
  roles/storage.objectAdmin; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$ROLE" >/dev/null
done

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
BUILD_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${BUILD_SA}" \
  --role="roles/artifactregistry.writer" >/dev/null

create_secret() {
  local name="$1"
  local value="$2"
  if gcloud secrets describe "$name" --project="$PROJECT_ID" >/dev/null 2>&1; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --project="$PROJECT_ID" --data-file=- >/dev/null
  else
    printf '%s' "$value" | gcloud secrets create "$name" --project="$PROJECT_ID" --data-file=- >/dev/null
  fi
}

DIRECT_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}?schema=public"
RUNTIME_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${INSTANCE_CONNECTION_NAME}&schema=public"

create_secret nandi-db-password "$DB_PASSWORD"
create_secret nandi-db-url "$RUNTIME_DATABASE_URL"
create_secret nandi-direct-url "$DIRECT_URL"
create_secret nandi-qdrant-url "$QDRANT_URL"
create_secret nandi-qdrant-api-key "$QDRANT_API_KEY"
create_secret nandi-gcs-bucket "$GCS_BUCKET"
create_secret nandi-gemini-api-key "$GEMINI_API_KEY"

curl -fsS -X PUT \
  "${QDRANT_URL}/collections/surelm_product_knowledge" \
  -H "api-key: ${QDRANT_API_KEY}" \
  -H 'Content-Type: application/json' \
  -d '{"vectors":{"size":768,"distance":"Cosine"}}' >/dev/null

if ! gcloud artifacts repositories describe nandi --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud artifacts repositories create nandi \
    --repository-format=docker \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --description="Nandi pilot images" >/dev/null
fi

if [[ ! -x "$PROXY_BIN" ]]; then
  curl -fsSL \
    "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/${PROXY_VERSION}/cloud-sql-proxy.linux.amd64" \
    -o "$PROXY_BIN"
  chmod +x "$PROXY_BIN"
fi

"$PROXY_BIN" "$INSTANCE_CONNECTION_NAME" --port 5432 &
PROXY_PID=$!
trap 'kill "$PROXY_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  if (exec 3<>/dev/tcp/127.0.0.1/5432) 2>/dev/null; then
    exec 3>&-
    break
  fi
  sleep 1
done

cd "$REPO_DIR"
npm ci
DATABASE_URL="$DIRECT_URL" DIRECT_URL="$DIRECT_URL" npm run db:migrate
DATABASE_URL="$DIRECT_URL" DIRECT_URL="$DIRECT_URL" npm run db:seed

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/nandi/nandi-app:initial"
gcloud builds submit --project="$PROJECT_ID" --tag "$IMAGE"

gcloud run deploy nandi \
  --project="$PROJECT_ID" \
  --platform=managed \
  --region="$REGION" \
  --image="$IMAGE" \
  --service-account="$SA_EMAIL" \
  --add-cloudsql-instances="$INSTANCE_CONNECTION_NAME" \
  --set-secrets="DATABASE_URL=nandi-db-url:latest,DIRECT_URL=nandi-direct-url:latest,QDRANT_URL=nandi-qdrant-url:latest,QDRANT_API_KEY=nandi-qdrant-api-key:latest,GCS_BUCKET=nandi-gcs-bucket:latest,GEMINI_API_KEY=nandi-gemini-api-key:latest" \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GOOGLE_CLOUD_REGION=${REGION},VERTEX_AI_LOCATION=${REGION},GCS_PROJECT_ID=${PROJECT_ID},QDRANT_COLLECTION=surelm_product_knowledge,SIGNED_URL_TTL_SECONDS=900,LLM_PROVIDER=gemini,GEMINI_MODEL=${GEMINI_MODEL},FEATURE_AI_EXPLANATIONS=true,FEATURE_AI_EVIDENCE=true" \
  --min=0 \
  --max=1 \
  --port=8080 \
  --allow-unauthenticated

SERVICE_URL="$(gcloud run services describe nandi --platform=managed --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')"
for _ in $(seq 1 20); do
  if curl -fsS "$SERVICE_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 3
done

printf 'Deployed: %s\n' "$SERVICE_URL"
