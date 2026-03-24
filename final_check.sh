#!/bin/bash

declare -A results

# All components organized by category
declare -a all_components=(
  # Primitives
  "Badge" "Button" "ButtonSplit" "Checkbox" "ConfirmDialog" "ContextMenu" "ContextRing" "CopyButton" "Dropdown" "FlyoutMenu" "Modal" "Popover" "ProgressiveBlur" "RadioGroup" "ResizeHandle" "SiteIcon" "StatusIndicator"
  # Composites
  "SettingsPage" "SkillInstaller" "InputChatMini" "SiteItem" "SiteToolbar" "SettingsSection" "ContentSelector" "ScreenLayout" "InputChat" "PanelToolbar" "ChatMessageList" "EmptyState" "ToolCallItem" "GlobalMenu" "SitePageThumb" "PaneGroup" "ChatMessage" "MarkdownText" "TaskRevisions" "TaskBrief"
  # Features
  "SiteNavigation" "SiteOverviewScreen" "SiteTimeline" "SiteMapScreen" "SharingScreen" "SiteSettingsScreen" "SyncScreen" "PersonaChooser" "SiteList" "SiteSkillsModal" "BlueprintPicker" "PullSitePicker" "SiteDetailsForm" "ImportDropZone" "AuthSimulation" "PermissionDialog" "DotGrid" "ProgressCard" "ShareLinkCard" "SharingEmptyState"
  # Layouts
  "BackdropPage" "BareLayout" "MainLayout"
  # Pages
  "AddSitePage" "ArchitecturePage" "Components" "DesignOverviewsPage" "DesignSystem" "DevPage" "JtbdPage" "OnboardingPage" "CompositesPage" "FeaturesPage" "PrimitivesPage"
)

for comp in "${all_components[@]}"; do
  # Search for imports (import statements) and template usage (<ComponentName)
  # Exclude the component's own directory to avoid self-references
  
  # For primitives, look in everything except primitives folder
  if grep -r "\\bimport.*$comp\\b" src --include="*.vue" --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "node_modules" | grep -v "src/components/primitives/$comp.vue" | grep -v "src/components/composites/$comp.vue" | grep -v "src/components/features/$comp.vue" | grep -v "src/layouts/$comp.vue" | grep -v "src/pages" > /dev/null 2>&1; then
    results[$comp]="USED"
  # Also check for template tags
  elif grep -r "<$comp\\b\|<$comp/" src --include="*.vue" 2>/dev/null | grep -v "node_modules" | grep -v "src/components/primitives/$comp.vue" | grep -v "src/components/composites/$comp.vue" | grep -v "src/components/features/$comp.vue" | grep -v "src/layouts/$comp.vue" | grep -v "src/pages" > /dev/null 2>&1; then
    results[$comp]="USED"
  # For pages, check in router.ts and other pages
  elif echo "$comp" | grep -qE "(Page|Layout)$"; then
    # Special case for pages and layouts - check in router
    if grep -r "\\b$comp\\b" src/router.ts src/pages src/layouts 2>/dev/null | grep -v "$comp.vue:" > /dev/null 2>&1; then
      results[$comp]="USED"
    else
      results[$comp]="UNUSED"
    fi
  else
    results[$comp]="UNUSED"
  fi
done

echo "UNUSED COMPONENTS:"
for comp in "${!results[@]}"; do
  if [ "${results[$comp]}" = "UNUSED" ]; then
    echo "  - $comp"
  fi
done | sort

echo -e "\nTotal unused: $(for comp in "${!results[@]}"; do if [ "${results[$comp]}" = "UNUSED" ]; then echo 1; fi; done | wc -l)"
