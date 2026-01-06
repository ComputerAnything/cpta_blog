#!/bin/bash
# GitHub Actions Workflow Cleanup Script
# Removes old workflow runs, keeping only the last 20 for each workflow
# Usage: bash cleanup_workflows.sh [--keep N]
#
# Requirements:
# - GitHub CLI (gh) installed and authenticated
# - Run from repository root or specify repo with GH_REPO env var

set -e

# Configuration
KEEP_RUNS=20  # Default: keep last 20 runs per workflow
REPO_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --keep)
            KEEP_RUNS="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: bash cleanup_workflows.sh [--keep N]"
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
WORKFLOW_FILES=$(ls .github/workflows/*.yml 2>/dev/null || echo "")

if [ -z "$WORKFLOW_FILES" ]; then
    echo -e "${YELLOW}No workflow files found in .github/workflows/${NC}"
    exit 0
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
        echo "$to_delete" | while read -r run_id; do
            if [ -n "$run_id" ]; then
                if gh run delete "$run_id" --yes 2>/dev/null; then
                    ((deleted++)) || true
                fi
            fi
        done

        TOTAL_DELETED=$((TOTAL_DELETED + to_delete_count))
        TOTAL_KEPT=$((TOTAL_KEPT + KEEP_RUNS))

        echo -e "  ${GREEN}✓ Cleanup complete${NC}"
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
