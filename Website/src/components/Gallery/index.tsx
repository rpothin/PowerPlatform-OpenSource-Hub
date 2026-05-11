import * as React from 'react';
import { useState } from 'react';
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

import { filterItems, sortItems, isActive } from '../../utils/galleryUtils';
import { formatFacetLabel } from '../../utils/filterPaneUtils';
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
    onSortByChange: (sortBy: string) => void;
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
    onSortByChange,
}: GalleryProps) => {
    const [selectedItem, setSelectedItem] = useState<Repository | null>(null);
    const [hideDialog, setHideDialog] = useState(true);
    const comboId = useId("combo-orderby");
    const options = [
        { key: 'starsAsc', text: 'Stars (Ascending)' },
        { key: 'starsDesc', text: 'Stars (Descending)' },
        { key: 'alphabeticalAsc', text: 'Alphabetical (Ascending)' },
        { key: 'alphabeticalDesc', text: 'Alphabetical (Descending)' },
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

    const sortedItems = sortItems(filteredItems, selectedOptions);
    const getRepositoryDescription = (item?: Repository | null): string =>
        item?.displayDescription ?? item?.customDescription ?? item?.description ?? '';

    const hasRelaunchBadges = (item: Repository): boolean =>
        !!(
            item.featured ||
            item.category ||
            item.focusAreas?.length ||
            item.audiences?.length ||
            item.health?.computed?.activityStatus ||
            item.health?.curated?.maintenance ||
            item.health?.curated?.maturity
        );

    const renderRelaunchBadges = (item: Repository, testIdPrefix: string) => {
        if (!hasRelaunchBadges(item)) {
            return null;
        }

        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '4px' }}>
                {item.featured && (
                    <Badge data-testid={`${testIdPrefix}-featured-badge`} appearance="filled" color="brand" style={{ marginRight: '2px', marginBottom: '2px' }}>Featured</Badge>
                )}
                {item.category && (
                    <Badge data-testid={`${testIdPrefix}-category-badge`} appearance="tint" style={{ marginRight: '2px', marginBottom: '2px' }}>Category: {formatFacetLabel(item.category)}</Badge>
                )}
                {item.focusAreas?.map((focusArea, index) => (
                    <Badge data-testid={`${testIdPrefix}-focus-area-badge`} appearance="outline" key={`focus-${focusArea}-${index}`} style={{ marginRight: '2px', marginBottom: '2px' }}>Focus: {formatFacetLabel(focusArea)}</Badge>
                ))}
                {item.audiences?.map((audience, index) => (
                    <Badge data-testid={`${testIdPrefix}-audience-badge`} appearance="outline" key={`audience-${audience}-${index}`} style={{ marginRight: '2px', marginBottom: '2px' }}>Audience: {formatFacetLabel(audience)}</Badge>
                ))}
                {item.health?.computed?.activityStatus && (
                    <Badge data-testid={`${testIdPrefix}-health-badge`} appearance="tint" style={{ marginRight: '2px', marginBottom: '2px' }}>Health: {formatFacetLabel(item.health.computed.activityStatus)}</Badge>
                )}
                {item.health?.curated?.maintenance && (
                    <Badge data-testid={`${testIdPrefix}-maintenance-badge`} appearance="tint" style={{ marginRight: '2px', marginBottom: '2px' }}>Maintenance: {formatFacetLabel(item.health.curated.maintenance)}</Badge>
                )}
                {item.health?.curated?.maturity && (
                    <Badge data-testid={`${testIdPrefix}-maturity-badge`} appearance="tint" style={{ marginRight: '2px', marginBottom: '2px' }}>Maturity: {formatFacetLabel(item.health.curated.maturity)}</Badge>
                )}
            </div>
        );
    };

    return (
        <div style={{ width: '100%' }}>
            <div className={styles.galleryHeader}>
                <Text id="repositoryCount" size={400}>{`${filteredItems.length} repositories found`}</Text>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Text id={comboId} style={{ marginRight: '10px' }} size={400}>Order By</Text>
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
            <div className={styles.gallery}>
                {sortedItems.map((item, index) => (
                    <Card className={styles.galleryItem} data-testid="repository-card" key={index}>
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
                                            <Badge data-testid="stars-badge" appearance="filled" color="warning" icon={<Star16Filled />} key={index}>{item.stargazerCount}</Badge>
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
                                            <Badge data-testid="stars-badge" appearance="filled" color="warning" icon={<Star16Filled />} key={index}>{item.stargazerCount}</Badge>
                                        </div>
                                    </div>
                                }
                            />
                        )}

                        <CardPreview className={styles.cardBreakLine} />

                        <Subtitle1 data-testid="repository-full-name" style={{ maxHeight: '60px', height: '60px', fontSize: '16px' }}>
                            {item.fullName}
                        </Subtitle1>

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
                            {item.topics.slice(0, 5).map((topic, index) => (
                                <Badge data-testid="topic-badge" appearance="outline" key={index} style={{ marginRight: '2px', marginBottom: '2px' }}>{topic}</Badge>
                            ))}
                        </div>

                        <CardFooter className={styles.cardFooter}>
                            <Button data-testid="open-in-github-button" data-repository-url={item.url} icon={<OpenRegular fontSize={16} />} onClick={() => openInGitHub(item.url)}>Open in GitHub</Button>
                            <Button data-testid="see-more-button" icon={<ArrowExpand16Regular fontSize={16} />} onClick={() => openDialog(item)}>See more...</Button>
                        </CardFooter>
                    </Card>
                ))}
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
                                        <Badge data-testid="dialog-topic-badge" appearance="outline" key={index} style={{ marginRight: '2px', marginBottom: '1px' }}>{topic}</Badge>
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
        </div>
    );
};

export default Gallery;
