/*
 * Notebook Navigator - Plugin for Obsidian
 * Copyright (c) 2025 Johan Sanneblad
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import React, { forwardRef } from 'react';
import { setIcon } from 'obsidian';
import { useSettingsState } from '../context/SettingsContext';
import { useMetadataService } from '../context/ServicesContext';
import { useContextMenu } from '../hooks/useContextMenu';
import { getIconService } from '../services/icons';
import { ItemType } from '../types';
import { TagTreeNode } from '../types/storage';

/**
 * Props for the TagTreeItem component
 */
interface TagTreeItemProps {
    /** The tag node to render */
    tagNode: TagTreeNode;
    /** Nesting level for indentation */
    level: number;
    /** Whether this tag is expanded to show children */
    isExpanded: boolean;
    /** Whether this tag is currently selected */
    isSelected: boolean;
    /** Callback when the expand/collapse chevron is clicked */
    onToggle: () => void;
    /** Callback when the tag name is clicked */
    onClick: () => void;
    /** Total count of files with this tag (including children) */
    fileCount: number;
    /** Whether to show file counts */
    showFileCount: boolean;
}

/**
 * Component that renders a single tag in the hierarchical tag tree.
 * Handles indentation, expand/collapse state, and selection state.
 */
export const TagTreeItem = React.memo(
    forwardRef<HTMLDivElement, TagTreeItemProps>(function TagTreeItem(
        { tagNode, level, isExpanded, isSelected, onToggle, onClick, fileCount, showFileCount },
        ref
    ) {
        const settings = useSettingsState();
        const metadataService = useMetadataService();
        const chevronRef = React.useRef<HTMLDivElement>(null);
        const iconRef = React.useRef<HTMLSpanElement>(null);
        const itemRef = React.useRef<HTMLDivElement>(null);

        const hasChildren = tagNode.children.size > 0;

        // Handle double-click to toggle expansion
        const handleDoubleClick = React.useCallback(
            (e: React.MouseEvent) => {
                e.preventDefault();
                if (hasChildren) {
                    onToggle();
                }
            },
            [hasChildren, onToggle]
        );

        // Get color and icon from metadata service
        const tagColor = metadataService.getTagColor(tagNode.path);
        const tagIcon = metadataService.getTagIcon(tagNode.path);

        // Update chevron icon based on expanded state
        React.useEffect(() => {
            if (chevronRef.current && hasChildren) {
                setIcon(chevronRef.current, isExpanded ? 'chevron-down' : 'chevron-right');
            }
        }, [isExpanded, hasChildren]);

        // Update tag icon
        React.useEffect(() => {
            if (iconRef.current && settings.showIcons) {
                getIconService().renderIcon(iconRef.current, tagIcon || 'tags');
            }
        }, [tagIcon, settings.showIcons]);

        // Set up forwarded ref
        React.useImperativeHandle(ref, () => itemRef.current as HTMLDivElement);

        // Add context menu
        useContextMenu(itemRef, {
            type: ItemType.TAG,
            item: tagNode.path
        });

        return (
            <div
                ref={itemRef}
                className={`nn-folder-item ${isSelected ? 'nn-selected' : ''}`}
                data-tag={tagNode.path}
                data-drop-zone="tag"
                data-drop-path={tagNode.path}
                style={{ paddingInlineStart: `${level * 20}px` }}
                role="treeitem"
                aria-expanded={hasChildren ? isExpanded : undefined}
                aria-level={level + 1}
            >
                <div className="nn-folder-content" onClick={onClick} onDoubleClick={handleDoubleClick}>
                    <div
                        ref={chevronRef}
                        className={`nn-folder-chevron ${hasChildren ? 'nn-folder-chevron--has-children' : 'nn-folder-chevron--no-children'}`}
                        onClick={e => {
                            e.stopPropagation();
                            if (hasChildren) onToggle();
                        }}
                        onDoubleClick={e => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                        tabIndex={-1}
                    />
                    {settings.showIcons && (
                        <span className="nn-folder-icon" ref={iconRef} style={tagColor ? { color: tagColor } : undefined} />
                    )}
                    <span
                        className={`nn-folder-name ${tagColor ? 'nn-has-custom-color' : ''}`}
                        style={tagColor ? { color: tagColor } : undefined}
                    >
                        {tagNode.name}
                    </span>
                    <span className="nn-folder-spacer" />
                    {showFileCount && fileCount > 0 && <span className="nn-folder-count">{fileCount}</span>}
                </div>
            </div>
        );
    })
);
