#!/bin/bash
# GitHub Actions Workflow Cleanup Script
# Removes old workflow runs, keeping only the last 20 for each workflow
# Usage: bash cleanup_workflows.sh [--keep N] [--workflow FILENAME]
#
# Requirements:
# - GitHub CLI (gh) installed and authenticated
# - Run from repository root or specify repo with GH_REPO env var

set -e

# Configuration
KEEP_RUNS=20  # Default: keep last 20 runs per workflow
SPECIFIC_WORKFLOW=""  # Default: all workflows
REPO_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --keep)
            KEEP_RUNS="$2"
            shift 2
            ;;
        --workflow)
            SPECIFIC_WORKFLOW="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: bash cleanup_workflows.sh [--keep N] [--workflow FILENAME]"
            echo ""
            echo "Options:"
            echo "  --keep N            Keep last N runs per workflow (default: 20)"
            echo "  --workflow FILE     Clean only specific workflow (e.g., ci.yml)"
            echo ""
            echo "Examples:"
            echo "  bash cleanup_workflows.sh                    # Clean all workflows, keep 20"
            echo "  bash cleanup_workflows.sh --keep 10          # Clean all workflows, keep 10"
            echo "  bash cleanup_workflows.sh --workflow ci.yml  # Clean only ci.yml, keep 20"
            exit 1
            ;;
    esac
done

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================="
echo "GitHub Actions Workflow Cleanup"
echo "=========================================${NC}"
echo "Repository: $(basename $REPO_DIR)"
echo "Keep last: $KEEP_RUNS runs per workflow"
if [ -n "$SPECIFIC_WORKFLOW" ]; then
    echo "Target: $SPECIFIC_WORKFLOW only"
else
    echo "Target: All workflows"
fi
echo "Time: $(date)"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}✗ GitHub CLI (gh) is not installed${NC}"
    echo "  Install: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}✗ Not authenticated with GitHub CLI${NC}"
    echo "  Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✓ GitHub CLI ready${NC}"
echo ""

# Get list of workflow files
cd "$REPO_DIR"

if [ -n "$SPECIFIC_WORKFLOW" ]; then
    # Clean only the specified workflow
    WORKFLOW_PATH=".github/workflows/$SPECIFIC_WORKFLOW"
    if [ ! -f "$WORKFLOW_PATH" ]; then
        echo -e "${RED}✗ Workflow file not found: $WORKFLOW_PATH${NC}"
        echo ""
        echo "Available workflows:"
        ls .github/workflows/*.yml 2>/dev/null | xargs -n 1 basename || echo "  None"
        exit 1
    fi
    WORKFLOW_FILES="$WORKFLOW_PATH"
else
    # Clean all workflows
    WORKFLOW_FILES=$(ls .github/workflows/*.yml 2>/dev/null || echo "")

    if [ -z "$WORKFLOW_FILES" ]; then
        echo -e "${YELLOW}No workflow files found in .github/workflows/${NC}"
        exit 0
    fi
fi

# Track statistics
TOTAL_DELETED=0
TOTAL_KEPT=0

# Process each workflow
for workflow_file in $WORKFLOW_FILES; do
    workflow_name=$(basename "$workflow_file")
    echo -e "${YELLOW}Processing: $workflow_name${NC}"

    # Get all run IDs for this workflow (sorted newest first)
    run_ids=$(gh run list --workflow="$workflow_name" --limit 1000 --json databaseId --jq '.[].databaseId' 2>/dev/null || echo "")

    if [ -z "$run_ids" ]; then
        echo "  No runs found"
        echo ""
        continue
    fi

    # Count total runs
    total=$(echo "$run_ids" | wc -l)
    echo "  Total runs: $total"

    if [ "$total" -gt "$KEEP_RUNS" ]; then
        # Calculate how many to delete
        to_delete_count=$((total - KEEP_RUNS))
        echo "  Keeping: $KEEP_RUNS (newest)"
        echo "  Deleting: $to_delete_count (oldest)"

        # Skip first N (newest), delete the rest (oldest)
        to_delete=$(echo "$run_ids" | tail -n +$((KEEP_RUNS + 1)))

        deleted=0
        while IFS= read -r run_id; do
            if [ -n "$run_id" ]; then
                echo "    Deleting run $run_id..."
                if gh run delete "$run_id" 2>/dev/null; then
                    ((deleted++)) || true
                else
                    echo "    Failed to delete run $run_id"
                fi
            fi
        done <<< "$to_delete"

        TOTAL_DELETED=$((TOTAL_DELETED + deleted))
        TOTAL_KEPT=$((TOTAL_KEPT + KEEP_RUNS))

        echo -e "  ${GREEN}✓ Deleted $deleted runs${NC}"
    else
        echo "  No cleanup needed (under retention limit)"
        TOTAL_KEPT=$((TOTAL_KEPT + total))
    fi

    echo ""
done

# Summary
echo -e "${BLUE}========================================="
echo "Cleanup Summary"
echo "=========================================${NC}"
echo "Runs deleted: $TOTAL_DELETED"
echo "Runs kept: $TOTAL_KEPT"
echo ""

if [ "$TOTAL_DELETED" -gt 0 ]; then
    echo -e "${GREEN}✓ Workflow cleanup completed successfully${NC}"
else
    echo -e "${BLUE}ℹ  No old workflow runs to clean up${NC}"
fi

exit 0
