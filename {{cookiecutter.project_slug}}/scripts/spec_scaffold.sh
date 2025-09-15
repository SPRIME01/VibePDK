#!/bin/bash
# DRY file-copy logic for spec-kit template handling
# Used by Just recipes to scaffold spec/plan/tasks files from templates

set -euo pipefail

# Function to display usage
usage() {
  echo "Usage: $0 <template> <output_dir> <thread> <feature_name> [family] [prd_id] [adr_id] [sds_id] [ts_id] [task_id]"
  echo "  template: path to template file"
  echo "  output_dir: directory where output file will be created"
  echo "  thread: thread identifier for the spec"
  echo "  feature_name: name of the feature"
  echo "  family: (optional) family identifier for plan files (adr, prd, sds, ts, task)"
  echo "  prd_id: (optional) PRD identifier for feature templates"
  echo "  adr_id: (optional) ADR identifier for ADR plan templates"
  echo "  sds_id: (optional) SDS identifier for SDS plan templates"
  echo "  ts_id: (optional) TS identifier for TS plan templates"
  echo "  task_id: (optional) TASK identifier for tasks templates"
  exit 1
}


# Check arguments
if [[ $# -lt 4 ]]; then
  usage
fi

TEMPLATE="$1"
OUTPUT_DIR="$2"
THREAD="$3"
FEATURE_NAME="$4"
FAMILY="${5:-}"
PRD_ID="${6:-}"
ADR_ID="${7:-}"
SDS_ID="${8:-}"
TS_ID="${9:-}"
TASK_ID="${10:-}"

# Validate template exists
if [[ ! -f "$TEMPLATE" ]]; then
  echo "Error: Template file '$TEMPLATE' not found" >&2
  exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Determine output filename based on template type
if [[ "$TEMPLATE" == *"spec.feature.template.md" ]]; then
  # Create thread-specific directory for feature specs
  THREAD_DIR="$OUTPUT_DIR/$THREAD"
  mkdir -p "$THREAD_DIR"
  OUTPUT_FILE="$THREAD_DIR/spec.md"
  if [[ -z "$PRD_ID" ]]; then
    echo "Error: PRD_ID is required for feature templates" >&2
    exit 1
  fi
elif [[ "$TEMPLATE" == *"spec.plan"*".prompt.md" ]]; then
  if [[ -z "$FAMILY" ]]; then
    echo "Error: FAMILY is required for plan templates" >&2
    exit 1
  fi

  # Validate family type
  case "$FAMILY" in
    adr|prd|sds|ts|task)
      # Create thread-specific directory for plan specs
      THREAD_DIR="$OUTPUT_DIR/$THREAD"
      mkdir -p "$THREAD_DIR"
      OUTPUT_FILE="$THREAD_DIR/plan.$FAMILY.md"
      ;;
    *)
      echo "Error: Unknown family '$FAMILY'. Supported families: adr, prd, sds, ts, task" >&2
      exit 1
      ;;
  esac

  # Validate ADR_ID for ADR templates
  if [[ "$FAMILY" == "adr" ]] && [[ -z "$ADR_ID" ]]; then
    echo "Error: ADR_ID is required for ADR plan templates" >&2
    exit 1
  fi
elif [[ "$TEMPLATE" == *"spec.tasks.template.md" ]]; then
  # Create thread-specific directory for tasks specs
  THREAD_DIR="$OUTPUT_DIR/$THREAD"
  mkdir -p "$THREAD_DIR"
  OUTPUT_FILE="$THREAD_DIR/tasks.md"
  if [[ -z "$TASK_ID" ]]; then
    echo "Error: TASK_ID is required for tasks templates" >&2
    exit 1
  fi
else
  echo "Error: Unsupported template type '$TEMPLATE'" >&2
  exit 1
fi

# Copy template to output file
cp "$TEMPLATE" "$OUTPUT_FILE"

# Replace template variables with actual values
sed -i.bak "s/{% raw %}{{ FEATURE_NAME }}{% endraw %}/$FEATURE_NAME/g" "$OUTPUT_FILE"
sed -i.bak "s/{% raw %}{{ THREAD_ID }}{% endraw %}/$THREAD/g" "$OUTPUT_FILE"

# Replace specific ID variables based on template type
if [[ "$TEMPLATE" == *"spec.feature.template.md" ]]; then
  sed -i.bak "s/{% raw %}{{ PRD_ID }}{% endraw %}/$PRD_ID/g" "$OUTPUT_FILE"
elif [[ "$TEMPLATE" == *"spec.plan"*".prompt.md" ]]; then
  # Handle different plan types based on family
  case "$FAMILY" in
    adr)
      sed -i.bak "s/{% raw %}{{ ADR_ID }}{% endraw %}/$ADR_ID/g" "$OUTPUT_FILE"
      ;;
    prd)
      sed -i.bak "s/{% raw %}{{ PRD_ID }}{% endraw %}/$PRD_ID/g" "$OUTPUT_FILE"
      ;;
    sds)
      sed -i.bak "s/{% raw %}{{ SDS_ID }}{% endraw %}/$SDS_ID/g" "$OUTPUT_FILE"
      ;;
    ts)
      sed -i.bak "s/{% raw %}{{ TS_ID }}{% endraw %}/$TS_ID/g" "$OUTPUT_FILE"
      ;;
    task)
      sed -i.bak "s/{% raw %}{{ TASK_ID }}{% endraw %}/$TASK_ID/g" "$OUTPUT_FILE"
      ;;
  esac
elif [[ "$TEMPLATE" == *"spec.tasks.template.md" ]]; then
  sed -i.bak "s/{% raw %}{{ TASK_ID }}{% endraw %}/$TASK_ID/g" "$OUTPUT_FILE"
fi

# Remove backup file created by sed
rm "$OUTPUT_FILE.bak"

echo "Scaffolded $OUTPUT_FILE from $TEMPLATE"
