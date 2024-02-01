// Importing necessary libraries and components
// React library
import * as React from 'react';
import { useState } from 'react';
import { format } from 'date-fns';

// Fluent UI libraries
import { Dialog } from '@fluentui/react';
import {
    Badge,
    Body1,
    Button,
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

// Fluent UI icons
import { ArrowExpand16Regular, Dismiss24Regular, Eye16Filled, OpenRegular, Star16Filled } from "@fluentui/react-icons";

// Local files
import { filterItems, sortItems, isActive } from '../../utils/galleryUtils';
import styles from './styles.module.css';

// Defining the Gallery component
const Gallery = ({ items, hasGoodFirstIssueChecked, hasHelpWantedIssueChecked, hasCodeOfConductChecked, selectedTopics = [], selectedLanguages = [], selectedLicenses = [], selectedOwners = [] }) => {
    const [selectedItem, setSelectedItem] = useState(null);
    const [hideDialog, setHideDialog] = useState(true);
    const comboId = useId("combo-orderby");
    const options = [
        { key: 'starsAsc', text: 'Stars (Ascending)' },
        { key: 'starsDesc', text: 'Stars (Descending)' },
        { key: 'alphabeticalAsc', text: 'Alphabetical (Ascending)' },
        { key: 'alphabeticalDesc', text: 'Alphabetical (Descending)' },
    ];
    const [selectedOptions, setSelectedOptions] = React.useState<string[]>([
        "starsDesc",
    ]);
    const [value, setValue] = React.useState("Stars (Descending)");
    
    // Filter items based on selected criteria
    const filteredItems = filterItems(items, {
        hasGoodFirstIssueChecked,
        hasHelpWantedIssueChecked,
        hasCodeOfConductChecked,
        selectedTopics,
        selectedLanguages,
        selectedLicenses,
        selectedOwners,
    });

    /**
     * Opens a dialog with the selected item.
     * @param item - The selected item.
     */
    const openDialog = (item) => {
        setSelectedItem(item);
        setHideDialog(false);
    }

    /**
     * Closes the dialog.
     */
    const closeDialog = () => {
        setHideDialog(true);
    }

    /**
     * Opens the specified URL in a new tab.
     * @param url - The URL to open.
     */
    const openInGitHub = (url) => {
        window.open(url, "_blank");
    }

    /**
     * Handles the change in order by combobox.
     * @param ev - The event object.
     * @param data - The selected options data.
     */
    const onOptionSelect: Partial<ComboboxProps>["onOptionSelect"] = (ev, data) => {
        //alert(`onOptionSelect fired for ${data.optionText} / ${data.selectedOptions[0]} (${data.selectedOptions.length} selected options)`);
        setSelectedOptions(data.selectedOptions);
        setValue(data.optionText ?? "");
    };

    // Sort the filtered items based on the selected order by option
    const sortedItems = sortItems(filteredItems, selectedOptions);

    // Rendering the Gallery component
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
                            <Option value={option.key} text={option.text}>
                                {option.text}
                            </Option>
                        ))}
                    </Combobox>
                </div>
            </div>
            <div className={styles.gallery}>
                {sortedItems.map((item, index) => (
                    <Card className={styles.galleryItem} key={index}>
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
                                                    <Badge appearance="outline" style={{ marginRight: '5px' }}>🔥 Active</Badge>
                                                </Tooltip>
                                            }
                                            <Badge appearance="filled" color="warning" icon={<Star16Filled />} key={index}>{item.stargazerCount}</Badge>
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
                                                    <Badge appearance="outline" style={{ marginRight: '5px' }}>🔥 Active</Badge>
                                                </Tooltip>
                                            }
                                            <Badge appearance="filled" color="warning" icon={<Star16Filled />} key={index}>{item.stargazerCount}</Badge>
                                        </div>
                                    </div>
                                }
                            />
                        )}

                        <CardPreview className={styles.cardBreakLine} />

                        <Subtitle1 style={{ maxHeight: '60px', height: '60px', fontSize: '16px' }}>
                            {item.fullName}
                        </Subtitle1>

                        <Text>
                            {item.description.length > 150 ?
                                <p>
                                    {item.description.substring(0, 150) + '... '}
                                </p>
                                :
                                item.description
                            }
                        </Text>

                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {item.topics.slice(0, 5).map((topic, index) => (
                                <Badge appearance="outline" key={index} style={{ marginRight: '2px', marginBottom: '2px' }}>{topic}</Badge>
                            ))}
                        </div>

                        <CardFooter className={styles.cardFooter}>
                            <Button icon={<OpenRegular fontSize={16} />} onClick={() => openInGitHub(item.url)}>Open in GitHub</Button>
                            <Button icon={<ArrowExpand16Regular fontSize={16} />} onClick={() => openDialog(item)}>See more...</Button>
                        </CardFooter>
                    </Card>
                ))}
                <Dialog
                    hidden={hideDialog}
                    onDismiss={closeDialog}
                >
                    <DialogSurface>
                        <DialogTitle className={styles.dialogTitle}>
                            {selectedItem?.fullName}
                            <div style={{ display: 'flex', gap: '5px', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                {isActive(selectedItem?.updatedAt) && 
                                    <Tooltip content={`Last update on: ${format(new Date(selectedItem?.updatedAt), 'yyyy-MM-dd')}`} relationship={'label'}>
                                        <Badge appearance="outline" style={{ marginRight: '5px' }}>🔥 Active</Badge>
                                    </Tooltip>
                                }
                                <Badge appearance="filled" color="warning" icon={<Star16Filled />}>{selectedItem?.stargazerCount}</Badge>
                                <Badge appearance="outline" icon={<Eye16Filled />}>{selectedItem?.watchers.totalCount}</Badge>
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
                                    <Text>
                                        {selectedItem?.description}
                                    </Text>
                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', flexDirection: 'column' }}>
                                        {selectedItem?.license.name && (
                                            <Badge appearance="tint" style={{ marginBottom: '4px' }}>License: {selectedItem?.license.name}</Badge>
                                        )}
                                        <Badge appearance="tint" style={{ marginBottom: '4px' }}>Good 1st Issues: {selectedItem?.openedGoodFirstIssues}</Badge>
                                        <Badge appearance="tint" style={{ marginBottom: '4px' }}>Help Wanted Issues: {selectedItem?.openedHelpWantedIssues}</Badge>
                                        {selectedItem?.language && (
                                            <Badge appearance="tint" style={{ marginBottom: '4px' }}>Language: {selectedItem?.language}</Badge>
                                        )}
                                        {selectedItem?.latestRelease && (
                                            <Badge appearance="tint" style={{ marginBottom: '4px' }}>Latest Release: {selectedItem?.latestRelease.tagName} ({format(new Date(selectedItem?.latestRelease.publishedAt), 'yyyy-MM-dd')})</Badge>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                    {selectedItem?.topics.map((topic, index) => (
                                        <Badge appearance="outline" key={index} style={{ marginRight: '2px', marginBottom: '1px' }}>{topic}</Badge>
                                    ))}
                                </div>
                            </DialogBody>
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="secondary" onClick={closeDialog}>Close</Button>
                            <Button appearance="primary" onClick={() => openInGitHub(selectedItem?.url)}>Open in GitHub</Button>
                        </DialogActions>
                    </DialogSurface>
                </Dialog>
            </div>
        </div>
    );
};

// Exporting the Gallery component
export default Gallery;