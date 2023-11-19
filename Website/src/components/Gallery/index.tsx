// Importing necessary libraries and components
import React, { useState } from 'react';
import { DocumentCard, DocumentCardDetails, DocumentCardTitle, Dialog, DialogType, Link } from '@fluentui/react';

import {
    makeStyles,
    Body1,
    Caption1,
    Button,
    shorthands,
    Subtitle1,
    Text,
    Badge,
} from "@fluentui/react-components";

import {
    ArrowReplyRegular,
    ShareRegular
} from "@fluentui/react-icons";

import {
    Card,
    CardFooter,
    CardHeader,
    CardPreview,
} from "@fluentui/react-components";

import {
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogActions,
    DialogContent,
} from "@fluentui/react-components";

import { OpenRegular, ArrowExpand16Regular, Star16Filled } from "@fluentui/react-icons";

import styles from './styles.module.css'

// Filter the items based on the selected criteria in the FilterPane
function filterItems(items, hasGoodFirstIssueChecked, hasHelpWantedIssueChecked, hasCodeOfConductChecked, selectedTopics, selectedLanguages, selectedLicenses, selectedOwners) {
    let filteredItems = items;
    
    // Filter based on 'hasGoodFirstIssues' status
    if (hasGoodFirstIssueChecked) {
        filteredItems = filteredItems.filter(item => item.hasGoodFirstIssues);
    }

    // Filter based on 'hasHelpWantedIssues' status
    if (hasHelpWantedIssueChecked) {
        filteredItems = filteredItems.filter(item => item.hasHelpWantedIssues);
    }

    // Filter based on the 'codeOfConduct' property is not null and 'codeOfConduct.name' is not null
    if (hasCodeOfConductChecked) {
        filteredItems = filteredItems.filter(item => item.codeOfConduct != null && item.codeOfConduct.name != null);
    }

    // Filter based on selected topics - should include all selected topics
    if (selectedTopics.length > 0) {
        filteredItems = filteredItems.filter(item =>
            selectedTopics.every(topic => item.topics.includes(topic))
        );
    }

    // Filter based on selected languages - should include all selected languages
    if (selectedLanguages.length > 0) {
        filteredItems = filteredItems.filter(item =>
            selectedLanguages.every(language => item.languages.includes(language))
        );
    }

    // Filter based on selected licenses (check 'license.name' property) - should include any of the selected licenses
    if (selectedLicenses.length > 0) {
        filteredItems = filteredItems.filter(item =>
            selectedLicenses.includes(item.license.name)
        );
    }

    // Filter based on selected owners (check 'owner.login' property) - should include any of the selected owners
    if (selectedOwners.length > 0) {
        filteredItems = filteredItems.filter(item =>
            selectedOwners.includes(item.owner.login)
        );
    }

    return filteredItems;
}

// Defining the Gallery component
const Gallery = ({ items, hasGoodFirstIssueChecked, hasHelpWantedIssueChecked, hasCodeOfConductChecked, selectedTopics = [], selectedLanguages = [], selectedLicenses = [], selectedOwners = [] }) => {
    const [selectedItem, setSelectedItem] = useState(null);
    const [hideDialog, setHideDialog] = useState(true);
    
    // Filter items based on selected criteria
    const filteredItems = filterItems(items, hasGoodFirstIssueChecked, hasHelpWantedIssueChecked, hasCodeOfConductChecked, selectedTopics, selectedLanguages, selectedLicenses, selectedOwners);

    const openDialog = (item) => {
        setSelectedItem(item);
        setHideDialog(false);
    }

    const closeDialog = () => {
        setHideDialog(true);
    }
    
    // Function to open item.url in a new tab
    const openInGitHub = (url) => {
        window.open(url, "_blank");
    }

    // Rendering the Gallery component
    return (
            <div className={styles.gallery}>
                {filteredItems.map((item, index) => (
                    <Card className={styles.galleryItem}>
                        {(["microsoft", "azure"].includes(item.owner.login.toLowerCase()) ? (
                            <CardHeader
                                header={
                                    <div className={styles.cardHeader}>
                                        <div className={styles.cardHeaderLeftContent}>
                                            <img src="/PowerPlatform-OpenSource-Hub/img/Microsoft.svg" alt='Microsoft logo' width="16px" height="16px" style={{ paddingRight: '5px' }} />
                                            <Body1>
                                                Microsoft Authored
                                            </Body1>
                                        </div>
                                        <Badge appearance="filled" color="warning" icon={<Star16Filled />} key={index}>{item.stargazerCount}</Badge>
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
                                        <Badge appearance="filled" color="warning" icon={<Star16Filled />} key={index}>{item.stargazerCount}</Badge>
                                    </div>
                                }
                            />
                        ))}

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
                        

                        <CardPreview className={styles.cardBreakLine} />

                        <CardFooter className={styles.cardFooter}>
                            <Button icon={<OpenRegular fontSize={16} />} onClick={() => openInGitHub(item.url)}>Open in GitHub</Button>
                            {(item.description.length > 150 || item.topics.length > 5) && (
                                <Button icon={<ArrowExpand16Regular fontSize={16} />} onClick={() => openDialog(item)}>See more...</Button>
                            )}
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
                            <Badge appearance="filled" color="warning" icon={<Star16Filled />}>{selectedItem?.stargazerCount}</Badge>
                        </DialogTitle>
                        <DialogContent style={{ marginBottom: '16px', marginTop: '16px' }}>
                            <DialogBody>
                                <Text>
                                    {selectedItem?.description}
                                </Text>
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
      );
};

// Exporting the Gallery component
export default Gallery;