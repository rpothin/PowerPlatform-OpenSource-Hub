import * as React from 'react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

import {
    Badge,
    Body1,
    Button,
    Dialog,
    Subtitle1,
    Text,
    Tooltip,
} from "@fluentui/react-components";
import {
    Card,
    CardFooter,
    CardHeader,
    CardPreview,
} from "@fluentui/react-components";
import {
    Combobox,
    Option,
    useId,
} from "@fluentui/react-components";
import type { ComboboxProps } from "@fluentui/react-components";
import {
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger,
} from "@fluentui/react-components";

import { ArrowExpand16Regular, Dismiss24Regular, Eye16Filled, OpenRegular, Star16Filled } from "@fluentui/react-icons";

import { appendSelectedFilterValue, filterItems, sortItems, isActive, getRepositoryDescription, getRelaunchBadgeEntries, getFeaturedSpotlightItems } from '../../utils/galleryUtils';
import { Repository } from '../../types/repository';
import styles from './styles.module.css';

type GalleryProps = {
    items: Repository[];
    hasGoodFirstIssueChecked: boolean;
    hasHelpWantedIssueChecked: boolean;
    hasCodeOfConductChecked: boolean;
    selectedTopics: string[];
    selectedLanguages: string[];
    selectedLicenses: string[];
    selectedOwners: string[];
    selectedCategories: string[];
    selectedFocusAreas: string[];
    selectedAudiences: string[];
    sortBy: string;
    onCategoriesChange: (values: string[]) => void;
    onFocusAreasChange: (values: string[]) => void;
    onAudiencesChange: (values: string[]) => void;
    onTopicsChange: (values: string[]) => void;
    onSortByChange: (sortBy: string) => void;
    onClearAllFilters?: () => void;
}

const Gallery = ({
    items,
    hasGoodFirstIssueChecked,
    hasHelpWantedIssueChecked,
    hasCodeOfConductChecked,
    selectedTopics = [],
    selectedLanguages = [],
    selectedLicenses = [],
    selectedOwners = [],
    selectedCategories = [],
    selectedFocusAreas = [],
    selectedAudiences = [],
    sortBy,
    onCategoriesChange,
    onFocusAreasChange,
    onAudiencesChange,
    onTopicsChange,
    onSortByChange,
    onClearAllFilters,
}: GalleryProps) => {
    const [selectedItem, setSelectedItem] = useState<Repository | null>(null);
    const [hideDialog, setHideDialog] = useState(true);
    const [page, setPage] = useState(1);
    const comboId = useId("combo-orderby");
    const options = [
        { key: 'starsAsc', text: 'Stars (Ascending)' },
        { key: 'starsDesc', text: 'Stars (Descending)' },
        { key: 'alphabeticalAsc', text: 'Alphabetical (Ascending)' },
        { key: 'alphabeticalDesc', text: 'Alphabetical (Descending)' },
        { key: 'recentlyUpdated', text: 'Recently Updated' },
        { key: 'recentlyReleased', text: 'Recently Released' },
    ];
    const selectedOption = options.find((option) => option.key === sortBy) ?? options[1];
    const selectedOptions = [selectedOption.key];
    const value = selectedOption.text;
    
    const filteredItems = filterItems(items, {
        hasGoodFirstIssueChecked,
        hasHelpWantedIssueChecked,
        hasCodeOfConductChecked,
        selectedTopics,
        selectedLanguages,
        selectedLicenses,
        selectedOwners,
        selectedCategories,
        selectedFocusAreas,
        selectedAudiences,
    });

    const filterKey = JSON.stringify({
        hasGoodFirstIssueChecked, hasHelpWantedIssueChecked, hasCodeOfConductChecked,
        selectedTopics, selectedLanguages, selectedLicenses, selectedOwners,
        selectedCategories, selectedFocusAreas, selectedAudiences,
    });
    useEffect(() => { setPage(1); }, [filterKey]);

    const openDialog = (item) => {
        setSelectedItem(item);
        setHideDialog(false);
    }

    const closeDialog = () => {
        setHideDialog(true);
    }

    const openInGitHub = (url) => {
        window.open(url, "_blank");
    }

    const onOptionSelect: Partial<ComboboxProps>["onOptionSelect"] = (ev, data) => {
        const nextSortBy = data.selectedOptions?.[0];
        if (nextSortBy) {
            onSortByChange(nextSortBy);
        }
    };

    const chipButtonStyle: React.CSSProperties = {
        height: 'auto',
        minWidth: 'unset',
        padding: 0,
        marginRight: '2px',
        marginBottom: '2px',
    };

    const addSelectedFilterValue = (
        value: string,
        selectedValues: string[],
        onChange: (values: string[]) => void,
    ) => {
        const nextSelectedValues = appendSelectedFilterValue(selectedValues, value);
        if (nextSelectedValues !== selectedValues) {
            onChange(nextSelectedValues);
        }
    };

    const renderClickableBadge = ({
        key,
        testId,
        label,
        appearance,
        color,
        value,
        selectedValues,
        onChange,
        ariaLabel,
        marginBottom = '2px',
    }: {
        key: string;
        testId: string;
        label: React.ReactNode;
        appearance: 'filled' | 'tint' | 'outline';
        color?: 'brand';
        value: string;
        selectedValues: string[];
        onChange: (values: string[]) => void;
        ariaLabel: string;
        marginBottom?: string;
    }) => {
        const isSelected = selectedValues.includes(value);
        return (
            <Button
                appearance="transparent"
                aria-label={ariaLabel}
                aria-pressed={isSelected}
                key={key}
                onClick={() => addSelectedFilterValue(value, selectedValues, onChange)}
                size="small"
                style={{ ...chipButtonStyle, marginBottom }}
            >
                <Badge data-testid={testId} appearance={appearance} color={color}>
                    {label}
                </Badge>
            </Button>
        );
    };

    const renderTopicBadge = (topic: string, key: string | number, testId: string, marginBottom = '2px') =>
        renderClickableBadge({
            key: String(key),
            testId,
            label: topic,
            appearance: 'outline',
            value: topic,
            selectedValues: selectedTopics,
            onChange: onTopicsChange,
            ariaLabel: `Filter by topic ${topic}`,
            marginBottom,
        });

    const sortedItems = sortItems(filteredItems, selectedOptions);
    const featuredItems = getFeaturedSpotlightItems(sortedItems);

    const PAGE_SIZE = 30;
    const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
    const clampedPage = Math.min(page, totalPages);
    const pagedItems = sortedItems.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);
    const renderRelaunchBadges = (item: Repository, testIdPrefix: string) => {
        const badges = getRelaunchBadgeEntries(item);
        if (badges.length === 0) {
            return null;
        }

        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '4px' }}>
                {badges.map((badge) => {
                    const testId = `${testIdPrefix}-${badge.testIdSuffix}-badge`;
                    if (badge.filterFacet && badge.filterValue) {
                        const filterConfig = badge.filterFacet === 'category'
                            ? { selectedValues: selectedCategories, onChange: onCategoriesChange, ariaLabel: `Filter by ${badge.label}` }
                            : badge.filterFacet === 'focusArea'
                                ? { selectedValues: selectedFocusAreas, onChange: onFocusAreasChange, ariaLabel: `Filter by ${badge.label}` }
                                : { selectedValues: selectedAudiences, onChange: onAudiencesChange, ariaLabel: `Filter by ${badge.label}` };

                        return renderClickableBadge({
                            key: badge.key,
                            testId,
                            label: badge.label,
                            appearance: badge.appearance,
                            color: badge.color,
                            value: badge.filterValue,
                            ...filterConfig,
                        });
                    }

                    return (
                        <Badge
                            data-testid={testId}
                            appearance={badge.appearance}
                            color={badge.color}
                            key={badge.key}
                            style={{ marginRight: '2px', marginBottom: '2px' }}
                        >
                            {badge.label}
                        </Badge>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{ width: '100%' }}>
            <div className={styles.galleryHeader}>
                <Text id="repositoryCount" size={400}>{`${filteredItems.length} ${filteredItems.length === 1 ? 'repository' : 'repositories'} found`}{totalPages > 1 ? ` (page ${clampedPage} of ${totalPages})` : ''}</Text>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Text id={comboId} style={{ marginRight: '10px' }} size={400}>Sort by</Text>
                    <Combobox
                        id="orderByCombobox" // Add an ID for easier UI testing
                        aria-labelledby={comboId}
                        style={{ marginRight: '20px' }} // Add a 20px margin on the right
                        value={value}
                        selectedOptions={selectedOptions}
                        onOptionSelect={onOptionSelect}
                    >
                        {options.map((option) => (
                            <Option key={option.key} value={option.key} text={option.text}>
                                {option.text}
                            </Option>
                        ))}
                    </Combobox>
                </div>
            </div>
            {featuredItems.length > 0 && (
                <section
                    aria-label="Featured repositories"
                    data-testid="featured-spotlight"
                    style={{ margin: '0 10px 10px', padding: '10px' }}
                >
                    <Subtitle1>Featured repositories</Subtitle1>
                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '8px 0' }}>
                        {featuredItems.map((item) => (
                            <Card
                                data-testid="featured-repository-card"
                                key={`featured-${item.repositoryId ?? item.fullName}`}
                                style={{ flex: '0 0 320px', maxWidth: '320px' }}
                            >
                                <CardHeader
                                    header={
                                        <div className={styles.cardHeader}>
                                            <Body1>{item.fullName}</Body1>
                                            <Badge appearance="filled" color="warning" icon={<Star16Filled />}>{item.stargazerCount}</Badge>
                                        </div>
                                    }
                                />
                                <CardPreview className={styles.cardBreakLine} />
                                <Text data-testid="featured-repository-description">
                                    {getRepositoryDescription(item).length > 110
                                        ? `${getRepositoryDescription(item).substring(0, 110)}...`
                                        : getRepositoryDescription(item)}
                                </Text>
                                {renderRelaunchBadges(item, 'featured')}
                                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                    {item.topics.slice(0, 3).map((topic, index) => (
                                        renderTopicBadge(topic, `featured-${topic}-${index}`, 'featured-topic-badge')
                                    ))}
                                </div>
                                <CardFooter className={styles.cardFooter}>
                                    <Button data-testid="featured-open-in-github-button" data-repository-url={item.url} icon={<OpenRegular fontSize={16} />} onClick={() => openInGitHub(item.url)}>Open</Button>
                                    <Button data-testid="featured-see-more-button" icon={<ArrowExpand16Regular fontSize={16} />} onClick={() => openDialog(item)}>See more</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>
            )}
            {filteredItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', width: '100%' }}>
                    <Text size={500} style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>No repositories found</Text>
                    <Text size={300} style={{ display: 'block', marginBottom: '20px', color: 'var(--ifm-color-secondary-darkest)' }}>
                        Try adjusting your search or filters.
                    </Text>
                    {onClearAllFilters && (
                        <Button appearance="primary" onClick={onClearAllFilters}>Clear all filters</Button>
                    )}
                </div>
            ) : (
                <>
                    <div className={styles.gallery}>
                        {pagedItems.map((item) => (
                            <Card role="article" className={styles.galleryItem} data-testid="repository-card" key={item.repositoryId ?? item.fullName}>
                                {["microsoft", "azure"].includes(item.owner.login.toLowerCase()) ? (
                                    <CardHeader
                                        header={
                                            <div className={styles.cardHeader}>
                                                <div className={styles.cardHeaderLeftContent}>
                                                    <img src="/PowerPlatform-OpenSource-Hub/img/Microsoft.svg" alt='Microsoft logo' width="16px" height="16px" style={{ paddingRight: '5px' }} />
                                                    <Body1>
                                                        Microsoft Authored
                                                    </Body1>
                                                </div>
                                                <div className={styles.cardHeaderRightContent}>
                                                    {isActive(item.updatedAt) && 
                                                        <Tooltip content={`Last update on: ${format(new Date(item.updatedAt), 'yyyy-MM-dd')}`} relationship={'label'}>
                                                            <Badge data-testid="active-badge" appearance="outline" style={{ marginRight: '5px' }}>🔥 Active</Badge>
                                                        </Tooltip>
                                                    }
                                                    <Badge data-testid="stars-badge" appearance="filled" color="warning" icon={<Star16Filled />}>{item.stargazerCount}</Badge>
                                                </div>
                                            </div>
                                        }
                                    />
                                ) : (
                                    <CardHeader
                                        header={
                                            <div className={styles.cardHeader}>
                                                <div className={styles.cardHeaderLeftContent}>
                                                    <img src="/PowerPlatform-OpenSource-Hub/img/Community.svg" alt='Community icon' width="16px" height="16px" style={{ paddingRight: '5px' }} />
                                                    <Body1>
                                                        Community Authored
                                                    </Body1>
                                                </div>
                                                <div className={styles.cardHeaderRightContent}>
                                                    {isActive(item.updatedAt) && 
                                                        <Tooltip content={`Last update on: ${format(new Date(item.updatedAt), 'yyyy-MM-dd')}`} relationship={'label'}>
                                                            <Badge data-testid="active-badge" appearance="outline" style={{ marginRight: '5px' }}>🔥 Active</Badge>
                                                        </Tooltip>
                                                    }
                                                    <Badge data-testid="stars-badge" appearance="filled" color="warning" icon={<Star16Filled />}>{item.stargazerCount}</Badge>
                                                </div>
                                            </div>
                                        }
                                    />
                                )}

                                <CardPreview className={styles.cardBreakLine} />

                                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <Subtitle1 data-testid="repository-full-name" style={{ maxHeight: '60px', height: '60px', fontSize: '16px' }}>
                                        {item.fullName}
                                    </Subtitle1>
                                </a>

                                <Text data-testid="repository-description">
                                    {getRepositoryDescription(item).length > 150 ?
                                        <p>
                                            {getRepositoryDescription(item).substring(0, 150) + '... '}
                                        </p>
                                        :
                                        getRepositoryDescription(item)
                                    }
                                </Text>

                                {renderRelaunchBadges(item, 'card')}

                                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                    {item.topics.slice(0, 4).map((topic, index) => (
                                        renderTopicBadge(topic, `${topic}-${index}`, 'topic-badge')
                                    ))}
                                    {item.topics.length > 4 && (
                                        <Badge appearance="ghost" style={{ marginRight: '2px', marginBottom: '2px', fontSize: '11px', cursor: 'default' }}>
                                            +{item.topics.length - 4} more
                                        </Badge>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '0 4px 4px' }}>
                                    {item.language && (
                                        <Badge appearance="tint" style={{ fontSize: '11px' }}>{item.language}</Badge>
                                    )}
                                    <Badge appearance="tint" style={{ fontSize: '11px' }}>
                                        Updated {format(new Date(item.updatedAt), 'MMM yyyy')}
                                    </Badge>
                                </div>

                                <CardFooter className={styles.cardFooter}>
                                    <Button data-testid="open-in-github-button" data-repository-url={item.url} icon={<OpenRegular fontSize={16} />} onClick={() => openInGitHub(item.url)}>Open in GitHub</Button>
                                    <Button data-testid="see-more-button" icon={<ArrowExpand16Regular fontSize={16} />} onClick={() => openDialog(item)}>See more...</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', margin: '16px 0', flexWrap: 'wrap' }}>
                            <Button
                                appearance="secondary"
                                disabled={clampedPage === 1}
                                onClick={() => setPage(clampedPage - 1)}
                                style={{ minHeight: '44px' }}
                            >
                                Previous
                            </Button>
                            {(() => {
                                const start = Math.max(1, clampedPage - 2);
                                const end = Math.min(totalPages, start + 4);
                                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
                                    <Button
                                        key={p}
                                        appearance={p === clampedPage ? 'primary' : 'subtle'}
                                                        aria-label={`Go to page ${p}`}
                                                        aria-current={p === clampedPage ? 'page' : undefined}
                                                        onClick={() => setPage(p)}
                                                        style={{ minHeight: '44px', minWidth: '44px' }}
                                                    >
                                                        {p}
                                                    </Button>
                                                ));
                            })()}
                            <Button
                                appearance="secondary"
                                disabled={clampedPage === totalPages}
                                onClick={() => setPage(clampedPage + 1)}
                                style={{ minHeight: '44px' }}
                            >
                                Next
                            </Button>
                        </nav>
                    )}
                </>
            )}
            <Dialog
                open={!hideDialog}
                onOpenChange={(_, data) => setHideDialog(!data.open)}
            >
                <DialogSurface data-testid="repository-dialog">
                    <DialogTitle data-testid="dialog-title" className={styles.dialogTitle}>
                        {selectedItem?.fullName}
                        <div style={{ display: 'flex', gap: '5px', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                            {isActive(selectedItem?.updatedAt) && 
                                <Tooltip content={`Last update on: ${format(new Date(selectedItem?.updatedAt), 'yyyy-MM-dd')}`} relationship={'label'}>
                                    <Badge data-testid="dialog-active-badge" appearance="outline" style={{ marginRight: '5px' }}>🔥 Active</Badge>
                                </Tooltip>
                            }
                            <Badge data-testid="dialog-stars-badge" appearance="filled" color="warning" icon={<Star16Filled />}>{selectedItem?.stargazerCount}</Badge>
                            <Badge data-testid="dialog-watchers-badge" appearance="outline" icon={<Eye16Filled />}>{selectedItem?.watchers.totalCount}</Badge>
                            <DialogTrigger action="close">
                                <Button
                                    appearance="subtle"
                                    aria-label="close"
                                    icon={<Dismiss24Regular />}
                                    onClick={closeDialog}
                                />
                            </DialogTrigger>
                        </div>
                    </DialogTitle>
                    <DialogContent style={{ marginBottom: '16px', marginTop: '16px' }}>
                        <DialogBody>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text data-testid="dialog-description">
                                    {getRepositoryDescription(selectedItem)}
                                </Text>
                                {selectedItem && renderRelaunchBadges(selectedItem, 'dialog')}
                                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', flexDirection: 'column' }}>
                                    {selectedItem?.license?.name && (
                                        <Badge data-testid="dialog-license-badge" appearance="tint" style={{ marginBottom: '4px' }}>License: {selectedItem?.license?.name}</Badge>
                                    )}
                                    <Badge data-testid="dialog-good-first-issues-badge" appearance="tint" style={{ marginBottom: '4px' }}>Good 1st Issues: {selectedItem?.openedGoodFirstIssues}</Badge>
                                    <Badge data-testid="dialog-help-wanted-issues-badge" appearance="tint" style={{ marginBottom: '4px' }}>Help Wanted Issues: {selectedItem?.openedHelpWantedIssues}</Badge>
                                    {selectedItem?.language && (
                                        <Badge data-testid="dialog-main-language-badge" appearance="tint" style={{ marginBottom: '4px' }}>Language: {selectedItem?.language}</Badge>
                                    )}
                                    {selectedItem?.latestRelease && (
                                        <Badge data-testid="dialog-latest-release-badge" appearance="tint" style={{ marginBottom: '4px' }}>Latest Release: {selectedItem?.latestRelease.tagName} ({format(new Date(selectedItem?.latestRelease.publishedAt), 'yyyy-MM-dd')})</Badge>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                {selectedItem?.topics.map((topic, index) => (
                                    renderTopicBadge(topic, `dialog-${topic}-${index}`, 'dialog-topic-badge', '1px')
                                ))}
                            </div>
                        </DialogBody>
                    </DialogContent>
                    <DialogActions>
                        <Button data-testid="dialog-close-button" appearance="secondary" onClick={closeDialog}>Close</Button>
                        <Button data-testid="dialog-open-in-github-button" data-repository-url={selectedItem?.url} appearance="primary" onClick={() => openInGitHub(selectedItem?.url)}>Open in GitHub</Button>
                    </DialogActions>
                </DialogSurface>
            </Dialog>
        </div>
    );
};

export default Gallery;
